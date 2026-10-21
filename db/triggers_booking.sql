-- triggers_booking.sql (OWNER: Person B) — rules R2–R10 and fn_booking_total

CREATE OR REPLACE FUNCTION fn_booking_total(p_vehicle_id INT, p_start DATE, p_end DATE)
RETURNS NUMERIC(10,2) AS $$
  SELECT ((p_end - p_start) * c.daily_rate)::NUMERIC(10,2)
  FROM vehicles v
  JOIN vehicle_categories c ON c.category_id = v.category_id
  WHERE v.vehicle_id = p_vehicle_id;
$$ LANGUAGE sql STABLE;

-- R2, R3, R4, R5 (BEFORE INSERT)
CREATE OR REPLACE FUNCTION fn_booking_validate() RETURNS trigger AS $$
DECLARE
  v_status  VARCHAR(10);
  v_license DATE;
BEGIN
  SELECT status INTO v_status FROM vehicles WHERE vehicle_id = NEW.vehicle_id;
  IF v_status IN ('In Shop','Retired') THEN
    RAISE EXCEPTION 'Vehicle is not available for booking';
  END IF;

  SELECT license_expiry INTO v_license FROM customers WHERE customer_id = NEW.customer_id;
  IF v_license IS NOT NULL AND v_license < NEW.end_date THEN
    RAISE EXCEPTION 'Customer licence expires before return date';
  END IF;

  IF NEW.start_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Start date cannot be in the past';
  END IF;

  NEW.status       := 'Reserved';
  NEW.returned_on  := NULL;
  NEW.total_amount := COALESCE(fn_booking_total(NEW.vehicle_id, NEW.start_date, NEW.end_date), 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_validate
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_booking_validate();

-- R6, R7 (BEFORE UPDATE OF status) + sets returned_on on completion
CREATE OR REPLACE FUNCTION fn_booking_transition() RETURNS trigger AS $$
DECLARE
  v_status VARCHAR(10);
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT ( (OLD.status = 'Reserved' AND NEW.status IN ('Active','Cancelled'))
        OR (OLD.status = 'Active'   AND NEW.status = 'Completed') ) THEN
    RAISE EXCEPTION 'Invalid booking status transition';
  END IF;

  IF OLD.status = 'Reserved' AND NEW.status = 'Active' THEN
    SELECT status INTO v_status FROM vehicles WHERE vehicle_id = NEW.vehicle_id;
    IF v_status IS DISTINCT FROM 'Available' THEN
      RAISE EXCEPTION 'Vehicle is not available for booking';
    END IF;
  END IF;

  IF NEW.status = 'Completed' THEN
    NEW.returned_on := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_transition
  BEFORE UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_booking_transition();

-- R8 (AFTER UPDATE OF status): keep vehicles.status in sync
CREATE OR REPLACE FUNCTION fn_booking_sync() RETURNS trigger AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'Active' THEN
    UPDATE vehicles SET status = 'Rented' WHERE vehicle_id = NEW.vehicle_id;
  ELSIF NEW.status = 'Completed' THEN
    UPDATE vehicles
       SET status = CASE
             WHEN EXISTS (SELECT 1 FROM maintenance
                          WHERE vehicle_id = NEW.vehicle_id AND closed_on IS NULL)
             THEN 'In Shop' ELSE 'Available' END
     WHERE vehicle_id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_sync
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_booking_sync();

-- R9, R10 (BEFORE INSERT ON payments)
CREATE OR REPLACE FUNCTION fn_payment_check() RETURNS trigger AS $$
DECLARE
  v_status  VARCHAR(10);
  v_total   NUMERIC(10,2);
  v_paid    NUMERIC(10,2);
BEGIN
  SELECT status, total_amount INTO v_status, v_total
    FROM bookings WHERE booking_id = NEW.booking_id FOR UPDATE;

  IF v_status = 'Cancelled' THEN
    RAISE EXCEPTION 'Cannot pay a cancelled booking';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM payments WHERE booking_id = NEW.booking_id;
  IF v_total IS NOT NULL AND NEW.amount > (v_total - v_paid) THEN
    RAISE EXCEPTION 'Payment exceeds outstanding balance';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_check
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION fn_payment_check();
