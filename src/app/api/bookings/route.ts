import { NextRequest, NextResponse } from 'next/server';
import { getBookings, getTimeSlots, getAvailableStartTimes, getJetSkis, isAvailable, createBooking, updateBookingStatus } from '@/lib/db';
import { generateId, isWeekendDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const jetSkiId = searchParams.get('jetSkiId');
  const timeSlotId = searchParams.get('timeSlotId');

  // If requesting available times for a specific jet ski, date, and duration
  if (date && jetSkiId && timeSlotId) {
    const slots = await getTimeSlots();
    const slot = slots.find(ts => ts.id === timeSlotId);
    if (!slot) return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });

    let times: string[];

    if (jetSkiId === 'both') {
      const allJetSkis = await getJetSkis();
      const availableJetSkis = allJetSkis.filter(js => js.status === 'available');
      const timeSets = await Promise.all(
        availableJetSkis.map(js => getAvailableStartTimes(js.id, date, slot.durationMinutes))
      );
      times = timeSets.reduce((acc, t) => acc.filter(time => t.includes(time)));
    } else {
      times = await getAvailableStartTimes(jetSkiId, date, slot.durationMinutes);
    }

    // Filter out past times if the requested date is today
    const tzOffset = searchParams.get('tzOffset');
    const now = new Date();
    if (tzOffset) {
      const clientNow = new Date(now.getTime() - parseInt(tzOffset) * 60000);
      const clientDateStr = clientNow.toISOString().split('T')[0];
      if (date === clientDateStr) {
        const clientHours = clientNow.getUTCHours();
        const clientMinutes = clientNow.getUTCMinutes();
        const nowMinutes = clientHours * 60 + clientMinutes;
        times = times.filter(t => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m > nowMinutes;
        });
      }
    }

    return NextResponse.json({ availableTimes: times });
  }

  // Return all bookings (admin)
  const bookings = await getBookings();
  return NextResponse.json({ bookings });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { jetSkiId, date, timeSlotId, startTime, customerName, customerEmail, customerPhone, isManual } = body;

  if (!jetSkiId || !date || !timeSlotId || !startTime || !customerName || !customerEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const slots = await getTimeSlots();
  const slot = slots.find(ts => ts.id === timeSlotId);
  if (!slot) return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });

  if (!(await isAvailable(jetSkiId, date, startTime, slot.durationMinutes))) {
    return NextResponse.json({ error: 'This slot is no longer available' }, { status: 409 });
  }

  const totalPrice = isWeekendDate(date) ? slot.weekendPrice : slot.weekdayPrice;

  const booking = {
    id: `bk-${generateId()}`,
    jetSkiId,
    date,
    timeSlotId,
    startTime,
    customerName,
    customerEmail,
    customerPhone: customerPhone || '',
    totalPrice,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString(),
    isManual: isManual || false,
  };

  await createBooking(booking);
  return NextResponse.json({ booking }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body;

  const booking = await updateBookingStatus(id, status);
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  return NextResponse.json({ booking });
}
