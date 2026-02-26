import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { store } from '@/lib/store';
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

  const slot = store.timeSlots.find(ts => ts.id === timeSlotId);
  if (!slot) return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });

  // Determine which jet skis to book
  const isBoth = jetSkiId === 'both';
  const jetSkiIds = isBoth
    ? store.jetSkis.filter(js => js.status === 'available').map(js => js.id)
    : [jetSkiId];

  // Check availability for all requested jet skis
  for (const jsId of jetSkiIds) {
    if (!store.isAvailable(jsId, date, startTime, slot.durationMinutes)) {
      return NextResponse.json({ error: 'This slot is no longer available' }, { status: 409 });
    }
  }

  const pricePerJetSki = isWeekendDate(date) ? slot.weekendPrice : slot.weekdayPrice;
  const totalPrice = pricePerJetSki * jetSkiIds.length;
  const jetSkiNames = jetSkiIds.map(id => store.jetSkis.find(js => js.id === id)?.name || 'Jet Ski').join(' & ');

  // If Stripe is not configured or key is invalid, fall back to direct booking (no payment)
  if (!stripe) {
    console.warn('Stripe not initialized — check STRIPE_SECRET_KEY env var. Falling back to no-payment mode.');
    const bookings = jetSkiIds.map(jsId => ({
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
      waiver: waiver || undefined,
    }));
    bookings.forEach(b => store.bookings.push(b));
    return NextResponse.json({ booking: { ...bookings[0], totalPrice }, mode: 'no-payment' }, { status: 201 });
  }

  // Create pending bookings to hold the slots
  const primaryBookingId = `bk-${generateId()}`;
  const pendingBookings = jetSkiIds.map((jsId, i) => ({
    id: i === 0 ? primaryBookingId : `bk-${generateId()}`,
    jetSkiId: jsId,
    date,
    timeSlotId,
    startTime,
    customerName,
    customerEmail,
    customerPhone: customerPhone || '',
    totalPrice: pricePerJetSki,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    isManual: false,
    waiver: waiver || undefined,
  }));
  pendingBookings.forEach(b => store.bookings.push(b));
  const allBookingIds = pendingBookings.map(b => b.id);

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
            unit_amount: Math.round(pricePerJetSki * 100), // Stripe uses cents
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
    for (const bid of allBookingIds) {
      const idx = store.bookings.findIndex(b => b.id === bid);
      if (idx !== -1) store.bookings.splice(idx, 1);
    }

    const message = error instanceof Error ? error.message : 'Payment setup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
