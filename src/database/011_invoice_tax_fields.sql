-- Migration: 011_invoice_tax_fields.sql
-- Add tax/GST compliance fields to invoices table (Bug 3.1, 3.4)

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS rate_per_night NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tax_rate_label TEXT,
  ADD COLUMN IF NOT EXISTS tax_cgst_rate  NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS tax_sgst_rate  NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS hotel_gstin    TEXT;
