import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getTimeSlots, getJetSkis, isAvailable, createBooking, createWaiver, deleteBookingsByIds } from '@/lib/db';
import { generateId, isWeekendDate } from '@/lib/utils';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }
  const {
    jetSkiId, date, timeSlotId, startTime,
    customerName, customerEmail, customerPhone,
    waiver,
  } = body;

  // Validate required fields
  if (!jetSkiId || !date || !timeSlotId || !startTime || !customerName || !customerEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const timeSlots = await getTimeSlots();
  const slot = timeSlots.find(ts => ts.id === timeSlotId);
  if (!slot) return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });

  // Determine which jet skis to book
  const isBoth = jetSkiId === 'both';
  const allJetSkis = await getJetSkis();
  const jetSkiIds = isBoth
    ? allJetSkis.filter(js => js.status === 'available').map(js => js.id)
    : [jetSkiId];

  // Check availability for all requested jet skis
  for (const jsId of jetSkiIds) {
    if (!(await isAvailable(jsId, date, startTime, slot.durationMinutes))) {
      return NextResponse.json({ error: 'This slot is no longer available' }, { status: 409 });
    }
  }

  const pricePerJetSki = isWeekendDate(date) ? slot.weekendPrice : slot.weekdayPrice;
  const totalPrice = pricePerJetSki * jetSkiIds.length;
  const jetSkiNames = jetSkiIds.map(id => allJetSkis.find(js => js.id === id)?.name || 'Jet Ski').join(' & ');

  // If Stripe is not configured, fall back to direct booking (no payment)
  if (!stripe) {
    console.warn('Stripe not initialized — falling back to no-payment mode.');
    const bookings = [];
    for (const jsId of jetSkiIds) {
      const booking = {
        id: `bk-${generateId()}`,
        jetSkiId: jsId,
        date,
        timeSlotId,
        startTime,
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        totalPrice: pricePerJetSki,
        status: 'confirmed' as const,
        createdAt: new Date().toISOString(),
        isManual: false,
      };
      await createBooking(booking);
      if (waiver) {
        await createWaiver(booking.id, {
          participantDOB: waiver.participantDOB || '',
          participantAddress: waiver.participantAddress || '',
          driversLicenseId: waiver.driversLicenseId || '',
          signaturePath: waiver.signaturePath,
          idPhotoPath: waiver.idPhotoPath,
          boaterIdPhotoPath: waiver.boaterIdPhotoPath,
          liabilityVideoPath: waiver.liabilityVideoPath,
          safetySignaturePath: waiver.safetySignaturePath,
          guardianSignaturePath: waiver.guardianSignaturePath,
          photoVideoOptOut: waiver.photoVideoOptOut || false,
          isMinor: waiver.isMinor || false,
          minorName: waiver.minorName,
          minorAge: waiver.minorAge,
          guardianName: waiver.guardianName,
          signedAt: waiver.signedAt || new Date().toISOString(),
          safetyBriefingSignedAt: waiver.safetyBriefingSignedAt || new Date().toISOString(),
        });
      }
      bookings.push(booking);
    }
    return NextResponse.json({ booking: { ...bookings[0], totalPrice }, mode: 'no-payment' }, { status: 201 });
  }

  // Create pending bookings to hold the slots
  const primaryBookingId = `bk-${generateId()}`;
  const allBookingIds: string[] = [];
  for (let i = 0; i < jetSkiIds.length; i++) {
    const bookingId = i === 0 ? primaryBookingId : `bk-${generateId()}`;
    allBookingIds.push(bookingId);
    await createBooking({
      id: bookingId,
      jetSkiId: jetSkiIds[i],
      date,
      timeSlotId,
      startTime,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      totalPrice: pricePerJetSki,
      status: 'pending',
      createdAt: new Date().toISOString(),
      isManual: false,
    });
    // Save waiver for each booking
    if (waiver) {
      await createWaiver(bookingId, {
        participantDOB: waiver.participantDOB || '',
        participantAddress: waiver.participantAddress || '',
        driversLicenseId: waiver.driversLicenseId || '',
        signaturePath: waiver.signaturePath,
        idPhotoPath: waiver.idPhotoPath,
        boaterIdPhotoPath: waiver.boaterIdPhotoPath,
        liabilityVideoPath: waiver.liabilityVideoPath,
        safetySignaturePath: waiver.safetySignaturePath,
        guardianSignaturePath: waiver.guardianSignaturePath,
        photoVideoOptOut: waiver.photoVideoOptOut || false,
        isMinor: waiver.isMinor || false,
        minorName: waiver.minorName,
        minorAge: waiver.minorAge,
        guardianName: waiver.guardianName,
        signedAt: waiver.signedAt || new Date().toISOString(),
        safetyBriefingSignedAt: waiver.safetyBriefingSignedAt || new Date().toISOString(),
      });
    }
  }

  // Create Stripe Checkout Session
  const baseUrl = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Jet Ski Rental - ${slot.label}`,
              description: `${jetSkiNames} on ${date} at ${startTime}`,
            },
            unit_amount: Math.round(pricePerJetSki * 100),
          },
          quantity: jetSkiIds.length,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${primaryBookingId}`,
      cancel_url: `${baseUrl}/booking?cancelled=true`,
      metadata: {
        bookingId: primaryBookingId,
        allBookingIds: allBookingIds.join(','),
        jetSkiId: isBoth ? 'both' : jetSkiId,
        date,
        timeSlotId,
        startTime,
        customerName,
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      bookingId: primaryBookingId,
    });
  } catch (error: unknown) {
    // Remove all pending bookings if Stripe fails
    await deleteBookingsByIds(allBookingIds);

    const message = error instanceof Error ? error.message : 'Payment setup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
