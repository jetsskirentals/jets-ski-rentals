import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // Admin auth check
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { customerEmail, customerName, amount, bookingId } = body;
  if (!customerEmail || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Email and amount are required' }, { status: 400 });
  }

  const amountCents = Math.round(amount * 100);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_intent_data: {
        capture_method: 'manual',
        description: `Security deposit hold${customerName ? ` - ${customerName}` : ''} - Jet's Ski Rentals`,
        metadata: {
          type: 'manual_deposit_hold',
          bookingId: bookingId || '',
          customerName: customerName || '',
        },
      },
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Security Deposit Hold',
              description: `Refundable security deposit for jet ski rental. This is a hold on your card, not a charge. It will be released after your rental.`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'manual_deposit_hold',
        bookingId: bookingId || '',
        customerName: customerName || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_URL || 'https://getwetwithjet.com'}/booking/success?deposit=held`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://getwetwithjet.com'}`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create deposit hold session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
