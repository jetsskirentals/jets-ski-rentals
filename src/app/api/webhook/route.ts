import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getBookingById, updateBookingStatus } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const allBookingIds = session.metadata?.allBookingIds?.split(',') || [];
      const bookingId = session.metadata?.bookingId;

      const idsToConfirm = allBookingIds.length > 0 ? allBookingIds : (bookingId ? [bookingId] : []);
      for (const bid of idsToConfirm) {
        await updateBookingStatus(bid, 'confirmed');
      }

      // Place separate deposit hold if no insurance was selected
      const depositAmountCents = parseInt(session.metadata?.depositAmountCents || '0');
      if (depositAmountCents > 0 && idsToConfirm.length > 0) {
        try {
          const existingBooking = await getBookingById(idsToConfirm[0]);
          if (!existingBooking?.depositIntentId) {
            const paymentIntentId = session.payment_intent as string;
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            const paymentMethodId = paymentIntent.payment_method as string;
            const customerId = session.customer as string;

            if (paymentMethodId && customerId) {
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
                  bookingId: bookingId || '',
                  allBookingIds: allBookingIds.join(','),
                },
              });

              if (supabase) {
                for (const bid of idsToConfirm) {
                  await supabase.from('bookings').update({
                    deposit_intent_id: depositIntent.id,
                    deposit_amount: depositAmountCents / 100,
                    deposit_status: 'held',
                  }).eq('id', bid);
                }
              }
            }
          }
        } catch (depositErr) {
          console.error('Deposit hold error (webhook):', depositErr);
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const allBookingIds = session.metadata?.allBookingIds?.split(',') || [];
      const bookingId = session.metadata?.bookingId;

      const idsToCancel = allBookingIds.length > 0 ? allBookingIds : (bookingId ? [bookingId] : []);
      for (const bid of idsToCancel) {
        await updateBookingStatus(bid, 'cancelled');
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
