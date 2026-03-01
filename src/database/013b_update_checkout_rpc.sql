-- Migration: 013b_update_checkout_rpc.sql
-- Update process_checkout RPC to include GSTIN and tax fields (Bug 3.4)

CREATE OR REPLACE FUNCTION process_checkout(
  p_stay_id UUID,
  p_booking_id UUID,
  p_room_id UUID,
  p_invoice_data JSONB,
  p_payment_amount NUMERIC DEFAULT 0,
  p_payment_method TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_collected_by UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
  v_existing_invoice UUID;
  v_total_paid NUMERIC;
  v_hotel_gstin TEXT = NULL;
  v_payment_id UUID;
BEGIN
  -- Idempotency check
  SELECT id INTO v_existing_invoice FROM invoices WHERE booking_id = p_booking_id LIMIT 1;
  
  IF v_existing_invoice IS NOT NULL THEN
    RETURN v_existing_invoice;
  END IF;

  -- Fetch GSTIN safely
  BEGIN
    SELECT gstin INTO v_hotel_gstin FROM hotel_settings LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_hotel_gstin := NULL; -- Handle missing table/column gracefully if migration pending
  END;

  -- 1. Insert Invoice
  INSERT INTO invoices (
    invoice_number,
    booking_id,
    guest_id,
    invoice_date,
    subtotal,
    cgst_rate,
    sgst_rate,
    igst_rate,
    cgst_amount,
    sgst_amount,
    igst_amount,
    total_tax,
    grand_total,
    amount_paid,
    payment_status,
    items,
    notes,
    terms_conditions,
    generated_by,
    created_by,
    is_locked,
    locked_at,
    locked_by,
    hotel_gstin,
    tax_rate_label,
    rate_per_night,
    created_at,
    updated_at
  ) VALUES (
    (p_invoice_data->>'invoice_number')::TEXT,
    p_booking_id,
    (p_invoice_data->>'guest_id')::UUID,
    (p_invoice_data->>'invoice_date')::TIMESTAMPTZ,
    (p_invoice_data->>'subtotal')::NUMERIC,
    (p_invoice_data->>'cgst_rate')::NUMERIC,
    (p_invoice_data->>'sgst_rate')::NUMERIC,
    (p_invoice_data->>'igst_rate')::NUMERIC,
    (p_invoice_data->>'cgst_amount')::NUMERIC,
    (p_invoice_data->>'sgst_amount')::NUMERIC,
    (p_invoice_data->>'igst_amount')::NUMERIC,
    (p_invoice_data->>'total_tax')::NUMERIC,
    (p_invoice_data->>'grand_total')::NUMERIC,
    COALESCE((p_invoice_data->>'amount_paid')::NUMERIC, 0) + p_payment_amount, 
    CASE 
        WHEN (COALESCE((p_invoice_data->>'amount_paid')::NUMERIC, 0) + p_payment_amount) >= ((p_invoice_data->>'grand_total')::NUMERIC - 1) THEN 'paid'
        WHEN (COALESCE((p_invoice_data->>'amount_paid')::NUMERIC, 0) + p_payment_amount) > 0 THEN 'partial'
        ELSE 'pending'
    END,
    (p_invoice_data->'items')::JSONB,
    (p_invoice_data->>'notes')::TEXT,
    (p_invoice_data->>'terms_conditions')::TEXT,
    (p_invoice_data->>'generated_by')::UUID,
    (p_invoice_data->>'generated_by')::UUID,
    TRUE, -- Lock immediately on checkout
    NOW(),
    (p_invoice_data->>'generated_by')::UUID,
    v_hotel_gstin,
    (p_invoice_data->>'tax_rate_label')::TEXT,
    (p_invoice_data->>'rate_per_night')::NUMERIC,
    NOW(),
    NOW()
  ) RETURNING id INTO v_invoice_id;

  -- 2. Record Balance Payment
  IF p_payment_amount > 0 THEN
    INSERT INTO payments (
      booking_id,
      invoice_id,
      payment_type,
      amount,
      payment_method,
      collected_by,
      created_by,
      collected_at,
      created_at,
      status
    ) VALUES (
      p_booking_id,
      v_invoice_id, -- Link to invoice
      'balance',
      p_payment_amount,
      p_payment_method,
      p_collected_by,
      p_collected_by,
      NOW(),
      NOW(),
      'completed'
    ) RETURNING id INTO v_payment_id;
  END IF;

  -- 3. Update active_stays
  UPDATE active_stays 
  SET 
    is_active = false, 
    actual_check_out_time = NOW(),
    updated_at = NOW()
  WHERE id = p_stay_id;

  -- 4. Update bookings
  UPDATE bookings 
  SET 
    status = 'checked_out', 
    updated_at = NOW(),
    payment_status = (SELECT payment_status FROM invoices WHERE id = v_invoice_id)
  WHERE id = p_booking_id;

  -- 5. Update rooms
  UPDATE rooms 
  SET 
    status = 'vacant_dirty', 
    updated_at = NOW() 
  WHERE id = p_room_id;

  RETURN v_invoice_id;

EXCEPTION WHEN OTHERS THEN
  RAISE; 
END;
$$;
