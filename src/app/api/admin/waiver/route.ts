import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getWaiver } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Check admin auth
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bookingId = request.nextUrl.searchParams.get('bookingId');
  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  const waiver = await getWaiver(bookingId);
  if (!waiver) {
    return NextResponse.json({ error: 'No waiver found' }, { status: 404 });
  }

  return NextResponse.json({ waiver });
}
