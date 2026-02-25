import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Stripe will be initialized when keys are configured
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
