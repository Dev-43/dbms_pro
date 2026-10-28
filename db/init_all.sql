-- ==============================================================================
-- Vehicle Rental & Fleet Management System
-- Full PostgreSQL Setup Script (Schema + Triggers + Views + Seed Data)
-- ==============================================================================

-- If running manually in psql or pgAdmin, make sure you are connected to `rental_fleet`:
-- CREATE DATABASE rental_fleet;
-- \c rental_fleet

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 2. TABLES & INDEXES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id       SERIAL PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(10) NOT NULL CHECK (role IN ('admin','staff'))
);

CREATE TABLE IF NOT EXISTS vehicle_categories (
  category_id SERIAL PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,
  daily_rate  NUMERIC(10,2) NOT NULL CHECK (daily_rate > 0)
);

CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_id  SERIAL PRIMARY KEY,
  plate_no    VARCHAR(15) NOT NULL UNIQUE,
  make        VARCHAR(50) NOT NULL,
  model       VARCHAR(50) NOT NULL,
  year        INT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  category_id INT NOT NULL REFERENCES vehicle_categories(category_id) ON DELETE RESTRICT,
  odometer_km INT NOT NULL DEFAULT 0 CHECK (odometer_km >= 0),
  status      VARCHAR(10) NOT NULL DEFAULT 'Available'
              CHECK (status IN ('Available','Rented','In Shop','Retired'))
);

CREATE TABLE IF NOT EXISTS customers (
  customer_id    SERIAL PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(100) NOT NULL UNIQUE,
  phone          VARCHAR(15)  NOT NULL,
  license_no     VARCHAR(30)  NOT NULL UNIQUE,
  license_expiry DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id   SERIAL PRIMARY KEY,
  customer_id  INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  vehicle_id   INT NOT NULL REFERENCES vehicles(vehicle_id)   ON DELETE RESTRICT,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  returned_on  DATE,
  status       VARCHAR(10) NOT NULL DEFAULT 'Reserved'
               CHECK (status IN ('Reserved','Active','Completed','Cancelled')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_by   INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  CHECK (end_date > start_date),
  EXCLUDE USING gist (
    vehicle_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  ) WHERE (status IN ('Reserved','Active'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_start ON bookings(vehicle_id, start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE TABLE IF NOT EXISTS payments (
  payment_id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE RESTRICT,
  amount     NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method     VARCHAR(10) NOT NULL CHECK (method IN ('Cash','Card','UPI')),
  paid_on    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance (
  maintenance_id SERIAL PRIMARY KEY,
  vehicle_id     INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  description    TEXT NOT NULL,
  cost           NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  opened_on      DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_on      DATE,
  CHECK (closed_on IS NULL OR closed_on >= opened_on)
);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance(vehicle_id);

CREATE TABLE IF NOT EXISTS fuel_logs (
  fuel_id    SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  litres     NUMERIC(6,2) NOT NULL CHECK (litres > 0),
  cost       NUMERIC(8,2) NOT NULL CHECK (cost > 0),
  logged_on  DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ------------------------------------------------------------------------------
-- 3. FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- R15: Prevent retiring a vehicle if it has open bookings or active maintenance
CREATE OR REPLACE FUNCTION fn_vehicle_retire_guard() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'Retired' AND OLD.status <> 'Retired' THEN
    IF EXISTS (SELECT 1 FROM bookings
               WHERE vehicle_id = NEW.vehicle_id AND status IN ('Reserved','Active'))
       OR EXISTS (SELECT 1 FROM maintenance
                  WHERE vehicle_id = NEW.vehicle_id AND closed_on IS NULL) THEN
      RAISE EXCEPTION 'Vehicle has open bookings or maintenance';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vehicle_retire_guard ON vehicles;
CREATE TRIGGER trg_vehicle_retire_guard
  BEFORE UPDATE OF status ON vehicles
  FOR EACH ROW EXECUTE FUNCTION fn_vehicle_retire_guard();

-- Helper: calculate total booking cost
CREATE OR REPLACE FUNCTION fn_booking_total(p_vehicle_id INT, p_start DATE, p_end DATE)
RETURNS NUMERIC(10,2) AS $$
  SELECT ((p_end - p_start) * c.daily_rate)::NUMERIC(10,2)
  FROM vehicles v
  JOIN vehicle_categories c ON c.category_id = v.category_id
  WHERE v.vehicle_id = p_vehicle_id;
$$ LANGUAGE sql STABLE;

-- R2, R3, R4, R5: Validate booking before insert
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

DROP TRIGGER IF EXISTS trg_booking_validate ON bookings;
CREATE TRIGGER trg_booking_validate
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_booking_validate();

-- R6, R7: Transition booking state & set returned_on
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

DROP TRIGGER IF EXISTS trg_booking_transition ON bookings;
CREATE TRIGGER trg_booking_transition
  BEFORE UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_booking_transition();

-- R8: Sync vehicle status when booking status updates
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

DROP TRIGGER IF EXISTS trg_booking_sync ON bookings;
CREATE TRIGGER trg_booking_sync
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_booking_sync();

-- R9, R10: Payment validation
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

DROP TRIGGER IF EXISTS trg_payment_check ON payments;
CREATE TRIGGER trg_payment_check
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION fn_payment_check();

-- R11, R14: Maintenance validation
CREATE OR REPLACE FUNCTION fn_maintenance_open() RETURNS trigger AS $$
DECLARE
  v_status VARCHAR(10);
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT status INTO v_status FROM vehicles WHERE vehicle_id = NEW.vehicle_id;
    IF v_status IN ('Rented','Retired') THEN
      RAISE EXCEPTION 'Cannot open maintenance on a rented or retired vehicle';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.closed_on IS NOT NULL THEN
      RAISE EXCEPTION 'Maintenance record is already closed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_maintenance_open ON maintenance;
CREATE TRIGGER trg_maintenance_open
  BEFORE INSERT OR UPDATE ON maintenance
  FOR EACH ROW EXECUTE FUNCTION fn_maintenance_open();

-- R12, R13: Sync vehicle status with maintenance
CREATE OR REPLACE FUNCTION fn_maintenance_sync() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.closed_on IS NULL THEN
      UPDATE vehicles SET status = 'In Shop'
       WHERE vehicle_id = NEW.vehicle_id AND status = 'Available';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.closed_on IS NULL AND NEW.closed_on IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM maintenance
                       WHERE vehicle_id = NEW.vehicle_id
                         AND closed_on IS NULL
                         AND maintenance_id <> NEW.maintenance_id) THEN
      UPDATE vehicles SET status = 'Available'
       WHERE vehicle_id = NEW.vehicle_id AND status = 'In Shop';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_maintenance_sync ON maintenance;
CREATE TRIGGER trg_maintenance_sync
  AFTER INSERT OR UPDATE ON maintenance
  FOR EACH ROW EXECUTE FUNCTION fn_maintenance_sync();

-- ------------------------------------------------------------------------------
-- 4. VIEWS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_available_vehicles AS
SELECT v.vehicle_id, v.plate_no, v.make, v.model,
       c.name AS category_name, c.daily_rate
FROM vehicles v
JOIN vehicle_categories c ON c.category_id = v.category_id
WHERE v.status = 'Available';

CREATE OR REPLACE VIEW v_vehicle_profit AS
SELECT v.vehicle_id,
       v.plate_no,
       COALESCE(r.revenue, 0)::NUMERIC(12,2)          AS revenue,
       COALESCE(m.cost, 0)::NUMERIC(12,2)             AS maintenance_cost,
       COALESCE(f.cost, 0)::NUMERIC(12,2)             AS fuel_cost,
       (COALESCE(r.revenue, 0) - COALESCE(m.cost, 0) - COALESCE(f.cost, 0))::NUMERIC(12,2) AS profit
FROM vehicles v
LEFT JOIN (SELECT b.vehicle_id, SUM(p.amount) AS revenue
           FROM bookings b JOIN payments p ON p.booking_id = b.booking_id
           GROUP BY b.vehicle_id) r ON r.vehicle_id = v.vehicle_id
LEFT JOIN (SELECT vehicle_id, SUM(cost) AS cost FROM maintenance GROUP BY vehicle_id) m
       ON m.vehicle_id = v.vehicle_id
LEFT JOIN (SELECT vehicle_id, SUM(cost) AS cost FROM fuel_logs GROUP BY vehicle_id) f
       ON f.vehicle_id = v.vehicle_id;

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT to_char(paid_on, 'YYYY-MM') AS month,
       SUM(amount)::NUMERIC(12,2)  AS revenue
FROM payments
GROUP BY to_char(paid_on, 'YYYY-MM')
ORDER BY month;

CREATE OR REPLACE VIEW v_overdue_returns AS
SELECT b.booking_id,
       v.plate_no,
       c.full_name AS customer_name,
       c.phone,
       b.end_date,
       (CURRENT_DATE - b.end_date) AS days_overdue
FROM bookings b
JOIN vehicles v  ON v.vehicle_id  = b.vehicle_id
JOIN customers c ON c.customer_id = b.customer_id
WHERE b.status = 'Active' AND b.end_date < CURRENT_DATE;

-- ------------------------------------------------------------------------------
-- 5. SEED DATA
-- ------------------------------------------------------------------------------
-- Users (Admin@123 / Staff@123)
INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Admin User', 'admin@rental.local', crypt('Admin@123', gen_salt('bf')), 'admin'),
  ('Staff User', 'staff@rental.local', crypt('Staff@123', gen_salt('bf')), 'staff')
ON CONFLICT (email) DO NOTHING;

-- Vehicle Categories
INSERT INTO vehicle_categories (name, daily_rate) VALUES
  ('Hatchback', 1500), ('Sedan', 2200), ('SUV', 3200), ('Luxury', 5500)
ON CONFLICT (name) DO NOTHING;

-- Vehicles
INSERT INTO vehicles (plate_no, make, model, year, category_id, odometer_km) VALUES
  ('MH12 AB 4521', 'Maruti',   'Swift',      2022, 1, 42000),
  ('MH12 CD 1188', 'Hyundai',  'i20',        2023, 1, 18000),
  ('MH14 EF 7788', 'Honda',    'City',       2022, 2, 31000),
  ('MH12 GH 3344', 'Hyundai',  'Verna',      2021, 2, 55000),
  ('MH12 JK 5566', 'Kia',      'Seltos',     2023, 3, 24000),
  ('MH14 LM 1203', 'Hyundai',  'Creta',      2022, 3, 58000),
  ('MH12 NP 9090', 'Mahindra', 'XUV700',     2023, 3, 15000),
  ('MH01 QR 2020', 'BMW',      '5 Series',   2023, 4, 12000),
  ('MH12 ST 6060', 'Mercedes', 'E-Class',    2022, 4, 27000),
  ('MH12 UV 8080', 'Tata',     'Tiago',      2021, 1, 67000)
ON CONFLICT (plate_no) DO NOTHING;

-- Customers
INSERT INTO customers (full_name, email, phone, license_no, license_expiry) VALUES
  ('Ravi Kulkarni', 'ravi.k@example.com',   '9800000001', 'MH1220180001', CURRENT_DATE + 900),
  ('Sneha Patil',   'sneha.p@example.com',  '9800000002', 'MH1220190002', CURRENT_DATE + 700),
  ('Amit Shah',     'amit.s@example.com',   '9800000003', 'MH1220170003', CURRENT_DATE + 1200),
  ('Neha Joshi',    'neha.j@example.com',   '9800000004', 'MH1220200004', CURRENT_DATE + 800),
  ('Rohan Desai',   'rohan.d@example.com',  '9800000005', 'MH1220210005', CURRENT_DATE + 1500),
  ('Priya Nair',    'priya.n@example.com',  '9800000006', 'MH1220160006', CURRENT_DATE + 600),
  ('Karan Mehta',   'karan.m@example.com',  '9800000007', 'MH1220150007', CURRENT_DATE + 20),
  ('Vikas Pawar',   'vikas.p@example.com',  '9800000008', 'MH1220120008', CURRENT_DATE - 30)
ON CONFLICT (email) DO NOTHING;

-- Seed Bookings & Payments
-- Disable validate trigger temporarily for seed bookings with past dates
ALTER TABLE bookings DISABLE TRIGGER trg_booking_validate;

INSERT INTO bookings (booking_id, customer_id, vehicle_id, start_date, end_date, total_amount, created_by)
SELECT t.id, t.c, t.v, CURRENT_DATE + t.s, CURRENT_DATE + t.e,
       fn_booking_total(t.v, CURRENT_DATE + t.s, CURRENT_DATE + t.e), 1
FROM (VALUES
  (1,  1,  1, -75, -72),   -- #1  will be Completed
  (2,  2,  3, -50, -46),   -- #2  Completed
  (3,  3,  8, -20, -17),   -- #3  Completed
  (4,  4,  5, -12,  -9),   -- #4  Completed
  (5,  5,  2,  -5,  -2),   -- #5  Active and overdue
  (6,  6,  7,  -1,   3),   -- #6  Active
  (7,  7,  4,   5,   8),   -- #7  Reserved
  (8,  5,  9,  10,  14),   -- #8  Reserved
  (9,  1, 10, -30, -28),   -- #9  Cancelled
  (10, 2,  1,   2,   4),   -- #10 Cancelled
  (11, 3,  1,   6,   9),   -- #11 Reserved
  (12, 4,  3,   1,   3)    -- #12 Reserved
) AS t(id, c, v, s, e)
ON CONFLICT (booking_id) DO NOTHING;

SELECT setval('bookings_booking_id_seq', (SELECT COALESCE(MAX(booking_id), 1) FROM bookings));

ALTER TABLE bookings ENABLE TRIGGER trg_booking_validate;

-- Update booking status and returned dates
UPDATE bookings SET status = 'Active'    WHERE booking_id IN (1,2,3,4,5,6);
UPDATE bookings SET status = 'Completed' WHERE booking_id IN (1,2,3,4);
UPDATE bookings SET status = 'Cancelled' WHERE booking_id IN (9,10);
UPDATE bookings SET returned_on = end_date WHERE status = 'Completed';

-- Payments
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

-- Maintenance
INSERT INTO maintenance (vehicle_id, description, cost, opened_on, closed_on) VALUES
  (1, 'Oil change and general service',   4500,  CURRENT_DATE - 60,  CURRENT_DATE - 58),
  (3, 'Brake pad replacement',            3200,  CURRENT_DATE - 40,  CURRENT_DATE - 38),
  (8, 'Annual service and tyre rotation', 9800,  CURRENT_DATE - 25,  CURRENT_DATE - 24),
  (9, 'Gearbox repair',                  28000,  CURRENT_DATE - 100, CURRENT_DATE - 80);

INSERT INTO maintenance (vehicle_id, description, cost, opened_on) VALUES
  (6, 'Clutch plate replacement', 12000, CURRENT_DATE - 2);

-- Fuel Logs
INSERT INTO fuel_logs (vehicle_id, litres, cost, logged_on) VALUES
  (1, 11.40, 1140.00, CURRENT_DATE - 74),
  (1, 12.40, 1240.00, CURRENT_DATE - 45),
  (1, 10.08, 1008.00, CURRENT_DATE - 12),
  (3, 12.96, 1296.00, CURRENT_DATE - 49),
  (3, 11.60, 1160.00, CURRENT_DATE - 20),
  (8, 16.00, 1760.00, CURRENT_DATE - 19),
  (8, 15.40, 1694.00, CURRENT_DATE - 5),
  (5, 14.00, 1400.00, CURRENT_DATE - 11),
  (5, 12.30, 1230.00, CURRENT_DATE - 3),
  (2, 8.80, 880.00, CURRENT_DATE - 4),
  (2, 10.60, 1060.00, CURRENT_DATE - 33),
  (7, 18.00, 1800.00, CURRENT_DATE - 1),
  (9, 16.80, 1848.00, CURRENT_DATE - 90),
  (4, 13.20, 1320.00, CURRENT_DATE - 60),
  (10, 9.60, 960.00, CURRENT_DATE - 31);

