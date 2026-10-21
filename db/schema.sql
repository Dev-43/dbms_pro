-- schema.sql — Vehicle Rental & Fleet Management System (OWNER: Person A)
-- FROZEN: change only by editing BUILD.md first and getting all 3 members to agree.

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  user_id       SERIAL PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(10) NOT NULL CHECK (role IN ('admin','staff'))
);

CREATE TABLE vehicle_categories (
  category_id SERIAL PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,
  daily_rate  NUMERIC(10,2) NOT NULL CHECK (daily_rate > 0)
);

CREATE TABLE vehicles (
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

CREATE TABLE customers (
  customer_id    SERIAL PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(100) NOT NULL UNIQUE,
  phone          VARCHAR(15)  NOT NULL,
  license_no     VARCHAR(30)  NOT NULL UNIQUE,
  license_expiry DATE NOT NULL
);

CREATE TABLE bookings (
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
CREATE INDEX idx_bookings_vehicle_start ON bookings(vehicle_id, start_date);
CREATE INDEX idx_bookings_status ON bookings(status);

CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE RESTRICT,
  amount     NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method     VARCHAR(10) NOT NULL CHECK (method IN ('Cash','Card','UPI')),
  paid_on    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE maintenance (
  maintenance_id SERIAL PRIMARY KEY,
  vehicle_id     INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  description    TEXT NOT NULL,
  cost           NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  opened_on      DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_on      DATE,
  CHECK (closed_on IS NULL OR closed_on >= opened_on)
);
CREATE INDEX idx_maintenance_vehicle ON maintenance(vehicle_id);

CREATE TABLE fuel_logs (
  fuel_id    SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  litres     NUMERIC(6,2) NOT NULL CHECK (litres > 0),
  cost       NUMERIC(8,2) NOT NULL CHECK (cost > 0),
  logged_on  DATE NOT NULL DEFAULT CURRENT_DATE
);
