import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  return NextResponse.json({
    jetSkis: store.jetSkis,
    timeSlots: store.timeSlots,
    blackoutDates: store.blackoutDates,
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (body.jetSkis) {
    store.jetSkis = body.jetSkis;
  }
  if (body.timeSlots) {
    store.timeSlots = body.timeSlots;
  }
  if (body.blackoutDates) {
    store.blackoutDates = body.blackoutDates;
  }

  return NextResponse.json({
    jetSkis: store.jetSkis,
    timeSlots: store.timeSlots,
    blackoutDates: store.blackoutDates,
  });
}
