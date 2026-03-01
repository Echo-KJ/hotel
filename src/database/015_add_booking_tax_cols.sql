-- Migration: 015_add_booking_tax_cols.sql
-- Add missing tax columns to bookings table if they don't exist (Bug 3.3/3.4 fix)

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS base_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_amount  NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grand_total NUMERIC(10,2) DEFAULT 0;

-- Now enforce constraints (re-applying from 012 just in case)
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_base_amount_non_negative;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_base_amount_non_negative CHECK (base_amount >= 0);

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_grand_total_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_grand_total_check CHECK (grand_total >= base_amount);
