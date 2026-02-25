'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface BookingData {
  id: string;
  date: string;
  startTime: string;
  totalPrice: number;
  status: string;
  customerEmail: string;
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      setError('Invalid booking reference');
      setLoading(false);
      return;
    }

    fetch(`/api/checkout/verify?session_id=${sessionId || ''}&booking_id=${bookingId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setBooking(data.booking);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to verify booking');
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-brand-600">Verifying your booking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">{error || 'Something went wrong'}</p>
          <a href="/booking" className="btn-primary inline-flex">Try Again</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
      <div className="card p-6 md:p-8 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-brand-900 mb-2">Booking Confirmed!</h1>
        <p className="text-brand-600/60 mb-8">
          {booking.status === 'confirmed'
            ? `Your jet ski reservation is locked in. A confirmation will be sent to ${booking.customerEmail}.`
            : 'Your booking is being processed.'
          }
        </p>

        <div className="bg-brand-50/50 rounded-xl p-6 text-left space-y-3 mb-8">
          <div className="flex justify-between">
            <span className="text-sm text-brand-600/60">Booking ID</span>
            <span className="font-mono text-sm font-bold text-brand-800">{booking.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-brand-600/60">Date</span>
            <span className="font-semibold text-brand-900">{format(parseISO(booking.date), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-brand-600/60">Time</span>
            <span className="font-semibold text-brand-900">{formatTime(booking.startTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-brand-600/60">Total Paid</span>
            <span className="font-bold text-brand-600">${booking.totalPrice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-brand-600/60">Waiver & Safety</span>
            <span className="font-semibold text-green-600 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Complete
            </span>
          </div>
        </div>

        <a href="/" className="btn-primary inline-flex">
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-brand-600">Loading...</p>
          </div>
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
