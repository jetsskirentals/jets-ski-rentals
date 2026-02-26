import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

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
