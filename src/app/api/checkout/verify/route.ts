import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getBookingById, updateBookingStatus } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
  }

  const booking = await getBookingById(bookingId);
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  let depositStatus = 'none';
  let depositAmount = 0;

  // If Stripe is configured and we have a session ID, verify payment
  if (stripe && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        // Get the payment intent
        const paymentIntentId = session.payment_intent as string;
        if (paymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

          // If the payment intent is uncaptured (manual capture mode), partially capture only the rental amount
          if (paymentIntent.status === 'requires_capture') {
            const rentalAmountCents = parseInt(paymentIntent.metadata?.rental_amount_cents || session.metadata?.rentalAmountCents || '0');
            const depositAmountCents = parseInt(paymentIntent.metadata?.deposit_amount_cents || session.metadata?.depositAmountCents || '0');

            if (rentalAmountCents > 0) {
              // Partially capture only the rental amount; the deposit remains as a hold
              await stripe.paymentIntents.capture(paymentIntentId, {
                amount_to_capture: rentalAmountCents,
              });

              depositAmount = depositAmountCents / 100;
              depositStatus = 'held';

              // Store deposit info on all related bookings
              if (supabase) {
                const allBookingIds = session.metadata?.allBookingIds?.split(',') || [bookingId];
                for (const bid of allBookingIds) {
                  await supabase.from('bookings').update({
                    deposit_intent_id: paymentIntentId,
                    deposit_amount: depositAmount,
                    deposit_status: 'held',
                  }).eq('id', bid);
                }
              }
            }
          }
        }

        if (booking.status !== 'confirmed') {
          await updateBookingStatus(bookingId, 'confirmed');
          booking.status = 'confirmed';
        }

        // Also confirm any other bookings in the same session
        const allBookingIds = session.metadata?.allBookingIds?.split(',') || [];
        for (const bid of allBookingIds) {
          if (bid !== bookingId) {
            await updateBookingStatus(bid, 'confirmed');
          }
        }
      }
    } catch (err) {
      console.error('Verify error:', err);
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
      depositStatus,
      depositAmount,
    },
  });
}
