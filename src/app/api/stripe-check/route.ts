import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// Same sanitize function as in stripe.ts for the direct test
function sanitizeKey(key: string): string {
  const replacements: Record<string, string> = {
    '\u0410': 'A', '\u0412': 'B', '\u0421': 'C', '\u0415': 'E', '\u041D': 'H',
    '\u041A': 'K', '\u041C': 'M', '\u041E': 'O', '\u0420': 'P', '\u0422': 'T',
    '\u0425': 'X', '\u0430': 'a', '\u0441': 'c', '\u0435': 'e', '\u043E': 'o',
    '\u0440': 'p', '\u0445': 'x', '\u0443': 'y', '\u0455': 's', '\u0456': 'i',
    '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2013': '-', '\u2014': '-',
    '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"',
    '\u00A0': ' ',
  };
  let sanitized = key;
  for (const [bad, good] of Object.entries(replacements)) {
    sanitized = sanitized.split(bad).join(good);
  }
  sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');
  return sanitized.trim();
}

export async function GET() {
  const keyExists = !!process.env.STRIPE_SECRET_KEY;
  const rawKey = process.env.STRIPE_SECRET_KEY?.trim() || '';
  const sanitizedKey = sanitizeKey(rawKey);
  const keyPrefix = sanitizedKey.substring(0, 12) || 'N/A';
  const keyLength = sanitizedKey.length;
  const hadBadChars = rawKey.length !== sanitizedKey.length;
  const stripeInitialized = !!stripe;

  // Test 1: Try via Stripe SDK (uses sanitized key)
  let sdkTest = 'not tested';
  if (stripe) {
    try {
      await stripe.balance.retrieve();
      sdkTest = 'success';
    } catch (e: unknown) {
      sdkTest = e instanceof Error ? `${e.constructor.name}: ${e.message}` : 'unknown error';
    }
  }

  // Test 2: Try direct HTTP call with sanitized key
  let directTest = 'not tested';
  if (sanitizedKey) {
    try {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: {
          'Authorization': `Bearer ${sanitizedKey}`,
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
    hadBadChars,
    stripeInitialized,
    sdkTest,
    directTest,
  });
}
