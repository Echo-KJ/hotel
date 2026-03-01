-- Migration: 008_housekeeping_rpc.sql
-- Function to mark room as clean (Housekeeping workflow)

CREATE OR REPLACE FUNCTION mark_room_clean(
  p_room_id UUID,
  p_cleaned_by UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check permission: User must be housekeeping, manager, or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
      AND role IN ('housekeeping', 'manager', 'admin')
  ) THEN
    -- If public.users table doesn't exist or logic differs, this check might fail or be skipped.
    -- Assuming public.users table exists with 'role' column based on src/types.
    RAISE EXCEPTION 'Permission denied: User does not have housekeeping privileges';
  END IF;

  -- Update room status
  UPDATE rooms
  SET
    status = 'vacant_clean', -- Using 'vacant_clean' to match RoomStatus type (instead of 'available')
    last_cleaned_at = NOW(),
    last_cleaned_by = p_cleaned_by,
    housekeeping_notes = p_notes,
    updated_at = NOW()
  WHERE id = p_room_id
    AND status = 'vacant_dirty';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room is not in vacant_dirty status — cannot mark clean';
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;
