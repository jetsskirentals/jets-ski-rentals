import { NextRequest, NextResponse } from 'next/server';
import { getJetSkis, getTimeSlots, getBlackoutDates, updateJetSkis, updateTimeSlots, updateBlackoutDates } from '@/lib/db';

export async function GET() {
  const [jetSkis, timeSlots, blackoutDates] = await Promise.all([
    getJetSkis(),
    getTimeSlots(),
    getBlackoutDates(),
  ]);
  return NextResponse.json({ jetSkis, timeSlots, blackoutDates });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (body.jetSkis) await updateJetSkis(body.jetSkis);
  if (body.timeSlots) await updateTimeSlots(body.timeSlots);
  if (body.blackoutDates) await updateBlackoutDates(body.blackoutDates);

  const [jetSkis, timeSlots, blackoutDates] = await Promise.all([
    getJetSkis(),
    getTimeSlots(),
    getBlackoutDates(),
  ]);
  return NextResponse.json({ jetSkis, timeSlots, blackoutDates });
}
