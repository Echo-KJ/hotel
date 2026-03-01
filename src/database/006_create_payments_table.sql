-- Migration: 006_create_payments_table.sql
-- Create payments table if it doesn't exist (to support Checkout RPC)

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  invoice_id UUID REFERENCES invoices(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'card', 'upi', 'online'
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'completed', -- 'completed', 'failed', 'pending'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
