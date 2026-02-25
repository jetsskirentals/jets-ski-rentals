import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { generateId, isWeekendDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const jetSkiId = searchParams.get('jetSkiId');
  const timeSlotId = searchParams.get('timeSlotId');

  // If requesting available times for a specific jet ski, date, and duration
  if (date && jetSkiId && timeSlotId) {
    const slot = store.timeSlots.find(ts => ts.id === timeSlotId);
    if (!slot) return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });
    const times = store.getAvailableStartTimes(jetSkiId, date, slot.durationMinutes);
    return NextResponse.json({ availableTimes: times });
  }

  // Return all bookings (admin)
  return NextResponse.json({ bookings: store.bookings });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { jetSkiId, date, timeSlotId, startTime, customerName, customerEmail, customerPhone, isManual, waiver } = body;

  // Validate
  if (!jetSkiId || !date || !timeSlotId || !startTime || !customerName || !customerEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const slot = store.timeSlots.find(ts => ts.id === timeSlotId);
  if (!slot) return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });

  // Check availability
  if (!store.isAvailable(jetSkiId, date, startTime, slot.durationMinutes)) {
    return NextResponse.json({ error: 'This slot is no longer available' }, { status: 409 });
  }

  const totalPrice = isWeekendDate(date) ? slot.weekendPrice : slot.weekdayPrice;

  const booking: typeof store.bookings[0] = {
    id: `bk-${generateId()}`,
    jetSkiId,
    date,
    timeSlotId,
    startTime,
    customerName,
    customerEmail,
    customerPhone: customerPhone || '',
    totalPrice,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    isManual: isManual || false,
    waiver: waiver || undefined,
  };

  store.bookings.push(booking);
  return NextResponse.json({ booking }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body;

  const booking = store.bookings.find(b => b.id === id);
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  if (status) booking.status = status;

  return NextResponse.json({ booking });
}
