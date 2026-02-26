import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  const keyExists = !!process.env.STRIPE_SECRET_KEY;
  const keyTrimmed = process.env.STRIPE_SECRET_KEY?.trim();
  const keyPrefix = keyTrimmed?.substring(0, 12) || 'N/A';
  const keyLength = keyTrimmed?.length || 0;
  const stripeInitialized = !!stripe;

  // Test 1: Try via Stripe SDK
  let sdkTest = 'not tested';
  if (stripe) {
    try {
      await stripe.balance.retrieve();
      sdkTest = 'success';
    } catch (e: unknown) {
      sdkTest = e instanceof Error ? `${e.constructor.name}: ${e.message}` : 'unknown error';
    }
  }

  // Test 2: Try direct HTTP call to Stripe API (bypass SDK)
  let directTest = 'not tested';
  if (keyTrimmed) {
    try {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: {
          'Authorization': `Bearer ${keyTrimmed}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        directTest = 'success';
      } else {
        directTest = `HTTP ${res.status}: ${data.error?.message || JSON.stringify(data)}`;
      }
    } catch (e: unknown) {
      directTest = e instanceof Error ? `${e.constructor.name}: ${e.message}` : 'unknown error';
    }
  }

  return NextResponse.json({
    keyExists,
    keyPrefix,
    keyLength,
    stripeInitialized,
    sdkTest,
    directTest,
  });
}
