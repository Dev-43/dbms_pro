-- tests.sql — automated scenario tests S1–S14 (run after reset.sh)
-- Usage: psql "$PG_URL/rental_fleet" -v ON_ERROR_STOP=1 -f db/tests.sql
-- Everything runs inside one transaction that is rolled back, so the data is untouched.
BEGIN;

-- helper: run a statement, require that it fails with the expected message (or SQLSTATE)
CREATE FUNCTION pg_temp.expect_error(p_label text, p_sql text, p_msg text, p_state text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    IF (p_msg IS NOT NULL AND SQLERRM = p_msg) OR (p_state IS NOT NULL AND SQLSTATE = p_state) THEN
      RAISE NOTICE 'PASS %', p_label;
      RETURN;
    END IF;
    RAISE EXCEPTION 'FAIL %: got [%] %', p_label, SQLSTATE, SQLERRM;
  END;
  RAISE EXCEPTION 'FAIL %: statement did not fail', p_label;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION pg_temp.assert(p_label text, p_ok boolean) RETURNS void AS $$
BEGIN
  IF p_ok IS TRUE THEN RAISE NOTICE 'PASS %', p_label;
  ELSE RAISE EXCEPTION 'FAIL %', p_label; END IF;
END;
$$ LANGUAGE plpgsql;

-- S1: booking on an In Shop vehicle (vehicle 6 is In Shop in the seed)
SELECT pg_temp.expect_error('S1 in-shop vehicle',
  $q$INSERT INTO bookings(customer_id,vehicle_id,start_date,end_date,created_by)
     VALUES (1,6,CURRENT_DATE+100,CURRENT_DATE+102,1)$q$,
  'Vehicle is not available for booking');

-- S3: customer 8 has an expired licence
SELECT pg_temp.expect_error('S3 expired licence',
  $q$INSERT INTO bookings(customer_id,vehicle_id,start_date,end_date,created_by)
     VALUES (8,10,CURRENT_DATE+100,CURRENT_DATE+102,1)$q$,
  'Customer licence expires before return date');

-- R4: start date in the past
SELECT pg_temp.expect_error('R4 past start date',
  $q$INSERT INTO bookings(customer_id,vehicle_id,start_date,end_date,created_by)
     VALUES (1,10,CURRENT_DATE-1,CURRENT_DATE+2,1)$q$,
  'Start date cannot be in the past');

-- R5: total_amount computed by the database, client value ignored (vehicle 10 = Hatchback 1500/day)
INSERT INTO bookings(customer_id,vehicle_id,start_date,end_date,total_amount,created_by)
VALUES (1,10,CURRENT_DATE+100,CURRENT_DATE+103,1,1);
SELECT pg_temp.assert('R5 total computed (3 days x 1500)',
  (SELECT total_amount = 4500 FROM bookings ORDER BY booking_id DESC LIMIT 1));

-- S2: overlapping booking, same vehicle
SELECT pg_temp.expect_error('S2 overlap rejected (R1)',
  $q$INSERT INTO bookings(customer_id,vehicle_id,start_date,end_date,created_by)
     VALUES (2,10,CURRENT_DATE+101,CURRENT_DATE+104,1)$q$,
  NULL, '23P01');

-- S4: Reserved -> Active makes vehicle Rented
UPDATE bookings SET status='Active' WHERE booking_id = (SELECT max(booking_id) FROM bookings);
SELECT pg_temp.assert('S4 active -> vehicle Rented',
  (SELECT status = 'Rented' FROM vehicles WHERE vehicle_id = 10));

-- R11 / S9: maintenance on a Rented vehicle is rejected
SELECT pg_temp.expect_error('S9 maintenance on rented vehicle',
  $q$INSERT INTO maintenance(vehicle_id,description,cost) VALUES (10,'Test',100)$q$,
  'Cannot open maintenance on a rented or retired vehicle');

-- S7: overpayment
SELECT pg_temp.expect_error('S7 overpayment',
  $q$INSERT INTO payments(booking_id,amount,method)
     VALUES ((SELECT max(booking_id) FROM bookings), 4500.01, 'Cash')$q$,
  'Payment exceeds outstanding balance');
INSERT INTO payments(booking_id,amount,method)
VALUES ((SELECT max(booking_id) FROM bookings), 4500, 'Cash');
SELECT pg_temp.assert('R9 exact balance accepted', true);

-- S5: Active -> Completed makes vehicle Available and sets returned_on
UPDATE bookings SET status='Completed' WHERE booking_id = (SELECT max(booking_id) FROM bookings);
SELECT pg_temp.assert('S5 completed -> vehicle Available',
  (SELECT status = 'Available' FROM vehicles WHERE vehicle_id = 10));
SELECT pg_temp.assert('S5 returned_on = today',
  (SELECT returned_on = CURRENT_DATE FROM bookings ORDER BY booking_id DESC LIMIT 1));

-- S6: Completed -> Active
SELECT pg_temp.expect_error('S6 invalid transition',
  $q$UPDATE bookings SET status='Active' WHERE booking_id = (SELECT max(booking_id) FROM bookings)$q$,
  'Invalid booking status transition');

-- R10: payment on a cancelled booking (seed booking 10 is Cancelled)
SELECT pg_temp.expect_error('R10 pay cancelled booking',
  $q$INSERT INTO payments(booking_id,amount,method) VALUES (10, 100, 'Cash')$q$,
  'Cannot pay a cancelled booking');

-- R7: activating a booking whose vehicle is not Available
-- (booking 7 is Reserved on vehicle 4; put vehicle 4 In Shop first)
INSERT INTO maintenance(vehicle_id,description,cost) VALUES (4,'Test service',500);
SELECT pg_temp.assert('S8 maintenance -> vehicle In Shop',
  (SELECT status = 'In Shop' FROM vehicles WHERE vehicle_id = 4));
SELECT pg_temp.expect_error('R7 activate on In Shop vehicle',
  $q$UPDATE bookings SET status='Active' WHERE booking_id = 7$q$,
  'Vehicle is not available for booking');

-- S13: two open records, close one -> still In Shop; close the other -> Available (S10)
INSERT INTO maintenance(vehicle_id,description,cost) VALUES (4,'Second test job',300);
UPDATE maintenance SET closed_on = CURRENT_DATE
 WHERE maintenance_id = (SELECT min(maintenance_id) FROM maintenance WHERE vehicle_id=4 AND closed_on IS NULL);
SELECT pg_temp.assert('S13 one open record left -> still In Shop',
  (SELECT status = 'In Shop' FROM vehicles WHERE vehicle_id = 4));
UPDATE maintenance SET closed_on = CURRENT_DATE WHERE vehicle_id = 4 AND closed_on IS NULL;
SELECT pg_temp.assert('S10 all closed -> vehicle Available',
  (SELECT status = 'Available' FROM vehicles WHERE vehicle_id = 4));

-- R14: closed maintenance cannot be updated again
SELECT pg_temp.expect_error('R14 update closed maintenance',
  $q$UPDATE maintenance SET cost = 1 WHERE vehicle_id = 4 AND closed_on IS NOT NULL$q$,
  'Maintenance record is already closed');

-- S11: retire a vehicle that has a Reserved booking (vehicle 4 has booking 7)
SELECT pg_temp.expect_error('S11 retire with open booking',
  $q$UPDATE vehicles SET status='Retired' WHERE vehicle_id = 4$q$,
  'Vehicle has open bookings or maintenance');

-- S12: views agree with the base tables
SELECT pg_temp.assert('S12 revenue view = payments',
  (SELECT SUM(revenue) FROM v_vehicle_profit) = (SELECT SUM(amount) FROM payments));
SELECT pg_temp.assert('S14 overdue view lists seed booking 5',
  EXISTS (SELECT 1 FROM v_overdue_returns WHERE booking_id = 5));

ROLLBACK;
