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

        // Place separate deposit hold if no insurance was selected
        const depositAmountCents = parseInt(session.metadata?.depositAmountCents || '0');
        if (depositAmountCents > 0) {
          try {
            const paymentIntentId = session.payment_intent as string;
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            const paymentMethodId = paymentIntent.payment_method as string;
            const customerId = session.customer as string;

            if (paymentMethodId && customerId) {
              // Check if deposit was already placed (avoid duplicates from page refresh)
              const idsToCheck = allBookingIds.length > 0 ? allBookingIds : [bookingId];
              const existingBooking = await getBookingById(idsToCheck[0]);
              if (!existingBooking?.depositIntentId) {
                const depositIntent = await stripe.paymentIntents.create({
                  amount: depositAmountCents,
                  currency: 'usd',
                  customer: customerId,
                  payment_method: paymentMethodId,
                  capture_method: 'manual',
                  confirm: true,
                  off_session: true,
                  description: `Security deposit hold - Booking ${bookingId}`,
                  metadata: {
                    type: 'deposit_hold',
                    bookingId,
                    allBookingIds: allBookingIds.join(','),
                  },
                });

                depositAmount = depositAmountCents / 100;
                depositStatus = 'held';

                if (supabase) {
                  for (const bid of idsToCheck) {
                    await supabase.from('bookings').update({
                      deposit_intent_id: depositIntent.id,
                      deposit_amount: depositAmount,
                      deposit_status: 'held',
                    }).eq('id', bid);
                  }
                }
              } else {
                depositAmount = existingBooking.depositAmount || depositAmountCents / 100;
                depositStatus = existingBooking.depositStatus || 'held';
              }
            }
          } catch (depositErr) {
            console.error('Deposit hold error:', depositErr);
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
