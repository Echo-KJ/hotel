-- Migration: 016_fix_nights_column.sql
-- Fix 'nights' column generated logic issue (Bug 3.3/3.4 fix)

-- 1. Drop the generated column 'nights'
ALTER TABLE bookings DROP COLUMN IF EXISTS nights;

-- 2. Re-add 'nights' as a regular integer column
ALTER TABLE bookings ADD COLUMN nights INTEGER;

-- 3. Calculate and populate 'nights' for existing rows
UPDATE bookings 
SET nights = (check_out_date - check_in_date);

-- 4. Add constraint to ensure nights is always calculated correctly (optional but good practice)
-- Or add a trigger to keep it updated. For now, we'll just make it a regular column to allow inserts.
-- The application logic already calculates nights.

-- 5. Add NOT NULL constraint after population
ALTER TABLE bookings ALTER COLUMN nights SET NOT NULL;
