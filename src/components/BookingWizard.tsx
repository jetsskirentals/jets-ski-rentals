'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isBefore, startOfToday, isWeekend, parseISO, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Waves, CheckCircle, Loader2, CreditCard } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';

interface TimeSlot {
  id: string;
  label: string;
  durationMinutes: number;
  weekdayPrice: number;
  weekendPrice: number;
}

interface JetSki {
  id: string;
  name: string;
  description: string;
  status: string;
}

type Step = 'date' | 'duration' | 'jetski' | 'time' | 'details' | 'confirm' | 'success';

export default function BookingWizard() {
  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedJetSki, setSelectedJetSki] = useState<JetSki | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [currentMonth, setCurrentMonth] = useState(startOfToday());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [jetSkis, setJetSkis] = useState<JetSki[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ id: string; date: string; startTime: string; totalPrice: number } | null>(null);
  const [error, setError] = useState('');

  // Load inventory data
  useEffect(() => {
    fetch('/api/inventory')
      .then(r => r.json())
      .then(data => {
        setTimeSlots(data.timeSlots);
        setJetSkis(data.jetSkis.filter((js: JetSki) => js.status === 'available'));
      })
      .catch(() => {});
  }, []);

  // Load available times when jet ski, date, and slot are selected
  useEffect(() => {
    if (!selectedDate || !selectedJetSki || !selectedSlot) return;
    setLoading(true);
    fetch(`/api/bookings?date=${selectedDate}&jetSkiId=${selectedJetSki.id}&timeSlotId=${selectedSlot.id}`)
      .then(r => r.json())
      .then(data => {
        setAvailableTimes(data.availableTimes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedDate, selectedJetSki, selectedSlot]);

  const getPrice = () => {
    if (!selectedSlot || !selectedDate) return 0;
    return isWeekend(parseISO(selectedDate)) ? selectedSlot.weekendPrice : selectedSlot.weekdayPrice;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jetSkiId: selectedJetSki!.id,
          date: selectedDate,
          timeSlotId: selectedSlot!.id,
          startTime: selectedTime,
          customerName,
          customerEmail,
          customerPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookingResult(data.booking);
      setStep('success');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  // Calendar rendering
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);
  const today = startOfToday();

  const steps: { key: Step; label: string }[] = [
    { key: 'date', label: 'Date' },
    { key: 'duration', label: 'Duration' },
    { key: 'jetski', label: 'Jet Ski' },
    { key: 'time', label: 'Time' },
    { key: 'details', label: 'Details' },
    { key: 'confirm', label: 'Confirm' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="card p-6 md:p-8">
      {/* Progress Steps */}
      {step !== 'success' && (
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    i < currentStepIndex && 'bg-green-500 text-white',
                    i === currentStepIndex && 'bg-brand-600 text-white shadow-lg shadow-brand-200',
                    i > currentStepIndex && 'bg-gray-100 text-gray-400'
                  )}
                >
                  {i < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={cn(
                  'text-[10px] mt-1 font-medium whitespace-nowrap',
                  i <= currentStepIndex ? 'text-brand-700' : 'text-gray-400'
                )}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 mt-[-14px]',
                  i < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step: Date */}
      {step === 'date' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-6">Choose Your Date</h3>

          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                className="p-2 hover:bg-brand-50 rounded-lg"
                disabled={isBefore(addMonths(currentMonth, -1), startOfMonth(today))}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h4 className="font-semibold text-brand-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h4>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-brand-50 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-brand-600/50 py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isPast = isBefore(day, today);
                const isSelected = dateStr === selectedDate;
                const isWeekendDay = isWeekend(day);

                return (
                  <button
                    key={dateStr}
                    onClick={() => !isPast && setSelectedDate(dateStr)}
                    disabled={isPast}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all',
                      isPast && 'text-gray-300 cursor-not-allowed',
                      !isPast && !isSelected && 'hover:bg-brand-50 text-brand-800',
                      !isPast && isWeekendDay && !isSelected && 'text-sunset-600',
                      isSelected && 'bg-brand-600 text-white shadow-lg',
                      isToday(day) && !isSelected && 'ring-2 ring-brand-300'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs text-brand-600/50">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-brand-600" />
                Selected
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-brand-300" />
                Today
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sunset-600 font-bold">$</span>
                Weekend pricing
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setStep('duration')}
              disabled={!selectedDate}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Duration */}
      {step === 'duration' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-2">Choose Your Duration</h3>
          <p className="text-sm text-brand-600/50 mb-6">
            {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
            {isWeekend(parseISO(selectedDate)) && (
              <span className="ml-2 text-sunset-500 font-medium">(Weekend pricing)</span>
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {timeSlots.map((slot) => {
              const price = isWeekend(parseISO(selectedDate)) ? slot.weekendPrice : slot.weekdayPrice;
              const isSelected = selectedSlot?.id === slot.id;

              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    'p-5 rounded-xl border-2 text-left transition-all',
                    isSelected
                      ? 'border-brand-500 bg-brand-50 shadow-lg'
                      : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-brand-500" />
                    <span className="font-bold text-brand-900">{slot.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-brand-900">
                    ${price}
                    <span className="text-sm font-normal text-brand-600/50 ml-1">per jet ski</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('date')} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep('jetski')}
              disabled={!selectedSlot}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Jet Ski */}
      {step === 'jetski' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-6">Choose Your Jet Ski</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {jetSkis.map((js) => {
              const isSelected = selectedJetSki?.id === js.id;

              return (
                <button
                  key={js.id}
                  onClick={() => setSelectedJetSki(js)}
                  className={cn(
                    'p-5 rounded-xl border-2 text-left transition-all',
                    isSelected
                      ? 'border-brand-500 bg-brand-50 shadow-lg'
                      : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/50'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-ocean-500 rounded-xl flex items-center justify-center">
                      <Waves className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-900">{js.name}</div>
                    </div>
                  </div>
                  <p className="text-sm text-brand-700/60">{js.description}</p>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('duration')} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep('time')}
              disabled={!selectedJetSki}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Time */}
      {step === 'time' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-2">Pick Your Start Time</h3>
          <p className="text-sm text-brand-600/50 mb-6">
            {selectedJetSki?.name} &middot; {selectedSlot?.label} &middot; {format(parseISO(selectedDate), 'MMM d, yyyy')}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <span className="ml-3 text-brand-600">Checking availability...</span>
            </div>
          ) : availableTimes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-brand-700/60 mb-4">No available times for this selection.</p>
              <button onClick={() => setStep('date')} className="btn-secondary">Choose a Different Date</button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    'py-3 px-3 rounded-xl text-sm font-medium transition-all border',
                    selectedTime === time
                      ? 'border-brand-500 bg-brand-600 text-white shadow-lg'
                      : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-brand-800'
                  )}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('jetski')} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep('details')}
              disabled={!selectedTime}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Customer Details */}
      {step === 'details' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-6">Your Details</h3>

          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-brand-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1.5">Email Address *</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-brand-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-brand-900"
              />
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('time')} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep('confirm')}
              disabled={!customerName || !customerEmail}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review Booking
            </button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div>
          <h3 className="text-xl font-bold text-brand-900 mb-6">Review Your Booking</h3>

          <div className="bg-brand-50/50 rounded-xl p-6 space-y-4 max-w-md mx-auto">
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Date</span>
              <span className="font-semibold text-brand-900">{format(parseISO(selectedDate), 'EEEE, MMM d, yyyy')}</span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Time</span>
              <span className="font-semibold text-brand-900">{formatTime(selectedTime)}</span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Duration</span>
              <span className="font-semibold text-brand-900">{selectedSlot?.label}</span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Jet Ski</span>
              <span className="font-semibold text-brand-900">{selectedJetSki?.name}</span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Name</span>
              <span className="font-semibold text-brand-900">{customerName}</span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Email</span>
              <span className="font-semibold text-brand-900">{customerEmail}</span>
            </div>
            {customerPhone && (
              <>
                <div className="border-t border-brand-100" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-600/60">Phone</span>
                  <span className="font-semibold text-brand-900">{customerPhone}</span>
                </div>
              </>
            )}
            <div className="border-t-2 border-brand-200 pt-2" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-brand-900">Total</span>
              <span className="text-2xl font-bold text-brand-600">${getPrice()}</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <p className="text-xs text-brand-600/40 text-center mt-4">
            Payment will be collected at the location. This reserves your time slot.
          </p>

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('details')} className="btn-secondary" disabled={submitting}>Back</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && bookingResult && (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h3 className="text-2xl font-bold text-brand-900 mb-2">Booking Confirmed!</h3>
          <p className="text-brand-600/60 mb-8 max-w-md mx-auto">
            Your jet ski reservation is locked in. A confirmation email will be sent to {customerEmail}.
          </p>

          <div className="bg-brand-50/50 rounded-xl p-6 max-w-sm mx-auto mb-8 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-brand-600/60">Booking ID</span>
              <span className="font-mono text-sm font-bold text-brand-800">{bookingResult.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-brand-600/60">Date</span>
              <span className="font-semibold text-brand-900">{format(parseISO(bookingResult.date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-brand-600/60">Time</span>
              <span className="font-semibold text-brand-900">{formatTime(bookingResult.startTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-brand-600/60">Total</span>
              <span className="font-bold text-brand-600">${bookingResult.totalPrice}</span>
            </div>
          </div>

          <a href="/" className="btn-primary inline-flex">
            Back to Home
          </a>
        </div>
      )}
    </div>
  );
}
