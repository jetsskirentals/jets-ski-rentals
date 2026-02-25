// In-memory store for demo. In production, this would be a database.
// This persists for the lifetime of the server process.

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
  signatureDataUrl: string;
  idPhotoDataUrl: string;
  boaterIdPhotoDataUrl: string;
  liabilityVideoDataUrl: string;
  safetyBriefingSignatureDataUrl: string;
  safetyBriefingSignedAt: string;
  photoVideoOptOut: boolean;
  isMinor: boolean;
  minorName?: string;
  minorAge?: string;
  guardianSignatureDataUrl?: string;
  guardianName?: string;
  signedAt: string;
}

export interface Booking {
  id: string;
  jetSkiId: string;
  date: string; // YYYY-MM-DD
  timeSlotId: string;
  startTime: string; // HH:MM
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  isManual: boolean;
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
  date: string; // YYYY-MM-DD
  reason: string;
}

export interface Settings {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  operatingHoursStart: string; // HH:MM
  operatingHoursEnd: string;   // HH:MM
}

// --- Default Data ---

const defaultJetSkis: JetSki[] = [
  {
    id: 'js-1',
    name: 'Wave Runner 1',
    description: 'Yamaha EX Sport — Perfect for beginners and families. Stable, easy to handle, and a blast on the water!',
    image: '/jetski1.svg',
    status: 'available',
  },
  {
    id: 'js-2',
    name: 'Wave Runner 2',
    description: 'Sea-Doo Spark — Lightweight and agile, great for thrill-seekers who love speed and tight turns.',
    image: '/jetski2.svg',
    status: 'available',
  },
];

const defaultTimeSlots: TimeSlot[] = [
  { id: 'ts-15', label: '15 Minutes', durationMinutes: 15, weekdayPrice: 35, weekendPrice: 45 },
  { id: 'ts-30', label: '30 Minutes', durationMinutes: 30, weekdayPrice: 60, weekendPrice: 75 },
  { id: 'ts-60', label: '1 Hour', durationMinutes: 60, weekdayPrice: 100, weekendPrice: 125 },
  { id: 'ts-120', label: '2 Hours', durationMinutes: 120, weekdayPrice: 175, weekendPrice: 220 },
];

const defaultReviews: Review[] = [
  {
    id: 'r-1',
    customerName: 'Mike T.',
    rating: 5,
    comment: 'Amazing experience! The jet skis were in great condition and the staff was super helpful. Will definitely come back!',
    date: '2026-02-10',
    approved: true,
  },
  {
    id: 'r-2',
    customerName: 'Sarah L.',
    rating: 5,
    comment: 'Perfect way to spend a sunny afternoon. Booking online was so easy and we got right on the water. Highly recommend!',
    date: '2026-02-05',
    approved: true,
  },
  {
    id: 'r-3',
    customerName: 'Jason R.',
    rating: 4,
    comment: 'Great fun! The 1-hour ride was just the right amount of time. Only wish they had more jet skis so the wait was shorter on busy days.',
    date: '2026-01-28',
    approved: true,
  },
  {
    id: 'r-4',
    customerName: 'Emily K.',
    rating: 5,
    comment: 'Took my kids for the first time and they LOVED it. Super safe, well-maintained equipment. 10/10!',
    date: '2026-01-20',
    approved: true,
  },
];

const defaultSettings: Settings = {
  businessName: "Jet's Ski Rentals",
  businessPhone: '(850) 276-6063',
  businessEmail: 'info@getwetwithjet.com',
  businessAddress: 'Coastal Florida',
  operatingHoursStart: '09:00',
  operatingHoursEnd: '18:00',
};

// --- Store ---

class Store {
  jetSkis: JetSki[] = [...defaultJetSkis];
  timeSlots: TimeSlot[] = [...defaultTimeSlots];
  bookings: Booking[] = [];
  reviews: Review[] = [...defaultReviews];
  blackoutDates: BlackoutDate[] = [];
  settings: Settings = { ...defaultSettings };

  // Check if a jet ski is available for a specific date and time
  isAvailable(jetSkiId: string, date: string, startTime: string, durationMinutes: number): boolean {
    const jetSki = this.jetSkis.find(js => js.id === jetSkiId);
    if (!jetSki || jetSki.status === 'maintenance') return false;

    // Check blackout dates
    if (this.blackoutDates.some(bd => bd.date === date)) return false;

    const requestStart = this.timeToMinutes(startTime);
    const requestEnd = requestStart + durationMinutes;

    return !this.bookings.some(b => {
      if (b.jetSkiId !== jetSkiId || b.date !== date || b.status === 'cancelled') return false;
      const slot = this.timeSlots.find(ts => ts.id === b.timeSlotId);
      if (!slot) return false;
      const bookingStart = this.timeToMinutes(b.startTime);
      const bookingEnd = bookingStart + slot.durationMinutes;
      return requestStart < bookingEnd && requestEnd > bookingStart;
    });
  }

  // Get available start times for a jet ski on a date for a given duration
  getAvailableStartTimes(jetSkiId: string, date: string, durationMinutes: number): string[] {
    const start = this.timeToMinutes(this.settings.operatingHoursStart);
    const end = this.timeToMinutes(this.settings.operatingHoursEnd);
    const times: string[] = [];

    for (let t = start; t + durationMinutes <= end; t += 15) {
      const timeStr = this.minutesToTime(t);
      if (this.isAvailable(jetSkiId, date, timeStr, durationMinutes)) {
        times.push(timeStr);
      }
    }
    return times;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}

// Singleton
const globalStore = globalThis as typeof globalThis & { __store?: Store };
if (!globalStore.__store) {
  globalStore.__store = new Store();
}
export const store: Store = globalStore.__store;
