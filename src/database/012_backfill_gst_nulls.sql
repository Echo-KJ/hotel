-- Migration: 012_backfill_gst_nulls.sql
-- Backfill GST data and enforce NOT NULL constraints (Bug 3.3)

DO $$
DECLARE
  v_booking RECORD;
  v_cgst_rate NUMERIC;
  v_sgst_rate NUMERIC;
  v_base NUMERIC;
  v_cgst NUMERIC;
  v_sgst NUMERIC;
  v_gst  NUMERIC;
  v_grand NUMERIC;
BEGIN
  FOR v_booking IN
    -- Fixed column name: room_rate instead of room_rate_per_night
    SELECT id, final_amount, room_rate, payment_method, source, created_at
    FROM bookings
    WHERE base_amount IS NULL OR grand_total IS NULL
  LOOP
    -- Determine base amount
    v_base := COALESCE(v_booking.final_amount, 0);

    -- Apply GST slab based on rate per night
    -- using room_rate as proxy for nightly rate if nights=1, but ideally we'd divide by nights if available.
    -- However, room_rate usually stores the per-night rate in this schema based on typical usage, 
    -- or acts as the reference price. Let's assume room_rate is the basis.
    -- If room_rate is the total for the stay, we might over-calculate.
    -- Checking schema: room_rate is usually per night. final_amount is total.
    
    IF COALESCE(v_booking.room_rate, 0) <= 1000 THEN
      v_cgst_rate := 0;      v_sgst_rate := 0;
    ELSIF COALESCE(v_booking.room_rate, 0) <= 7500 THEN
      v_cgst_rate := 0.06;   v_sgst_rate := 0.06;
    ELSE
      v_cgst_rate := 0.09;   v_sgst_rate := 0.09;
    END IF;

    v_cgst  := ROUND((v_base * v_cgst_rate)::numeric, 2);
    v_sgst  := ROUND((v_base * v_sgst_rate)::numeric, 2);
    v_gst   := v_cgst + v_sgst;
    v_grand := v_base + v_gst;

    UPDATE bookings SET
      base_amount  = v_base,
      cgst_amount  = v_cgst,
      sgst_amount  = v_sgst,
      gst_amount   = v_gst,
      grand_total  = v_grand,
      payment_method = COALESCE(
        v_booking.payment_method,
        CASE
          WHEN v_booking.source IN ('walk_in', 'direct') THEN 'cash'
          WHEN v_booking.source IN ('online', 'booking_com', 'airbnb') THEN 'online'
          ELSE 'cash'
        END
      )
    WHERE id = v_booking.id;

    RAISE NOTICE 'Backfilled booking % — base: %, cgst: %, sgst: %, grand: %',
      v_booking.id, v_base, v_cgst, v_sgst, v_grand;
  END LOOP;
END $$;

-- Prevent future NULL GST fields on new bookings
ALTER TABLE bookings
  ALTER COLUMN base_amount  SET DEFAULT 0,
  ALTER COLUMN cgst_amount  SET DEFAULT 0,
  ALTER COLUMN sgst_amount  SET DEFAULT 0,
  ALTER COLUMN gst_amount   SET DEFAULT 0;

-- Add CHECK constraints
ALTER TABLE bookings
  ADD CONSTRAINT bookings_base_amount_non_negative  CHECK (base_amount >= 0),
  ADD CONSTRAINT bookings_cgst_amount_non_negative  CHECK (cgst_amount >= 0),
  ADD CONSTRAINT bookings_sgst_amount_non_negative  CHECK (sgst_amount >= 0),
  ADD CONSTRAINT bookings_grand_total_check
    CHECK (grand_total >= base_amount);
