import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  const keyExists = !!process.env.STRIPE_SECRET_KEY;
  const keyTrimmed = process.env.STRIPE_SECRET_KEY?.trim();
  const keyPrefix = keyTrimmed?.substring(0, 12) || 'N/A';
  const keyLength = keyTrimmed?.length || 0;
  const stripeInitialized = !!stripe;

  // Try a simple Stripe API call to verify the key works
  let apiTest = 'not tested';
  if (stripe) {
    try {
      await stripe.balance.retrieve();
      apiTest = 'success';
    } catch (e: unknown) {
      apiTest = e instanceof Error ? e.message : 'unknown error';
    }
  }

  return NextResponse.json({
    keyExists,
    keyPrefix,
    keyLength,
    stripeInitialized,
    apiTest,
  });
}
