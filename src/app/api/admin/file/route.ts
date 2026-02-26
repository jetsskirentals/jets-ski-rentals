import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSignedUrl } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Check admin auth
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  const signedUrl = await getSignedUrl(path);
  if (!signedUrl) {
    return NextResponse.json({ error: 'Could not generate URL' }, { status: 500 });
  }

  return NextResponse.json({ url: signedUrl });
}
