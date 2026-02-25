import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { store } from '@/lib/store';
import { generateId, isWeekendDate } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const body = await request.json();
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

  // Check availability
  if (!store.isAvailable(jetSkiId, date, startTime, slot.durationMinutes)) {
    return NextResponse.json({ error: 'This slot is no longer available' }, { status: 409 });
  }

  const totalPrice = isWeekendDate(date) ? slot.weekendPrice : slot.weekdayPrice;
  const jetSki = store.jetSkis.find(js => js.id === jetSkiId);

  // If Stripe is not configured, fall back to direct booking (no payment)
  if (!stripe) {
    const booking = {
      id: `bk-${generateId()}`,
      jetSkiId,
      date,
      timeSlotId,
      startTime,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      totalPrice,
      status: 'confirmed' as const,
      createdAt: new Date().toISOString(),
      isManual: false,
      waiver: waiver || undefined,
    };
    store.bookings.push(booking);
    return NextResponse.json({ booking, mode: 'no-payment' }, { status: 201 });
  }

  // Create a pending booking to hold the slot
  const bookingId = `bk-${generateId()}`;
  const pendingBooking = {
    id: bookingId,
    jetSkiId,
    date,
    timeSlotId,
    startTime,
    customerName,
    customerEmail,
    customerPhone: customerPhone || '',
    totalPrice,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    isManual: false,
    waiver: waiver || undefined,
  };
  store.bookings.push(pendingBooking);

  // Create Stripe Checkout Session
  const baseUrl = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Jet Ski Rental — ${slot.label}`,
              description: `${jetSki?.name || 'Jet Ski'} on ${date} at ${startTime}`,
            },
            unit_amount: totalPrice * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${baseUrl}/booking?cancelled=true`,
      metadata: {
        bookingId,
        jetSkiId,
        date,
        timeSlotId,
        startTime,
        customerName,
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      bookingId,
    });
  } catch (error: unknown) {
    // Remove the pending booking if Stripe fails
    const idx = store.bookings.findIndex(b => b.id === bookingId);
    if (idx !== -1) store.bookings.splice(idx, 1);

    const message = error instanceof Error ? error.message : 'Payment setup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
