-- Recommended Supabase/PostgreSQL Function for Safe Checkout
-- Run this in the Supabase SQL Editor to create a transaction-safe checkout function.

CREATE OR REPLACE FUNCTION checkout_guest(
  p_booking_id UUID,
  p_stay_id UUID,
  p_invoice_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
  v_room_id UUID;
BEGIN
  -- 1. Get room_id from active_stays
  SELECT room_id INTO v_room_id
  FROM active_stays
  WHERE id = p_stay_id;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Stay not found or has no room assigned';
  END IF;

  -- 2. Insert Invoice
  -- We trust the application calculated totals, or we could recalculate here for extra safety.
  INSERT INTO invoices (
    booking_id,
    guest_id,
    invoice_date,
    subtotal,
    cgst_rate,
    cgst_amount,
    sgst_rate,
    sgst_amount,
    total_tax,
    grand_total,
    amount_paid,
    payment_status,
    items
  ) VALUES (
    (p_invoice_data->>'booking_id')::UUID,
    (p_invoice_data->>'guest_id')::UUID,
    (p_invoice_data->>'invoice_date')::TIMESTAMPTZ,
    (p_invoice_data->>'subtotal')::NUMERIC,
    (p_invoice_data->>'cgst_rate')::NUMERIC,
    (p_invoice_data->>'cgst_amount')::NUMERIC,
    (p_invoice_data->>'sgst_rate')::NUMERIC,
    (p_invoice_data->>'sgst_amount')::NUMERIC,
    (p_invoice_data->>'total_tax')::NUMERIC,
    (p_invoice_data->>'grand_total')::NUMERIC,
    (p_invoice_data->>'amount_paid')::NUMERIC,
    p_invoice_data->>'payment_status',
    p_invoice_data->'items'
  )
  RETURNING id INTO v_invoice_id;

  -- 3. Mark stay as inactive
  UPDATE active_stays
  SET 
    is_active = false,
    actual_check_out_time = NOW()
  WHERE id = p_stay_id;

  -- 4. Update booking status
  UPDATE bookings
  SET status = 'checked_out'
  WHERE id = p_booking_id;

  -- 5. Update room status
  UPDATE rooms
  SET status = 'vacant_dirty'
  WHERE id = v_room_id;

  -- Return the created invoice ID
  RETURN jsonb_build_object('invoice_id', v_invoice_id);

EXCEPTION WHEN OTHERS THEN
  -- All updates rollback automatically on exception
  RAISE;
END;
$$;
