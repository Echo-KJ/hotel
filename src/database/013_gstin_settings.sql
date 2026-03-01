-- Migration: 013_gstin_settings.sql
-- Add GSTIN and SAC codes to hotel_settings and guest_gstin to guests (Bug 3.4)

ALTER TABLE hotel_settings
  ADD COLUMN IF NOT EXISTS gstin TEXT,
  ADD COLUMN IF NOT EXISTS gstin_registered_name TEXT,
  ADD COLUMN IF NOT EXISTS gstin_state_code TEXT,
  ADD COLUMN IF NOT EXISTS sac_code_accommodation TEXT DEFAULT '998111',
  ADD COLUMN IF NOT EXISTS sac_code_food TEXT DEFAULT '996311',
  ADD COLUMN IF NOT EXISTS sac_code_laundry TEXT DEFAULT '998713',
  ADD COLUMN IF NOT EXISTS sac_code_other TEXT DEFAULT '999799';

-- Add GSTIN validation constraint
ALTER TABLE hotel_settings
  ADD CONSTRAINT valid_gstin CHECK (
    gstin IS NULL OR (
      LENGTH(gstin) = 15 AND
      gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    )
  );

-- Guest GSTIN and Company fields
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS guest_gstin TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT;
