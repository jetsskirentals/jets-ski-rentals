import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

const DEPOSIT_AMOUNT_CENTS = 30000; // $300.00

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { bookingIds, customerEmail, jetSkiCount } = body;
  if (!bookingIds?.length || !customerEmail || !jetSkiCount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const totalDeposit = DEPOSIT_AMOUNT_CENTS * jetSkiCount;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalDeposit,
      currency: 'usd',
      capture_method: 'manual',
      receipt_email: customerEmail,
      description: `Security deposit - ${jetSkiCount} jet ski(s) - Jet's Ski Rentals`,
      metadata: {
        type: 'security_deposit',
        bookingIds: bookingIds.join(','),
        jetSkiCount: String(jetSkiCount),
      },
    });

    // Store the deposit intent ID on the bookings
    if (supabase) {
      for (const bookingId of bookingIds) {
        await supabase.from('bookings').update({
          deposit_intent_id: paymentIntent.id,
          deposit_amount: totalDeposit / 100,
          deposit_status: 'pending',
        }).eq('id', bookingId);
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      depositAmount: totalDeposit / 100,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create deposit hold';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
