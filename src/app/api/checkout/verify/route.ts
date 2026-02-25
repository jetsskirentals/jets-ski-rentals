import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { store } from '@/lib/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
  }

  const booking = store.bookings.find(b => b.id === bookingId);
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // If Stripe is configured and we have a session ID, verify payment
  if (stripe && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        booking.status = 'confirmed';
      }
    } catch {
      // If verification fails, still return booking data
    }
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      date: booking.date,
      startTime: booking.startTime,
      totalPrice: booking.totalPrice,
      status: booking.status,
      customerEmail: booking.customerEmail,
    },
  });
}
