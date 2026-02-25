'use client';

import { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isBefore, startOfToday, isWeekend, parseISO, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Waves, CheckCircle, Loader2, CreditCard, FileText, Upload, Camera, Anchor, ShieldCheck } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import SignaturePad from './SignaturePad';
import WaiverText from './WaiverText';
import SafetyBriefingText from './SafetyBriefingText';
import VideoRecorder from './VideoRecorder';

const LIABILITY_STATEMENT = "My name is _______. Today is _______. I am voluntarily renting and operating this jet ski. I confirm I received the safety briefing, understand the risks of injury or death, and will follow all rules and Florida boating laws. I accept full responsibility for myself and my passengers, assume all risks, and release the rental company and its employees from liability.";

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

type Step = 'date' | 'duration' | 'jetski' | 'time' | 'details' | 'waiver' | 'safety' | 'confirm' | 'success';

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

  // Waiver state
  const [waiverDOB, setWaiverDOB] = useState('');
  const [waiverAddress, setWaiverAddress] = useState('');
  const [waiverLicenseId, setWaiverLicenseId] = useState('');
  const [waiverSignature, setWaiverSignature] = useState('');
  const [waiverIdPhoto, setWaiverIdPhoto] = useState('');
  const [waiverPhotoOptOut, setWaiverPhotoOptOut] = useState(false);
  const [waiverIsMinor, setWaiverIsMinor] = useState(false);
  const [waiverMinorName, setWaiverMinorName] = useState('');
  const [waiverMinorAge, setWaiverMinorAge] = useState('');
  const [waiverGuardianSignature, setWaiverGuardianSignature] = useState('');
  const [waiverGuardianName, setWaiverGuardianName] = useState('');
  const [waiverBoaterIdPhoto, setWaiverBoaterIdPhoto] = useState('');
  const [waiverLiabilityVideo, setWaiverLiabilityVideo] = useState('');
  const [waiverScrolledToBottom, setWaiverScrolledToBottom] = useState(false);
  const waiverScrollRef = useRef<HTMLDivElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const boaterIdInputRef = useRef<HTMLInputElement>(null);

  // Safety briefing state
  const [safetyScrolledToBottom, setSafetyScrolledToBottom] = useState(false);
  const [safetySignature, setSafetySignature] = useState('');
  const safetyScrollRef = useRef<HTMLDivElement>(null);

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

  const handleIdPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setWaiverIdPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBoaterIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setWaiverBoaterIdPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleWaiverScroll = () => {
    const el = waiverScrollRef.current;
    if (!el) return;
    const threshold = 50;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      setWaiverScrolledToBottom(true);
    }
  };

  const handleSafetyScroll = () => {
    const el = safetyScrollRef.current;
    if (!el) return;
    const threshold = 50;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      setSafetyScrolledToBottom(true);
    }
  };

  const isWaiverComplete = () => {
    const base = waiverDOB && waiverAddress && waiverLicenseId && waiverSignature && waiverIdPhoto && waiverBoaterIdPhoto && waiverLiabilityVideo;
    if (waiverIsMinor) {
      return base && waiverMinorName && waiverMinorAge && waiverGuardianSignature && waiverGuardianName;
    }
    return base;
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
          waiver: {
            participantDOB: waiverDOB,
            participantAddress: waiverAddress,
            driversLicenseId: waiverLicenseId,
            signatureDataUrl: waiverSignature,
            idPhotoDataUrl: waiverIdPhoto,
            boaterIdPhotoDataUrl: waiverBoaterIdPhoto,
            liabilityVideoDataUrl: waiverLiabilityVideo,
            safetyBriefingSignatureDataUrl: safetySignature,
            safetyBriefingSignedAt: new Date().toISOString(),
            photoVideoOptOut: waiverPhotoOptOut,
            isMinor: waiverIsMinor,
            minorName: waiverIsMinor ? waiverMinorName : undefined,
            minorAge: waiverIsMinor ? waiverMinorAge : undefined,
            guardianSignatureDataUrl: waiverIsMinor ? waiverGuardianSignature : undefined,
            guardianName: waiverIsMinor ? waiverGuardianName : undefined,
            signedAt: new Date().toISOString(),
          },
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
    { key: 'waiver', label: 'Waiver' },
    { key: 'safety', label: 'Safety' },
    { key: 'confirm', label: 'Confirm' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-brand-900";

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
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all',
                    i < currentStepIndex && 'bg-green-500 text-white',
                    i === currentStepIndex && 'bg-brand-600 text-white shadow-lg shadow-brand-200',
                    i > currentStepIndex && 'bg-gray-100 text-gray-400'
                  )}
                >
                  {i < currentStepIndex ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : i + 1}
                </div>
                <span className={cn(
                  'text-[9px] sm:text-[10px] mt-1 font-medium whitespace-nowrap',
                  i <= currentStepIndex ? 'text-brand-700' : 'text-gray-400'
                )}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'w-4 sm:w-12 h-0.5 mx-0.5 sm:mx-1.5 mt-[-14px]',
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
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Smith" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1.5">Email Address *</label>
              <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="john@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1.5">Phone Number *</label>
              <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(555) 000-0000" className={inputClass} />
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('time')} className="btn-secondary">Back</button>
            <button
              onClick={() => { setWaiverScrolledToBottom(false); setStep('waiver'); }}
              disabled={!customerName || !customerEmail || !customerPhone}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Waiver
            </button>
          </div>
        </div>
      )}

      {/* Step: Waiver */}
      {step === 'waiver' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-red-500" />
            <h3 className="text-xl font-bold text-brand-900">Liability Waiver</h3>
          </div>
          <p className="text-sm text-brand-600/60 mb-4">
            Please read the waiver carefully, scroll to the bottom, then fill in your details and sign.
          </p>

          {/* Scrollable waiver text */}
          <div
            ref={waiverScrollRef}
            onScroll={handleWaiverScroll}
            className="h-64 overflow-y-auto border border-gray-200 rounded-xl p-4 mb-6 bg-gray-50/50"
          >
            <WaiverText />
          </div>

          {!waiverScrolledToBottom && (
            <p className="text-xs text-amber-600 font-medium mb-4 text-center">
              Please scroll to the bottom of the waiver to continue
            </p>
          )}

          {waiverScrolledToBottom && (
            <div className="space-y-5 max-w-lg mx-auto">
              {/* Participant Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-800 mb-1.5">Date of Birth *</label>
                  <input type="date" value={waiverDOB} onChange={e => setWaiverDOB(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-800 mb-1.5">Driver&apos;s License / ID # *</label>
                  <input type="text" value={waiverLicenseId} onChange={e => setWaiverLicenseId(e.target.value)} placeholder="DL-XXXXXXX" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1.5">Address *</label>
                <input type="text" value={waiverAddress} onChange={e => setWaiverAddress(e.target.value)} placeholder="123 Main St, City, State ZIP" className={inputClass} />
              </div>

              {/* ID Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1.5">Upload Photo of ID *</label>
                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleIdPhotoUpload}
                  className="hidden"
                />
                {waiverIdPhoto ? (
                  <div className="relative">
                    <img src={waiverIdPhoto} alt="ID Photo" className="w-full h-32 object-cover rounded-xl border border-green-300" />
                    <button
                      onClick={() => { setWaiverIdPhoto(''); if (idInputRef.current) idInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => idInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:border-brand-400 hover:bg-brand-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Camera className="w-6 h-6 text-gray-400" />
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500">Tap to take photo or upload</span>
                    <span className="text-xs text-gray-400">Driver&apos;s license or government-issued ID</span>
                  </button>
                )}
              </div>

              {/* Boater ID Upload */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Anchor className="w-4 h-4 text-ocean-500" />
                    Upload Boater&apos;s License / Boater ID *
                  </span>
                </label>
                <input
                  ref={boaterIdInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleBoaterIdUpload}
                  className="hidden"
                />
                {waiverBoaterIdPhoto ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={waiverBoaterIdPhoto} alt="Boater ID" className="w-full h-32 object-cover rounded-xl border border-green-300" />
                    <button
                      onClick={() => { setWaiverBoaterIdPhoto(''); if (boaterIdInputRef.current) boaterIdInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => boaterIdInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:border-ocean-400 hover:bg-ocean-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Camera className="w-6 h-6 text-gray-400" />
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500">Tap to take photo or upload</span>
                    <span className="text-xs text-gray-400">Florida Boater Safety ID Card or equivalent</span>
                  </button>
                )}
              </div>

              {/* Video Liability Statement */}
              <VideoRecorder
                onVideoChange={setWaiverLiabilityVideo}
                statementText={LIABILITY_STATEMENT}
              />

              {/* Photo/Video Opt Out */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waiverPhotoOptOut}
                  onChange={e => setWaiverPhotoOptOut(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-brand-600 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-brand-800">Opt out of photo/video use</span>
                  <p className="text-xs text-gray-500 mt-0.5">Check this if you do NOT want your photos/videos used for marketing.</p>
                </div>
              </label>

              {/* Minor section */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waiverIsMinor}
                  onChange={e => setWaiverIsMinor(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-brand-600 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-brand-800">Signing for a minor (under 18)</span>
                  <p className="text-xs text-gray-500 mt-0.5">Check this if the rider is under 18 years old.</p>
                </div>
              </label>

              {waiverIsMinor && (
                <div className="space-y-4 p-4 bg-amber-50/50 rounded-xl border border-amber-200">
                  <h4 className="font-semibold text-brand-900 text-sm">Minor Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-800 mb-1.5">Minor&apos;s Name *</label>
                      <input type="text" value={waiverMinorName} onChange={e => setWaiverMinorName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-800 mb-1.5">Minor&apos;s Age *</label>
                      <input type="number" value={waiverMinorAge} onChange={e => setWaiverMinorAge(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-800 mb-1.5">Parent/Guardian Name *</label>
                    <input type="text" value={waiverGuardianName} onChange={e => setWaiverGuardianName(e.target.value)} className={inputClass} />
                  </div>
                  <SignaturePad label="Parent/Guardian Signature *" onSignatureChange={setWaiverGuardianSignature} />
                </div>
              )}

              {/* Main Signature */}
              <SignaturePad label="Your Signature *" onSignatureChange={setWaiverSignature} />

              <p className="text-xs text-gray-500 text-center">
                By signing above, I acknowledge that I have read and understood the entire waiver, and I voluntarily agree to all terms.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('details')} className="btn-secondary">Back</button>
            <button
              onClick={() => { setSafetyScrolledToBottom(false); setStep('safety'); }}
              disabled={!waiverScrolledToBottom || !isWaiverComplete()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Safety Briefing
            </button>
          </div>
        </div>
      )}

      {/* Step: Safety Briefing */}
      {step === 'safety' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-bold text-brand-900">Safety Briefing Confirmation</h3>
          </div>
          <p className="text-sm text-brand-600/60 mb-4">
            Please read the safety briefing carefully, scroll to the bottom, then sign to acknowledge.
          </p>

          {/* Scrollable safety briefing text */}
          <div
            ref={safetyScrollRef}
            onScroll={handleSafetyScroll}
            className="h-64 overflow-y-auto border border-gray-200 rounded-xl p-4 mb-6 bg-gray-50/50"
          >
            <SafetyBriefingText />
          </div>

          {!safetyScrolledToBottom && (
            <p className="text-xs text-amber-600 font-medium mb-4 text-center">
              Please scroll to the bottom of the safety briefing to continue
            </p>
          )}

          {safetyScrolledToBottom && (
            <div className="space-y-5 max-w-lg mx-auto">
              <SignaturePad label="Signature — I acknowledge the safety briefing *" onSignatureChange={setSafetySignature} />
              <p className="text-xs text-gray-500 text-center">
                By signing above, I confirm that I received and understand the safety briefing and agree to follow all rules and instructions.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep('waiver')} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep('confirm')}
              disabled={!safetyScrolledToBottom || !safetySignature}
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
              <span className="text-sm text-brand-600/60">Waiver</span>
              <span className="font-semibold text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Signed
              </span>
            </div>
            <div className="border-t border-brand-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-600/60">Safety Briefing</span>
              <span className="font-semibold text-green-600 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Acknowledged
              </span>
            </div>
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
            <button onClick={() => setStep('safety')} className="btn-secondary" disabled={submitting}>Back</button>
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
            <div className="flex justify-between">
              <span className="text-sm text-brand-600/60">Waiver</span>
              <span className="font-semibold text-green-600">Signed</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-brand-600/60">Safety Briefing</span>
              <span className="font-semibold text-green-600">Acknowledged</span>
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
