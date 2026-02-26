'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import {
  LayoutDashboard, CalendarDays, DollarSign, Star, Settings, Plus,
  Waves, Users, Loader2, Trash2, Edit3, Save, X, FileCheck, Eye, ChevronDown, ChevronUp, CheckCircle, LogOut, Lock
} from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';

type Tab = 'overview' | 'bookings' | 'inventory' | 'reviews' | 'settings';

// ─── Login Screen ───
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onLogin();
      } else {
        setError('Incorrect password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-8 h-8 text-brand-700" />
          </div>
          <h1 className="text-2xl font-bold text-brand-900">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">Jet&apos;s Ski Rentals Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-center text-lg"
            autoFocus
          />
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Stripe Booking interface ───
interface StripeBooking {
  id: string;
  date: string;
  startTime: string;
  customerName: string;
  customerEmail: string;
  jetSkiId: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}
interface StripeStats {
  totalBookings: number;
  totalRevenue: number;
  todayBookings: number;
  todayRevenue: number;
}

interface WaiverData {
  participantDOB: string;
  participantAddress: string;
  driversLicenseId: string;
  signatureDataUrl: string;
  idPhotoDataUrl: string;
  boaterIdPhotoDataUrl?: string;
  liabilityVideoDataUrl?: string;
  liabilityVideoRecorded?: boolean;
  safetyBriefingSignatureDataUrl?: string;
  safetyBriefingSignedAt?: string;
  photoVideoOptOut: boolean;
  isMinor: boolean;
  minorName?: string;
  minorAge?: string;
  guardianSignatureDataUrl?: string;
  guardianName?: string;
  signedAt: string;
}
interface Booking {
  id: string; jetSkiId: string; date: string; timeSlotId: string;
  startTime: string; customerName: string; customerEmail: string;
  customerPhone: string; totalPrice: number; status: string;
  createdAt: string; isManual: boolean; waiver?: WaiverData;
}
interface TimeSlot {
  id: string; label: string; durationMinutes: number;
  weekdayPrice: number; weekendPrice: number;
}
interface JetSki {
  id: string; name: string; description: string; image: string; status: string;
}
interface Review {
  id: string; customerName: string; rating: number; comment: string;
  date: string; approved: boolean;
}
interface BlackoutDate {
  id: string; date: string; reason: string;
}
interface SettingsData {
  businessName: string; businessPhone: string; businessEmail: string;
  businessAddress: string; operatingHoursStart: string; operatingHoursEnd: string;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stripeBookings, setStripeBookings] = useState<StripeBooking[]>([]);
  const [stripeStats, setStripeStats] = useState<StripeStats | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [jetSkis, setJetSkis] = useState<JetSki[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    fetch('/api/admin/auth')
      .then(r => { setAuthenticated(r.ok); })
      .catch(() => setAuthenticated(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setAuthenticated(false);
  };

  // Manual booking form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualJetSki, setManualJetSki] = useState('');
  const [manualSlot, setManualSlot] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  // Blackout date form
  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [newBlackoutReason, setNewBlackoutReason] = useState('');

  // Pricing edit
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editPrices, setEditPrices] = useState({ weekday: 0, weekend: 0 });

  // Settings edit
  const [editSettings, setEditSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<SettingsData | null>(null);

  // Waiver viewer
  const [expandedWaivers, setExpandedWaivers] = useState<Set<string>>(new Set());

  const fetchAll = async () => {
    setLoading(true);
    const [bookingsRes, inventoryRes, reviewsRes, settingsRes] = await Promise.all([
      fetch('/api/bookings').then(r => r.json()),
      fetch('/api/inventory').then(r => r.json()),
      fetch('/api/reviews?all=true').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]);
    setBookings(bookingsRes.bookings);
    setTimeSlots(inventoryRes.timeSlots);
    setJetSkis(inventoryRes.jetSkis);
    setBlackoutDates(inventoryRes.blackoutDates);
    setReviews(reviewsRes.reviews);
    setSettings(settingsRes.settings);

    // Fetch Stripe bookings (real payment data)
    try {
      const stripeRes = await fetch('/api/admin/stripe-bookings');
      if (stripeRes.ok) {
        const stripeData = await stripeRes.json();
        setStripeBookings(stripeData.bookings || []);
        setStripeStats(stripeData.stats || null);
      }
    } catch { /* Stripe data is optional */ }

    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll(); }, []);

  const cancelBooking = async (id: string) => {
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'cancelled' }),
    });
    fetchAll();
  };

  const createManualBooking = async () => {
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jetSkiId: manualJetSki,
        date: manualDate,
        timeSlotId: manualSlot,
        startTime: manualTime,
        customerName: manualName,
        customerEmail: manualEmail || 'walk-in@manual.com',
        customerPhone: manualPhone,
        isManual: true,
      }),
    });
    setShowManualForm(false);
    setManualDate(''); setManualJetSki(''); setManualSlot(''); setManualTime('');
    setManualName(''); setManualEmail(''); setManualPhone('');
    fetchAll();
  };

  const addBlackoutDate = async () => {
    if (!newBlackoutDate) return;
    const updated = [...blackoutDates, { id: `bd-${Date.now()}`, date: newBlackoutDate, reason: newBlackoutReason }];
    await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blackoutDates: updated }),
    });
    setNewBlackoutDate('');
    setNewBlackoutReason('');
    fetchAll();
  };

  const removeBlackoutDate = async (id: string) => {
    const updated = blackoutDates.filter(bd => bd.id !== id);
    await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blackoutDates: updated }),
    });
    fetchAll();
  };

  const saveSlotPrices = async (slotId: string) => {
    const updated = timeSlots.map(ts =>
      ts.id === slotId ? { ...ts, weekdayPrice: editPrices.weekday, weekendPrice: editPrices.weekend } : ts
    );
    await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeSlots: updated }),
    });
    setEditingSlot(null);
    fetchAll();
  };

  const toggleJetSkiStatus = async (id: string) => {
    const updated = jetSkis.map(js =>
      js.id === id ? { ...js, status: js.status === 'available' ? 'maintenance' : 'available' } : js
    );
    await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jetSkis: updated }),
    });
    fetchAll();
  };

  const toggleReviewApproval = async (id: string, approved: boolean) => {
    await fetch('/api/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved }),
    });
    fetchAll();
  };

  const deleteReview = async (id: string) => {
    await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const saveSettings = async () => {
    if (!settingsForm) return;
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForm),
    });
    setEditSettings(false);
    fetchAll();
  };

  const activeBookings = bookings.filter(b => b.status === 'confirmed');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayBookings = activeBookings.filter(b => b.date === todayStr);
  // Use Stripe stats if available (persists across restarts), fall back to in-memory data
  const revenue = stripeStats?.totalRevenue ?? activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  // Merge Stripe bookings with in-memory bookings (Stripe bookings are authoritative)
  const allBookings: Booking[] = (() => {
    const memoryIds = new Set(bookings.map(b => b.id));
    const stripeOnly: Booking[] = stripeBookings.filter(sb => !memoryIds.has(sb.id)).map(sb => ({
      ...sb,
      customerPhone: '',
      timeSlotId: sb.jetSkiId || '',
      isManual: false,
    }));
    return [...bookings, ...stripeOnly];
  })();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'bookings', label: 'Bookings', icon: CalendarDays },
    { key: 'inventory', label: 'Inventory & Pricing', icon: DollarSign },
    { key: 'reviews', label: 'Reviews', icon: Star },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  // Auth checks (after all hooks)
  if (authenticated === null || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-brand-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-ocean-400 rounded-lg flex items-center justify-center">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Admin Dashboard</h1>
            <p className="text-brand-300 text-xs">Jet&apos;s Ski Rentals</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-sm text-brand-300 hover:text-white transition-colors">
            View Site &rarr;
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-brand-300 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="md:w-56 bg-white border-b md:border-b-0 md:border-r border-gray-200 md:min-h-[calc(100vh-60px)]">
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 md:p-3 gap-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  tab === t.key
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <t.icon className="w-4 h-4 shrink-0" />
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Today\'s Bookings', value: stripeStats?.todayBookings ?? todayBookings.length, icon: CalendarDays, color: 'text-brand-600 bg-brand-50' },
                  { label: 'Total Bookings', value: stripeStats?.totalBookings ?? activeBookings.length, icon: Users, color: 'text-ocean-600 bg-ocean-50' },
                  { label: 'Total Revenue', value: `$${revenue}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
                  { label: 'Signed Waivers', value: bookings.filter(b => b.waiver).length, icon: FileCheck, color: 'text-purple-600 bg-purple-50' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', stat.color)}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              <h3 className="font-semibold text-gray-900 mb-3">Upcoming Bookings</h3>
              {activeBookings.filter(b => b.date >= todayStr).length === 0 ? (
                <p className="text-gray-400 text-sm">No upcoming bookings.</p>
              ) : (
                <div className="space-y-2">
                  {activeBookings.filter(b => b.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).slice(0, 5).map(b => (
                    <div key={b.id} className="bg-white rounded-lg p-4 border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{b.customerName}</span>
                        <span className="text-gray-400 mx-2">&middot;</span>
                        <span className="text-sm text-gray-500">
                          {format(parseISO(b.date), 'MMM d')} at {formatTime(b.startTime)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-brand-600">${b.totalPrice}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BOOKINGS */}
          {tab === 'bookings' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
                <button onClick={() => setShowManualForm(!showManualForm)} className="btn-primary text-sm !py-2 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Manual Booking
                </button>
              </div>

              {showManualForm && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6 space-y-3">
                  <h4 className="font-semibold text-gray-900">Manual Booking (Walk-in)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                    <select value={manualJetSki} onChange={e => setManualJetSki(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                      <option value="">Select Jet Ski</option>
                      {jetSkis.map(js => <option key={js.id} value={js.id}>{js.name}</option>)}
                    </select>
                    <select value={manualSlot} onChange={e => setManualSlot(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                      <option value="">Select Duration</option>
                      {timeSlots.map(ts => <option key={ts.id} value={ts.id}>{ts.label}</option>)}
                    </select>
                    <input type="time" value={manualTime} onChange={e => setManualTime(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                    <input type="text" placeholder="Customer Name" value={manualName} onChange={e => setManualName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                    <input type="email" placeholder="Email (optional)" value={manualEmail} onChange={e => setManualEmail(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={createManualBooking} disabled={!manualDate || !manualJetSki || !manualSlot || !manualTime || !manualName} className="btn-primary text-sm !py-2 disabled:opacity-50">
                      Create Booking
                    </button>
                    <button onClick={() => setShowManualForm(false)} className="btn-secondary text-sm !py-2">Cancel</button>
                  </div>
                </div>
              )}

              {allBookings.length === 0 ? (
                <p className="text-gray-400">No bookings yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...allBookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(b => {
                    const jetSki = jetSkis.find(js => js.id === b.jetSkiId);
                    const slot = timeSlots.find(ts => ts.id === b.timeSlotId);
                    const isExpanded = expandedWaivers.has(b.id);
                    return (
                      <div key={b.id} className={cn(
                        'bg-white rounded-lg border',
                        b.status === 'cancelled' ? 'border-red-100 opacity-60' : 'border-gray-100'
                      )}>
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">{b.customerName}</span>
                              {b.isManual && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Walk-in</span>}
                              <span className={cn(
                                'text-[10px] font-bold px-1.5 py-0.5 rounded',
                                b.status === 'pending' && 'bg-orange-100 text-orange-700',
                                b.status === 'confirmed' && 'bg-green-100 text-green-700',
                                b.status === 'cancelled' && 'bg-red-100 text-red-700',
                                b.status === 'completed' && 'bg-blue-100 text-blue-700',
                              )}>
                                {b.status.toUpperCase()}
                              </span>
                              {b.waiver ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-0.5">
                                  <FileCheck className="w-3 h-3" /> WAIVER SIGNED
                                </span>
                              ) : (
                                !b.isManual && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">NO WAIVER</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(parseISO(b.date), 'MMM d, yyyy')} at {formatTime(b.startTime)} &middot; {slot?.label} &middot; {jetSki?.name}
                            </div>
                            <div className="text-xs text-gray-400">{b.customerEmail} {b.customerPhone && `| ${b.customerPhone}`}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-brand-600">${b.totalPrice}</span>
                            {b.waiver && (
                              <button
                                onClick={() => {
                                  const next = new Set(expandedWaivers);
                                  if (isExpanded) next.delete(b.id); else next.add(b.id);
                                  setExpandedWaivers(next);
                                }}
                                className="text-purple-600 hover:text-purple-800 text-xs font-medium flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {isExpanded ? 'Hide' : 'Waiver'}
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                            {b.status === 'confirmed' && (
                              <button onClick={() => cancelBooking(b.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded waiver details */}
                        {isExpanded && b.waiver && (
                          <div className="border-t border-gray-100 bg-purple-50/30 p-4">
                            <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-1.5">
                              <FileCheck className="w-4 h-4" /> Signed Waiver Details
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 block text-xs mb-0.5">Date of Birth</span>
                                <span className="text-gray-900 font-medium">{b.waiver.participantDOB}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-xs mb-0.5">Address</span>
                                <span className="text-gray-900 font-medium">{b.waiver.participantAddress}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-xs mb-0.5">Driver&apos;s License</span>
                                <span className="text-gray-900 font-medium">{b.waiver.driversLicenseId}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-xs mb-0.5">Signed At</span>
                                <span className="text-gray-900 font-medium">{new Date(b.waiver.signedAt).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-xs mb-0.5">Photo/Video Opt-Out</span>
                                <span className="text-gray-900 font-medium">{b.waiver.photoVideoOptOut ? 'Yes — opted out' : 'No — consented'}</span>
                              </div>
                              {b.waiver.isMinor && (
                                <div>
                                  <span className="text-gray-500 block text-xs mb-0.5">Minor Participant</span>
                                  <span className="text-gray-900 font-medium">{b.waiver.minorName}, age {b.waiver.minorAge} (Guardian: {b.waiver.guardianName})</span>
                                </div>
                              )}
                            </div>

                            {/* Signature and ID photo */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                              <div>
                                <span className="text-gray-500 block text-xs mb-1.5">Signature</span>
                                <div className="bg-white rounded-lg border border-gray-200 p-2 inline-block">
                                  {b.waiver.signatureDataUrl
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={b.waiver.signatureDataUrl} alt="Customer signature" className="h-20 w-auto" />
                                    : <span className="text-gray-400 text-xs">No signature captured</span>
                                  }
                                </div>
                              </div>
                              {b.waiver.guardianSignatureDataUrl && (
                                <div>
                                  <span className="text-gray-500 block text-xs mb-1.5">Guardian Signature</span>
                                  <div className="bg-white rounded-lg border border-gray-200 p-2 inline-block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={b.waiver.guardianSignatureDataUrl} alt="Guardian signature" className="h-20 w-auto" />
                                  </div>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-500 block text-xs mb-1.5">Photo ID</span>
                                <div className="bg-white rounded-lg border border-gray-200 p-2 inline-block">
                                  {b.waiver.idPhotoDataUrl
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={b.waiver.idPhotoDataUrl} alt="Customer ID" className="h-32 w-auto rounded" />
                                    : <span className="text-gray-400 text-xs">No ID photo uploaded</span>
                                  }
                                </div>
                              </div>
                              {b.waiver.boaterIdPhotoDataUrl && (
                                <div>
                                  <span className="text-gray-500 block text-xs mb-1.5">Boater ID</span>
                                  <div className="bg-white rounded-lg border border-gray-200 p-2 inline-block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={b.waiver.boaterIdPhotoDataUrl} alt="Boater ID" className="h-32 w-auto rounded" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Safety Briefing */}
                            {b.waiver.safetyBriefingSignatureDataUrl && (
                              <div className="mt-4">
                                <span className="text-gray-500 block text-xs mb-1.5">Safety Briefing Acknowledgment</span>
                                <div className="flex items-center gap-4">
                                  <div className="bg-white rounded-lg border border-gray-200 p-2 inline-block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={b.waiver.safetyBriefingSignatureDataUrl} alt="Safety briefing signature" className="h-16 w-auto" />
                                  </div>
                                  {b.waiver.safetyBriefingSignedAt && (
                                    <span className="text-xs text-gray-500">Signed: {new Date(b.waiver.safetyBriefingSignedAt).toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Liability Video */}
                            {(b.waiver.liabilityVideoDataUrl || b.waiver.liabilityVideoRecorded) && (
                              <div className="mt-4">
                                <span className="text-gray-500 block text-xs mb-1.5">Liability Statement Video</span>
                                {b.waiver.liabilityVideoDataUrl ? (
                                  <div className="bg-white rounded-lg border border-gray-200 p-2 inline-block max-w-md">
                                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                    <video
                                      src={b.waiver.liabilityVideoDataUrl}
                                      controls
                                      className="w-full rounded max-h-64"
                                      playsInline
                                    />
                                  </div>
                                ) : (
                                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-flex items-center gap-2 text-green-700 text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    Video recorded on device
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* INVENTORY & PRICING */}
          {tab === 'inventory' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Inventory & Pricing</h2>

              {/* Jet Skis */}
              <h3 className="font-semibold text-gray-900 mb-3">Jet Skis</h3>
              <div className="space-y-2 mb-8">
                {jetSkis.map(js => (
                  <div key={js.id} className="bg-white rounded-lg p-4 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-ocean-500 rounded-lg flex items-center justify-center">
                        <Waves className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{js.name}</span>
                        <span className={cn(
                          'ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded',
                          js.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        )}>
                          {js.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleJetSkiStatus(js.id)}
                      className={cn(
                        'text-xs font-medium px-3 py-1.5 rounded-lg',
                        js.status === 'available' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                      )}
                    >
                      {js.status === 'available' ? 'Set Maintenance' : 'Set Available'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <h3 className="font-semibold text-gray-900 mb-3">Rental Pricing</h3>
              <div className="space-y-2 mb-8">
                {timeSlots.map(ts => (
                  <div key={ts.id} className="bg-white rounded-lg p-4 border border-gray-100 flex items-center justify-between">
                    {editingSlot === ts.id ? (
                      <div className="flex flex-wrap items-center gap-3 w-full">
                        <span className="font-medium text-gray-900 w-24">{ts.label}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Weekday $</span>
                          <input type="number" value={editPrices.weekday} onChange={e => setEditPrices({ ...editPrices, weekday: Number(e.target.value) })} className="border rounded px-2 py-1 w-20 text-sm" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Weekend $</span>
                          <input type="number" value={editPrices.weekend} onChange={e => setEditPrices({ ...editPrices, weekend: Number(e.target.value) })} className="border rounded px-2 py-1 w-20 text-sm" />
                        </div>
                        <button onClick={() => saveSlotPrices(ts.id)} className="text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditingSlot(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="font-medium text-gray-900">{ts.label}</span>
                          <span className="text-sm text-gray-500 ml-3">
                            Weekday: ${ts.weekdayPrice} &middot; Weekend: ${ts.weekendPrice}
                          </span>
                        </div>
                        <button
                          onClick={() => { setEditingSlot(ts.id); setEditPrices({ weekday: ts.weekdayPrice, weekend: ts.weekendPrice }); }}
                          className="text-brand-600 hover:text-brand-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Blackout Dates */}
              <h3 className="font-semibold text-gray-900 mb-3">Blackout Dates</h3>
              <div className="bg-white rounded-xl p-5 border border-gray-200 mb-4">
                <div className="flex flex-wrap gap-3 mb-4">
                  <input type="date" value={newBlackoutDate} onChange={e => setNewBlackoutDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="text" placeholder="Reason (optional)" value={newBlackoutReason} onChange={e => setNewBlackoutReason(e.target.value)} className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[150px]" />
                  <button onClick={addBlackoutDate} disabled={!newBlackoutDate} className="btn-primary text-sm !py-2 disabled:opacity-50">
                    <Plus className="w-4 h-4 inline mr-1" /> Add
                  </button>
                </div>
                {blackoutDates.length === 0 ? (
                  <p className="text-gray-400 text-sm">No blackout dates set.</p>
                ) : (
                  <div className="space-y-2">
                    {blackoutDates.map(bd => (
                      <div key={bd.id} className="flex items-center justify-between bg-red-50/50 rounded-lg p-3">
                        <div>
                          <span className="font-medium text-gray-900">{format(parseISO(bd.date), 'MMM d, yyyy')}</span>
                          {bd.reason && <span className="text-sm text-gray-500 ml-2">— {bd.reason}</span>}
                        </div>
                        <button onClick={() => removeBlackoutDate(bd.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REVIEWS */}
          {tab === 'reviews' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400">No reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className={cn(
                      'bg-white rounded-lg p-4 border',
                      r.approved ? 'border-gray-100' : 'border-yellow-200 bg-yellow-50/30'
                    )}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{r.customerName}</span>
                            <div className="flex text-yellow-400 text-sm">
                              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                            </div>
                            {!r.approved && (
                              <span className="text-[10px] bg-yellow-100 text-yellow-700 font-bold px-1.5 py-0.5 rounded">PENDING</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{r.comment}</p>
                          <p className="text-xs text-gray-400 mt-1">{format(parseISO(r.date), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <button
                            onClick={() => toggleReviewApproval(r.id, !r.approved)}
                            className={cn(
                              'text-xs font-medium px-2 py-1 rounded',
                              r.approved ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                            )}
                          >
                            {r.approved ? 'Hide' : 'Approve'}
                          </button>
                          <button onClick={() => deleteReview(r.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && settings && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Business Settings</h2>
                {!editSettings && (
                  <button onClick={() => { setEditSettings(true); setSettingsForm({ ...settings }); }} className="btn-secondary text-sm !py-2 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>

              {editSettings && settingsForm ? (
                <div className="bg-white rounded-xl p-5 border border-gray-200 space-y-4">
                  {[
                    { key: 'businessName', label: 'Business Name', type: 'text' },
                    { key: 'businessPhone', label: 'Phone', type: 'text' },
                    { key: 'businessEmail', label: 'Email', type: 'email' },
                    { key: 'businessAddress', label: 'Address', type: 'text' },
                    { key: 'operatingHoursStart', label: 'Opening Time', type: 'time' },
                    { key: 'operatingHoursEnd', label: 'Closing Time', type: 'time' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        value={settingsForm[field.key as keyof SettingsData]}
                        onChange={e => setSettingsForm({ ...settingsForm, [field.key]: e.target.value })}
                        className="border rounded-lg px-3 py-2 text-sm w-full"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button onClick={saveSettings} className="btn-primary text-sm !py-2">Save Settings</button>
                    <button onClick={() => setEditSettings(false)} className="btn-secondary text-sm !py-2">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-5 border border-gray-100 space-y-4">
                  {[
                    { label: 'Business Name', value: settings.businessName },
                    { label: 'Phone', value: settings.businessPhone },
                    { label: 'Email', value: settings.businessEmail },
                    { label: 'Address', value: settings.businessAddress },
                    { label: 'Operating Hours', value: `${formatTime(settings.operatingHoursStart)} - ${formatTime(settings.operatingHoursEnd)}` },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
