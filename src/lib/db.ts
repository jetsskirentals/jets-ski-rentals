import { supabase, STORAGE_BUCKET } from './supabase';
import { store } from './store';

// Types matching the existing store interfaces
export interface JetSki {
  id: string;
  name: string;
  description: string;
  image: string;
  status: 'available' | 'maintenance';
}

export interface TimeSlot {
  id: string;
  label: string;
  durationMinutes: number;
  weekdayPrice: number;
  weekendPrice: number;
}

export interface WaiverData {
  participantDOB: string;
  participantAddress: string;
  driversLicenseId: string;
  signaturePath?: string;
  idPhotoPath?: string;
  boaterIdPhotoPath?: string;
  liabilityVideoPath?: string;
  safetySignaturePath?: string;
  guardianSignaturePath?: string;
  photoVideoOptOut: boolean;
  isMinor: boolean;
  minorName?: string;
  minorAge?: string;
  guardianName?: string;
  signedAt: string;
  safetyBriefingSignedAt: string;
}

export interface Booking {
  id: string;
  jetSkiId: string;
  date: string;
  timeSlotId: string;
  startTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  isManual: boolean;
  stripeSessionId?: string;
  waiver?: WaiverData;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  approved: boolean;
}

export interface BlackoutDate {
  id: string;
  date: string;
  reason: string;
}

export interface Settings {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  operatingHoursStart: string;
  operatingHoursEnd: string;
}

// Helper: check if Supabase is available
function hasDB(): boolean {
  return !!supabase;
}

// ─── Time helpers ───

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// ─── Jet Skis ───

export async function getJetSkis(): Promise<JetSki[]> {
  if (!hasDB()) return store.jetSkis;
  const { data, error } = await supabase!.from('jet_skis').select('*');
  if (error) { console.error('getJetSkis error:', error); return store.jetSkis; }
  return data.map(r => ({
    id: r.id, name: r.name, description: r.description || '',
    image: r.image || '', status: r.status || 'available',
  }));
}

export async function updateJetSkis(jetSkis: JetSki[]): Promise<void> {
  if (!hasDB()) { store.jetSkis = jetSkis; return; }
  for (const js of jetSkis) {
    await supabase!.from('jet_skis').upsert({
      id: js.id, name: js.name, description: js.description,
      image: js.image, status: js.status,
    });
  }
}

// ─── Time Slots ───

export async function getTimeSlots(): Promise<TimeSlot[]> {
  if (!hasDB()) return store.timeSlots;
  const { data, error } = await supabase!.from('time_slots').select('*');
  if (error) { console.error('getTimeSlots error:', error); return store.timeSlots; }
  return data.map(r => ({
    id: r.id, label: r.label, durationMinutes: r.duration_minutes,
    weekdayPrice: Number(r.weekday_price), weekendPrice: Number(r.weekend_price),
  }));
}

export async function updateTimeSlots(slots: TimeSlot[]): Promise<void> {
  if (!hasDB()) { store.timeSlots = slots; return; }
  for (const s of slots) {
    await supabase!.from('time_slots').upsert({
      id: s.id, label: s.label, duration_minutes: s.durationMinutes,
      weekday_price: s.weekdayPrice, weekend_price: s.weekendPrice,
    });
  }
}

// ─── Blackout Dates ───

export async function getBlackoutDates(): Promise<BlackoutDate[]> {
  if (!hasDB()) return store.blackoutDates;
  const { data, error } = await supabase!.from('blackout_dates').select('*');
  if (error) { console.error('getBlackoutDates error:', error); return store.blackoutDates; }
  return data.map(r => ({ id: r.id, date: r.date, reason: r.reason || '' }));
}

export async function updateBlackoutDates(dates: BlackoutDate[]): Promise<void> {
  if (!hasDB()) { store.blackoutDates = dates; return; }
  // Replace all blackout dates
  await supabase!.from('blackout_dates').delete().neq('id', '');
  if (dates.length > 0) {
    await supabase!.from('blackout_dates').insert(
      dates.map(d => ({ id: d.id, date: d.date, reason: d.reason }))
    );
  }
}

// ─── Bookings ───

export async function getBookings(): Promise<Booking[]> {
  if (!hasDB()) return store.bookings;
  const { data, error } = await supabase!.from('bookings').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getBookings error:', error); return store.bookings; }
  return data.map(mapBookingRow);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  if (!hasDB()) return store.bookings.find(b => b.id === id) || null;
  const { data, error } = await supabase!.from('bookings').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapBookingRow(data);
}

export async function createBooking(booking: Omit<Booking, 'waiver'>): Promise<void> {
  if (!hasDB()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.bookings.push(booking as any);
    return;
  }
  const { error } = await supabase!.from('bookings').insert({
    id: booking.id,
    jet_ski_id: booking.jetSkiId,
    date: booking.date,
    time_slot_id: booking.timeSlotId,
    start_time: booking.startTime,
    customer_name: booking.customerName,
    customer_email: booking.customerEmail,
    customer_phone: booking.customerPhone || '',
    total_price: booking.totalPrice,
    status: booking.status,
    created_at: booking.createdAt,
    is_manual: booking.isManual,
    stripe_session_id: booking.stripeSessionId || null,
  });
  if (error) console.error('createBooking error:', error);
}

export async function updateBookingStatus(id: string, status: string): Promise<Booking | null> {
  if (!hasDB()) {
    const booking = store.bookings.find(b => b.id === id);
    if (booking) booking.status = status as Booking['status'];
    return booking || null;
  }
  const { data, error } = await supabase!.from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return null;
  return mapBookingRow(data);
}

export async function deleteBookingsByIds(ids: string[]): Promise<void> {
  if (!hasDB()) {
    for (const id of ids) {
      const idx = store.bookings.findIndex(b => b.id === id);
      if (idx !== -1) store.bookings.splice(idx, 1);
    }
    return;
  }
  await supabase!.from('bookings').delete().in('id', ids);
}

// ─── Availability ───

export async function isAvailable(jetSkiId: string, date: string, startTime: string, durationMinutes: number): Promise<boolean> {
  if (!hasDB()) return store.isAvailable(jetSkiId, date, startTime, durationMinutes);

  // Check jet ski status
  const jetSkis = await getJetSkis();
  const js = jetSkis.find(j => j.id === jetSkiId);
  if (!js || js.status === 'maintenance') return false;

  // Check blackout dates
  const blackouts = await getBlackoutDates();
  if (blackouts.some(bd => bd.date === date)) return false;

  // Check conflicting bookings
  const slots = await getTimeSlots();
  const { data: existingBookings } = await supabase!.from('bookings')
    .select('start_time, time_slot_id')
    .eq('jet_ski_id', jetSkiId)
    .eq('date', date)
    .neq('status', 'cancelled');

  if (!existingBookings) return true;

  const requestStart = timeToMinutes(startTime);
  const requestEnd = requestStart + durationMinutes;

  return !existingBookings.some(b => {
    const slot = slots.find(s => s.id === b.time_slot_id);
    if (!slot) return false;
    const bStart = timeToMinutes(b.start_time);
    const bEnd = bStart + slot.durationMinutes;
    return requestStart < bEnd && requestEnd > bStart;
  });
}

export async function getAvailableStartTimes(jetSkiId: string, date: string, durationMinutes: number): Promise<string[]> {
  if (!hasDB()) return store.getAvailableStartTimes(jetSkiId, date, durationMinutes);

  const settings = await getSettings();
  const start = timeToMinutes(settings.operatingHoursStart);
  const end = timeToMinutes(settings.operatingHoursEnd);
  const times: string[] = [];

  for (let t = start; t + durationMinutes <= end; t += 15) {
    const timeStr = minutesToTime(t);
    if (await isAvailable(jetSkiId, date, timeStr, durationMinutes)) {
      times.push(timeStr);
    }
  }
  return times;
}

// ─── Waivers ───

export async function createWaiver(bookingId: string, waiver: WaiverData): Promise<void> {
  if (!hasDB()) {
    // In-memory: attach waiver to booking
    const booking = store.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.waiver = {
        participantDOB: waiver.participantDOB,
        participantAddress: waiver.participantAddress,
        driversLicenseId: waiver.driversLicenseId,
        signatureDataUrl: waiver.signaturePath || '',
        idPhotoDataUrl: waiver.idPhotoPath || '',
        boaterIdPhotoDataUrl: waiver.boaterIdPhotoPath || '',
        liabilityVideoRecorded: !!waiver.liabilityVideoPath,
        safetyBriefingSignatureDataUrl: waiver.safetySignaturePath || '',
        safetyBriefingSignedAt: waiver.safetyBriefingSignedAt,
        photoVideoOptOut: waiver.photoVideoOptOut,
        isMinor: waiver.isMinor,
        minorName: waiver.minorName,
        minorAge: waiver.minorAge,
        guardianSignatureDataUrl: waiver.guardianSignaturePath,
        guardianName: waiver.guardianName,
        signedAt: waiver.signedAt,
      };
    }
    return;
  }

  const { error } = await supabase!.from('waivers').insert({
    booking_id: bookingId,
    participant_dob: waiver.participantDOB,
    participant_address: waiver.participantAddress,
    drivers_license_id: waiver.driversLicenseId,
    signature_path: waiver.signaturePath,
    id_photo_path: waiver.idPhotoPath,
    boater_id_photo_path: waiver.boaterIdPhotoPath,
    liability_video_path: waiver.liabilityVideoPath,
    safety_signature_path: waiver.safetySignaturePath,
    guardian_signature_path: waiver.guardianSignaturePath,
    photo_video_opt_out: waiver.photoVideoOptOut,
    is_minor: waiver.isMinor,
    minor_name: waiver.minorName,
    minor_age: waiver.minorAge,
    guardian_name: waiver.guardianName,
    signed_at: waiver.signedAt,
    safety_briefing_signed_at: waiver.safetyBriefingSignedAt,
  });
  if (error) console.error('createWaiver error:', error);
}

export async function getWaiver(bookingId: string): Promise<WaiverData | null> {
  if (!hasDB()) {
    const booking = store.bookings.find(b => b.id === bookingId);
    if (!booking?.waiver) return null;
    const w = booking.waiver;
    return {
      participantDOB: w.participantDOB,
      participantAddress: w.participantAddress,
      driversLicenseId: w.driversLicenseId,
      signaturePath: w.signatureDataUrl,
      idPhotoPath: w.idPhotoDataUrl,
      boaterIdPhotoPath: w.boaterIdPhotoDataUrl,
      liabilityVideoPath: w.liabilityVideoDataUrl,
      safetySignaturePath: w.safetyBriefingSignatureDataUrl,
      guardianSignaturePath: w.guardianSignatureDataUrl,
      photoVideoOptOut: w.photoVideoOptOut,
      isMinor: w.isMinor,
      minorName: w.minorName,
      minorAge: w.minorAge,
      guardianName: w.guardianName,
      signedAt: w.signedAt,
      safetyBriefingSignedAt: w.safetyBriefingSignedAt,
    };
  }

  const { data, error } = await supabase!.from('waivers')
    .select('*')
    .eq('booking_id', bookingId)
    .single();
  if (error || !data) return null;

  return {
    participantDOB: data.participant_dob || '',
    participantAddress: data.participant_address || '',
    driversLicenseId: data.drivers_license_id || '',
    signaturePath: data.signature_path,
    idPhotoPath: data.id_photo_path,
    boaterIdPhotoPath: data.boater_id_photo_path,
    liabilityVideoPath: data.liability_video_path,
    safetySignaturePath: data.safety_signature_path,
    guardianSignaturePath: data.guardian_signature_path,
    photoVideoOptOut: data.photo_video_opt_out || false,
    isMinor: data.is_minor || false,
    minorName: data.minor_name,
    minorAge: data.minor_age,
    guardianName: data.guardian_name,
    signedAt: data.signed_at || '',
    safetyBriefingSignedAt: data.safety_briefing_signed_at || '',
  };
}

// ─── Reviews ───

export async function getReviews(all: boolean = false): Promise<Review[]> {
  if (!hasDB()) {
    return all ? store.reviews : store.reviews.filter(r => r.approved);
  }
  let query = supabase!.from('reviews').select('*').order('created_at', { ascending: false });
  if (!all) query = query.eq('approved', true);
  const { data, error } = await query;
  if (error) { console.error('getReviews error:', error); return []; }
  return data.map(r => ({
    id: r.id, customerName: r.customer_name, rating: r.rating,
    comment: r.comment || '', date: r.date || '', approved: r.approved,
  }));
}

export async function createReview(review: Review): Promise<void> {
  if (!hasDB()) { store.reviews.push(review); return; }
  await supabase!.from('reviews').insert({
    id: review.id, customer_name: review.customerName,
    rating: review.rating, comment: review.comment,
    date: review.date, approved: review.approved,
  });
}

export async function updateReview(id: string, approved: boolean): Promise<Review | null> {
  if (!hasDB()) {
    const review = store.reviews.find(r => r.id === id);
    if (review) review.approved = approved;
    return review || null;
  }
  const { data, error } = await supabase!.from('reviews')
    .update({ approved })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return null;
  return { id: data.id, customerName: data.customer_name, rating: data.rating, comment: data.comment || '', date: data.date || '', approved: data.approved };
}

export async function deleteReview(id: string): Promise<boolean> {
  if (!hasDB()) {
    const idx = store.reviews.findIndex(r => r.id === id);
    if (idx === -1) return false;
    store.reviews.splice(idx, 1);
    return true;
  }
  const { error } = await supabase!.from('reviews').delete().eq('id', id);
  return !error;
}

// ─── Settings ───

export async function getSettings(): Promise<Settings> {
  if (!hasDB()) return store.settings;
  const { data, error } = await supabase!.from('settings').select('*').eq('id', 1).single();
  if (error || !data) return store.settings;
  return {
    businessName: data.business_name || '',
    businessPhone: data.business_phone || '',
    businessEmail: data.business_email || '',
    businessAddress: data.business_address || '',
    operatingHoursStart: data.operating_hours_start || '09:00',
    operatingHoursEnd: data.operating_hours_end || '18:00',
  };
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  if (!hasDB()) {
    store.settings = { ...store.settings, ...updates };
    return store.settings;
  }
  const mapped: Record<string, string> = {};
  if (updates.businessName !== undefined) mapped.business_name = updates.businessName;
  if (updates.businessPhone !== undefined) mapped.business_phone = updates.businessPhone;
  if (updates.businessEmail !== undefined) mapped.business_email = updates.businessEmail;
  if (updates.businessAddress !== undefined) mapped.business_address = updates.businessAddress;
  if (updates.operatingHoursStart !== undefined) mapped.operating_hours_start = updates.operatingHoursStart;
  if (updates.operatingHoursEnd !== undefined) mapped.operating_hours_end = updates.operatingHoursEnd;

  await supabase!.from('settings').update(mapped).eq('id', 1);
  return getSettings();
}

// ─── Storage helpers ───

export async function getSignedUrl(path: string): Promise<string | null> {
  if (!hasDB() || !path) return null;
  const { data, error } = await supabase!.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 3600); // 1 hour
  if (error) { console.error('getSignedUrl error:', error); return null; }
  return data.signedUrl;
}

export async function createUploadSignedUrl(path: string): Promise<{ signedUrl: string; token: string; path: string } | null> {
  if (!hasDB()) return null;
  const { data, error } = await supabase!.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);
  if (error) { console.error('createUploadSignedUrl error:', error); return null; }
  return { signedUrl: data.signedUrl, token: data.token, path: data.path };
}

export async function uploadFile(path: string, file: Buffer | Uint8Array, contentType: string): Promise<string | null> {
  if (!hasDB()) return null;
  const { error } = await supabase!.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType, upsert: true });
  if (error) { console.error('uploadFile error:', error); return null; }
  return path;
}

// ─── Helpers ───

function mapBookingRow(r: Record<string, unknown>): Booking {
  return {
    id: r.id as string,
    jetSkiId: r.jet_ski_id as string,
    date: r.date as string,
    timeSlotId: r.time_slot_id as string,
    startTime: r.start_time as string,
    customerName: r.customer_name as string,
    customerEmail: r.customer_email as string,
    customerPhone: (r.customer_phone as string) || '',
    totalPrice: Number(r.total_price),
    status: r.status as Booking['status'],
    createdAt: r.created_at as string,
    isManual: r.is_manual as boolean,
    stripeSessionId: r.stripe_session_id as string | undefined,
  };
}
