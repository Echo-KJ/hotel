-- Migration: 014_quick_checkin_rpc.sql
-- Atomic Quick Check-In RPC (Bug 4.1)

-- Reordered parameters to satisfy PostgreSQL requirement: non-default parameters must precede default ones.
CREATE OR REPLACE FUNCTION process_quick_checkin(
  -- Mandatory Parameters (No Defaults)
  p_guest_first_name TEXT,
  p_guest_last_name  TEXT,
  p_guest_phone      TEXT,
  p_room_id          UUID,
  p_check_in_date    DATE,
  p_check_out_date   DATE,
  p_rate_per_night   NUMERIC,
  
  -- Optional Parameters (With Defaults)
  p_guest_email      TEXT DEFAULT NULL,
  p_guest_id_type    TEXT DEFAULT NULL,
  p_guest_id_number  TEXT DEFAULT NULL,
  p_guest_nationality TEXT DEFAULT 'Indian',
  p_adults           INTEGER DEFAULT 1,
  p_children         INTEGER DEFAULT 0,
  p_advance_amount   NUMERIC DEFAULT 0,
  p_payment_method   TEXT DEFAULT 'cash',
  p_performed_by     UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guest_id     UUID;
  v_booking_id   UUID;
  v_stay_id      UUID;
  v_booking_num  TEXT;
  v_nights       INTEGER;
  v_base_amount  NUMERIC;
  v_cgst         NUMERIC;
  v_sgst         NUMERIC;
  v_gst          NUMERIC;
  v_grand        NUMERIC;
  v_cgst_rate    NUMERIC;
  v_sgst_rate    NUMERIC;
  v_total_rate   NUMERIC;
BEGIN
  -- Validate room is available
  -- Validate room is available
  IF EXISTS (
    SELECT 1 FROM rooms WHERE id = p_room_id AND status NOT IN ('available', 'vacant_clean')
  ) THEN
    RAISE EXCEPTION 'Room is not available for check-in. Current status: %', (SELECT status FROM rooms WHERE id = p_room_id);
  END IF;

  -- Check no overlapping active bookings for this room
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE room_id = p_room_id
      AND status IN ('confirmed', 'checked_in')
      AND check_in_date < p_check_out_date
      AND check_out_date > p_check_in_date
  ) THEN
    RAISE EXCEPTION 'Room has a conflicting booking for these dates';
  END IF;

  -- Calculate nights
  v_nights := (p_check_out_date - p_check_in_date);
  IF v_nights < 1 THEN
    RAISE EXCEPTION 'Minimum stay is 1 night';
  END IF;

  -- Calculate GST slab
  -- Using standard slabs: 0% <= 1000, 12% <= 7500, 18% > 7500
  IF p_rate_per_night <= 1000 THEN
    v_cgst_rate := 0; v_sgst_rate := 0;
  ELSIF p_rate_per_night <= 7500 THEN
    v_cgst_rate := 0.06; v_sgst_rate := 0.06;
  ELSE
    v_cgst_rate := 0.09; v_sgst_rate := 0.09;
  END IF;
  
  v_total_rate := v_cgst_rate + v_sgst_rate;

  -- Financial Calculations using "Tax on Top" logic usually, or if inclusive, extracting.
  -- Assuming exclusive tax logic as per backfill script: base + tax = grand.
  v_base_amount := ROUND((p_rate_per_night * v_nights)::numeric, 2);
  v_cgst  := ROUND((v_base_amount * v_cgst_rate)::numeric, 2);
  v_sgst  := ROUND((v_base_amount * v_sgst_rate)::numeric, 2);
  v_gst   := v_cgst + v_sgst;
  v_grand := v_base_amount + v_gst;

  -- Create or find guest
  SELECT id INTO v_guest_id FROM guests
  WHERE phone = p_guest_phone LIMIT 1;

  IF v_guest_id IS NULL THEN
    INSERT INTO guests (
      first_name, last_name, full_name, phone, email, id_type, id_number, nationality,
      created_by, created_at, updated_at
    )
    VALUES (
      p_guest_first_name, p_guest_last_name,
      p_guest_first_name || ' ' || COALESCE(p_guest_last_name, ''),
      p_guest_phone, p_guest_email,
      p_guest_id_type, p_guest_id_number, p_guest_nationality,
      p_performed_by, NOW(), NOW()
    )
    RETURNING id INTO v_guest_id;
  END IF;

  -- Generate booking number
  v_booking_num := 'BK' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');

  -- Create booking
  INSERT INTO bookings (
    booking_number, guest_id, room_id,
    check_in_date, check_out_date,
    adults, children,
    room_rate,      -- nightly rate
    total_amount,   -- total base amount (taxable)
    final_amount,   -- same as total/base for now
    base_amount,    -- total base amount (taxable)
    cgst_amount, sgst_amount, gst_amount, grand_total,
    advance_paid, payment_method,
    status, payment_status, source, created_by,
    created_at, updated_at
  ) VALUES (
    v_booking_num,
    v_guest_id, p_room_id,
    p_check_in_date, p_check_out_date,
    p_adults, p_children,
    p_rate_per_night, -- room_rate (nightly)
    v_base_amount,    -- total_amount
    v_base_amount,    -- final_amount
    v_base_amount,    -- base_amount
    v_cgst, v_sgst, v_gst, v_grand,
    p_advance_amount, p_payment_method,
    'checked_in',
    CASE 
      WHEN p_advance_amount >= (v_grand - 0.01) THEN 'paid'
      WHEN p_advance_amount > 0 THEN 'partial'
      ELSE 'pending' 
    END,
    'walk_in', p_performed_by,
    NOW(), NOW()
  )
  RETURNING id INTO v_booking_id;

  -- Create active stay
  INSERT INTO active_stays (
    booking_id, guest_id, room_id,
    check_in_date, check_out_date,
    actual_check_in_time, is_active,
    created_at, updated_at
  ) VALUES (
    v_booking_id, v_guest_id, p_room_id,
    p_check_in_date, p_check_out_date,
    NOW(), true,
    NOW(), NOW()
  )
  RETURNING id INTO v_stay_id;

  -- Mark room occupied
  UPDATE rooms 
  SET status = 'occupied', updated_at = NOW() 
  WHERE id = p_room_id;

  -- Record advance payment if any
  IF p_advance_amount > 0 THEN
    INSERT INTO payments (
      booking_id, payment_type, amount, payment_method, 
      collected_by, collected_at, created_by, created_at, status
    ) VALUES (
      v_booking_id, 'advance', p_advance_amount, p_payment_method, 
      p_performed_by, NOW(), p_performed_by, NOW(), 'completed'
    );
  END IF;

  RETURN jsonb_build_object(
    'booking_id',     v_booking_id,
    'stay_id',        v_stay_id,
    'booking_number', v_booking_num,
    'guest_id',       v_guest_id,
    'nights',         v_nights,
    'grand_total',    v_grand
  );
END;
$$;
