-- Migration: 007_cancel_rpc.sql
-- Function to handle atomic cancellation process

CREATE OR REPLACE FUNCTION process_cancellation(
  p_booking_id UUID,
  p_room_id UUID,
  p_reason TEXT,
  p_cancelled_by UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate state and update booking
  UPDATE bookings
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_cancelled_by,
    cancellation_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_booking_id
    AND status IN ('confirmed', 'tentative', 'pending'); -- Added tentative/pending as cancelable

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking cannot be cancelled in its current state or does not exist (ID: %)', p_booking_id;
  END IF;

  -- Update room status to available if a room was assigned
  IF p_room_id IS NOT NULL THEN
    UPDATE rooms
    SET 
      status = 'available', 
      updated_at = NOW()
    WHERE id = p_room_id;
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;
