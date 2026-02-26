import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { cookies } from 'next/headers';

export async function GET() {
  // Check auth
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    // Fetch recent checkout sessions from Stripe
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ['data.line_items'],
    });

    const bookings = sessions.data
      .filter(s => s.payment_status === 'paid')
      .map(s => ({
        id: s.metadata?.bookingId || s.id,
        date: s.metadata?.date || '',
        startTime: s.metadata?.startTime || '',
        customerName: s.metadata?.customerName || s.customer_details?.name || 'Unknown',
        customerEmail: s.customer_details?.email || s.customer_email || '',
        jetSkiId: s.metadata?.jetSkiId || '',
        timeSlotId: s.metadata?.timeSlotId || '',
        totalPrice: (s.amount_total || 0) / 100,
        status: 'confirmed' as const,
        createdAt: new Date(s.created * 1000).toISOString(),
        stripeSessionId: s.id,
        isManual: false,
      }));

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.date === todayStr);
    const todayRevenue = todayBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    return NextResponse.json({
      bookings,
      stats: {
        totalBookings: bookings.length,
        totalRevenue,
        todayBookings: todayBookings.length,
        todayRevenue,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to fetch Stripe data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
