-- seed_b.sql (OWNER: Person B) — bookings and payments
-- Past dates would be rejected by R4, so the VALIDATE trigger is disabled ONLY for the inserts.
-- total_amount is supplied with fn_booking_total because that trigger is what normally computes it.
-- Status changes run with all other triggers enabled.

ALTER TABLE bookings DISABLE TRIGGER trg_booking_validate;

INSERT INTO bookings (customer_id, vehicle_id, start_date, end_date, total_amount, created_by)
SELECT t.c, t.v, CURRENT_DATE + t.s, CURRENT_DATE + t.e,
       fn_booking_total(t.v, CURRENT_DATE + t.s, CURRENT_DATE + t.e), 1
FROM (VALUES
  (1,  1, -75, -72),   -- #1  will be Completed
  (2,  3, -50, -46),   -- #2  Completed
  (3,  8, -20, -17),   -- #3  Completed
  (4,  5, -12,  -9),   -- #4  Completed
  (5,  2,  -5,  -2),   -- #5  Active and overdue
  (6,  7,  -1,   3),   -- #6  Active
  (7,  4,   5,   8),   -- #7  Reserved
  (5,  9,  10,  14),   -- #8  Reserved
  (1, 10, -30, -28),   -- #9  Cancelled
  (2,  1,   2,   4),   -- #10 Cancelled
  (3,  1,   6,   9),   -- #11 Reserved
  (4,  3,   1,   3)    -- #12 Reserved
) AS t(c, v, s, e);

ALTER TABLE bookings ENABLE TRIGGER trg_booking_validate;

UPDATE bookings SET status = 'Active'    WHERE booking_id IN (1,2,3,4,5,6);
UPDATE bookings SET status = 'Completed' WHERE booking_id IN (1,2,3,4);
UPDATE bookings SET status = 'Cancelled' WHERE booking_id IN (9,10);
UPDATE bookings SET returned_on = end_date WHERE status = 'Completed';

-- Payments (paid_on spread over several months)
INSERT INTO payments (booking_id, amount, method, paid_on)
SELECT booking_id, total_amount, 'UPI', start_date::timestamp
FROM bookings WHERE booking_id IN (1,2);

INSERT INTO payments (booking_id, amount, method, paid_on)
SELECT booking_id, round(total_amount / 2, 2), 'Card', start_date::timestamp
FROM bookings WHERE booking_id IN (3,4);
INSERT INTO payments (booking_id, amount, method, paid_on)
SELECT b.booking_id, b.total_amount - round(b.total_amount / 2, 2), 'Cash', b.end_date::timestamp
FROM bookings b WHERE b.booking_id IN (3,4);

INSERT INTO payments (booking_id, amount, method, paid_on)
SELECT booking_id, round(total_amount / 2, 2), 'Cash', start_date::timestamp
FROM bookings WHERE booking_id = 5;
INSERT INTO payments (booking_id, amount, method, paid_on)
SELECT booking_id, round(total_amount * 0.3, 2), 'UPI', start_date::timestamp
FROM bookings WHERE booking_id = 6;
INSERT INTO payments (booking_id, amount, method, paid_on)
SELECT booking_id, round(total_amount * 0.2, 2), 'UPI', now() - interval '1 day'
FROM bookings WHERE booking_id = 7;
