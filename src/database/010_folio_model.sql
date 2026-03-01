-- Migration: 010_folio_model.sql
-- Create folio_summary view for unified financial view (Bug 2.3)

CREATE OR REPLACE VIEW folio_summary AS
SELECT
  b.id                                          AS booking_id,
  b.booking_number,
  b.status                                      AS booking_status,
  g.full_name                                   AS guest_name,
  g.phone                                       AS guest_phone,
  r.room_number,
  b.check_in_date,
  b.check_out_date,
  -- Room charges
  COALESCE(b.base_amount, b.final_amount, 0)    AS room_charges,
  -- Additional charges
  COALESCE(
    (SELECT SUM(c.total_amount)
     FROM charges c
     WHERE c.booking_id = b.id), 0
  )                                             AS additional_charges,
  -- Subtotal before tax
  COALESCE(b.base_amount, b.final_amount, 0) +
  COALESCE(
    (SELECT SUM(c.total_amount)
     FROM charges c
     WHERE c.booking_id = b.id), 0
  )                                             AS subtotal,
  -- Tax (Assuming stored in booking or calculated elsewhere, prompt says COALESCE(b.cgst_amount, 0))
  -- Note: existing bookings table might not have cgst_amount if it's new. Use existing structure.
  COALESCE(b.cgst_amount, 0)                    AS cgst,
  COALESCE(b.sgst_amount, 0)                    AS sgst,
  -- Grand total owed
  COALESCE(b.grand_total, b.final_amount, 0)    AS grand_total,
  -- Total paid (from ledger)
  COALESCE(
    (SELECT SUM(p.amount)
     FROM payments p
     WHERE p.booking_id = b.id
       AND p.payment_type != 'refund'), 0
  )                                             AS total_paid,
  -- Total refunded
  COALESCE(
    (SELECT SUM(p.amount)
     FROM payments p
     WHERE p.booking_id = b.id
       AND p.payment_type = 'refund'), 0
  )                                             AS total_refunded,
  -- Balance due (positive = guest owes, negative = hotel owes guest)
  COALESCE(b.grand_total, b.final_amount, 0) -
  COALESCE(
    (SELECT SUM(p.amount)
     FROM payments p
     WHERE p.booking_id = b.id
       AND p.payment_type != 'refund'), 0
  ) +
  COALESCE(
    (SELECT SUM(p.amount)
     FROM payments p
     WHERE p.booking_id = b.id
       AND p.payment_type = 'refund'), 0
  )                                             AS balance_due
FROM bookings b
JOIN guests g ON g.id = b.guest_id
LEFT JOIN rooms r ON r.id = b.room_id; -- Use LEFT JOIN in case room is not assigned yet (e.g. tentative) or deleted

-- Grant access
GRANT SELECT ON folio_summary TO authenticated;
