import Stripe from 'stripe';

// Sanitize API key: replace common Unicode/Cyrillic lookalike characters with ASCII equivalents.
// This fixes keys corrupted by phone keyboard autocorrect or copy-paste issues.
function sanitizeKey(key: string): string {
  const replacements: Record<string, string> = {
    '\u0410': 'A', '\u0412': 'B', '\u0421': 'C', '\u0415': 'E', '\u041D': 'H',
    '\u041A': 'K', '\u041C': 'M', '\u041E': 'O', '\u0420': 'P', '\u0422': 'T',
    '\u0425': 'X', '\u0430': 'a', '\u0441': 'c', '\u0435': 'e', '\u043E': 'o',
    '\u0440': 'p', '\u0445': 'x', '\u0443': 'y', '\u0455': 's', '\u0456': 'i',
    '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2013': '-', '\u2014': '-',
    '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"',
    '\u00A0': ' ',  // non-breaking space
  };
  let sanitized = key;
  for (const [bad, good] of Object.entries(replacements)) {
    sanitized = sanitized.split(bad).join(good);
  }
  // Strip any remaining non-ASCII characters
  sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');
  return sanitized.trim();
}

const rawKey = process.env.STRIPE_SECRET_KEY?.trim() || '';
const stripeSecretKey = sanitizeKey(rawKey);

// Stripe will be initialized when keys are configured
let stripe: Stripe | null = null;
if (stripeSecretKey) {
  try {
    stripe = new Stripe(stripeSecretKey, {
      httpClient: Stripe.createNodeHttpClient(),
      timeout: 30000,
    });
  } catch (e) {
    console.error('Stripe init error:', e instanceof Error ? e.message : e);
    console.error('Key starts with:', stripeSecretKey.substring(0, 8));
    console.error('Key length:', stripeSecretKey.length);
  }
}
export { stripe };

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || '';
