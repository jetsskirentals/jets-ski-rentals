import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateBookingStatus } from '@/lib/db';
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

      // Handle partial capture for deposit holds
      const paymentIntentId = session.payment_intent as string;
      if (paymentIntentId) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (paymentIntent.status === 'requires_capture') {
            const rentalAmountCents = parseInt(paymentIntent.metadata?.rental_amount_cents || session.metadata?.rentalAmountCents || '0');
            const depositAmountCents = parseInt(paymentIntent.metadata?.deposit_amount_cents || session.metadata?.depositAmountCents || '0');

            if (rentalAmountCents > 0) {
              await stripe.paymentIntents.capture(paymentIntentId, {
                amount_to_capture: rentalAmountCents,
              });

              if (supabase && idsToConfirm.length > 0) {
                for (const bid of idsToConfirm) {
                  await supabase.from('bookings').update({
                    deposit_intent_id: paymentIntentId,
                    deposit_amount: depositAmountCents / 100,
                    deposit_status: 'held',
                  }).eq('id', bid);
                }
              }
            }
          }
        } catch (captureErr) {
          console.error('Deposit capture error (webhook):', captureErr);
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
