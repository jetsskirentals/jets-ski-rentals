import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  return NextResponse.json({ settings: store.settings });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  store.settings = { ...store.settings, ...body };
  return NextResponse.json({ settings: store.settings });
}
