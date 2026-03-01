-- Migration: 011_audit_fields.sql
-- Add audit columns, triggers, and audit log table (Bug 2.5)

-- 1. Add audit columns
-- Bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Charges
ALTER TABLE charges
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_void BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS void_reason TEXT,
  ADD COLUMN IF NOT EXISTS void_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS void_at TIMESTAMPTZ;

-- Invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id);

-- Payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS charges_updated_at ON charges;
CREATE TRIGGER charges_updated_at
  BEFORE UPDATE ON charges
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT NOT NULL,  -- 'booking', 'charge', 'invoice', 'payment'
  entity_id    UUID NOT NULL,
  action       TEXT NOT NULL,  -- 'insert', 'update', 'delete', 'void', 'lock'
  changed_by   UUID REFERENCES auth.users(id),
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  old_data     JSONB,
  new_data     JSONB,
  change_summary TEXT
);

CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_changed_at_idx ON audit_log(changed_at);
CREATE INDEX IF NOT EXISTS audit_log_changed_by_idx ON audit_log(changed_by);

-- 4. Audit Trigger Function
CREATE OR REPLACE FUNCTION log_financial_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (entity_type, entity_id, action, changed_by, old_data, new_data, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'update', NEW.updated_by, to_jsonb(OLD), to_jsonb(NEW), NOW());
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (entity_type, entity_id, action, changed_by, new_data, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'insert', NEW.created_by, to_jsonb(NEW), NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS charges_audit ON charges;
CREATE TRIGGER charges_audit AFTER INSERT OR UPDATE ON charges
  FOR EACH ROW EXECUTE FUNCTION log_financial_changes();

DROP TRIGGER IF EXISTS invoices_audit ON invoices;
CREATE TRIGGER invoices_audit AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION log_financial_changes();

-- 5. Invoice Lock RLS
-- Enable RLS if not already
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy to prevent updates to locked invoices
-- Note: Logic for 'admin' check depends on implementation of get_user_role() or similar.
-- Assuming standard auth setup or helper.
-- If get_user_role doesn't exist, this might fail.
-- I'll wrap in DO block to check function existence or use simple check.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') THEN
      CREATE POLICY "invoices_update_only_unlocked" ON invoices
      FOR UPDATE
      USING (
        is_locked = FALSE
        OR get_user_role() = 'admin'
      );
  ELSE
      -- Fallback: Allow if is_locked is false.
      CREATE POLICY "invoices_update_only_unlocked" ON invoices
      FOR UPDATE
      USING (is_locked = FALSE);
  END IF;
END $$;
