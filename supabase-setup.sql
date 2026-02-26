-- ============================================
-- Jet's Ski Rentals — Supabase Database Setup
-- Run this in Supabase SQL Editor (one time)
-- ============================================

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  jet_ski_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time_slot_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  total_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  is_manual BOOLEAN DEFAULT false,
  stripe_session_id TEXT
);

-- Waivers table (linked to bookings)
CREATE TABLE IF NOT EXISTS waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
  participant_dob TEXT,
  participant_address TEXT,
  drivers_license_id TEXT,
  signature_path TEXT,
  id_photo_path TEXT,
  boater_id_photo_path TEXT,
  liability_video_path TEXT,
  safety_signature_path TEXT,
  guardian_signature_path TEXT,
  photo_video_opt_out BOOLEAN DEFAULT false,
  is_minor BOOLEAN DEFAULT false,
  minor_name TEXT,
  minor_age TEXT,
  guardian_name TEXT,
  signed_at TIMESTAMPTZ,
  safety_briefing_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Jet skis (inventory)
CREATE TABLE IF NOT EXISTS jet_skis (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  status TEXT DEFAULT 'available'
);

-- Time slots (pricing)
CREATE TABLE IF NOT EXISTS time_slots (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  weekday_price NUMERIC NOT NULL,
  weekend_price NUMERIC NOT NULL
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT DEFAULT '',
  date TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Blackout dates
CREATE TABLE IF NOT EXISTS blackout_dates (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  reason TEXT DEFAULT ''
);

-- Settings (single row)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  business_name TEXT,
  business_phone TEXT,
  business_email TEXT,
  business_address TEXT,
  operating_hours_start TEXT DEFAULT '09:00',
  operating_hours_end TEXT DEFAULT '18:00'
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_jet_ski_date ON bookings(jet_ski_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_waivers_booking ON waivers(booking_id);

-- ============================================
-- Seed default data
-- ============================================

-- Jet Skis
INSERT INTO jet_skis (id, name, description, image, status) VALUES
  ('js-1', 'Wave Runner 1', 'Yamaha EX Sport — Perfect for beginners and families. Stable, easy to handle, and a blast on the water!', '/jetski1.svg', 'available'),
  ('js-2', 'Wave Runner 2', 'Sea-Doo Spark — Lightweight and agile, great for thrill-seekers who love speed and tight turns.', '/jetski2.svg', 'available')
ON CONFLICT (id) DO NOTHING;

-- Time Slots
INSERT INTO time_slots (id, label, duration_minutes, weekday_price, weekend_price) VALUES
  ('ts-15', '15 Minutes', 15, 35, 45),
  ('ts-30', '30 Minutes', 30, 60, 75),
  ('ts-60', '1 Hour', 60, 100, 125),
  ('ts-120', '2 Hours', 120, 175, 220)
ON CONFLICT (id) DO NOTHING;

-- Default Reviews
INSERT INTO reviews (id, customer_name, rating, comment, date, approved) VALUES
  ('r-1', 'Mike T.', 5, 'Amazing experience! The jet skis were in great condition and the staff was super helpful. Will definitely come back!', '2026-02-10', true),
  ('r-2', 'Sarah L.', 5, 'Perfect way to spend a sunny afternoon. Booking online was so easy and we got right on the water. Highly recommend!', '2026-02-05', true),
  ('r-3', 'Jason R.', 4, 'Great fun! The 1-hour ride was just the right amount of time. Only wish they had more jet skis so the wait was shorter on busy days.', '2026-01-28', true),
  ('r-4', 'Emily K.', 5, 'Took my kids for the first time and they LOVED it. Super safe, well-maintained equipment. 10/10!', '2026-01-20', true)
ON CONFLICT (id) DO NOTHING;

-- Settings
INSERT INTO settings (id, business_name, business_phone, business_email, business_address, operating_hours_start, operating_hours_end)
VALUES (1, 'Jet''s Ski Rentals', '(850) 276-6063', 'info@getwetwithjet.com', 'Coastal Florida', '09:00', '18:00')
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_phone = EXCLUDED.business_phone;

-- ============================================
-- Storage bucket (run separately in Supabase dashboard):
-- Go to Storage → Create new bucket → Name: "waiver-files" → Private
-- ============================================
