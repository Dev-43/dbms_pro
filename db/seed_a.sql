-- seed_a.sql (OWNER: Person A) — users, categories, vehicles, customers
-- Dates are relative to CURRENT_DATE so the seed stays valid whenever it is run.

INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Admin User', 'admin@rental.local', crypt('Admin@123', gen_salt('bf')), 'admin'),
  ('Staff User', 'staff@rental.local', crypt('Staff@123', gen_salt('bf')), 'staff');

INSERT INTO vehicle_categories (name, daily_rate) VALUES
  ('Hatchback', 1500), ('Sedan', 2200), ('SUV', 3200), ('Luxury', 5500);

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
  ('MH12 UV 8080', 'Tata',     'Tiago',      2021, 1, 67000);

INSERT INTO customers (full_name, email, phone, license_no, license_expiry) VALUES
  ('Ravi Kulkarni', 'ravi.k@example.com',   '9800000001', 'MH1220180001', CURRENT_DATE + 900),
  ('Sneha Patil',   'sneha.p@example.com',  '9800000002', 'MH1220190002', CURRENT_DATE + 700),
  ('Amit Shah',     'amit.s@example.com',   '9800000003', 'MH1220170003', CURRENT_DATE + 1200),
  ('Neha Joshi',    'neha.j@example.com',   '9800000004', 'MH1220200004', CURRENT_DATE + 800),
  ('Rohan Desai',   'rohan.d@example.com',  '9800000005', 'MH1220210005', CURRENT_DATE + 1500),
  ('Priya Nair',    'priya.n@example.com',  '9800000006', 'MH1220160006', CURRENT_DATE + 600),
  ('Karan Mehta',   'karan.m@example.com',  '9800000007', 'MH1220150007', CURRENT_DATE + 20),
  ('Vikas Pawar',   'vikas.p@example.com',  '9800000008', 'MH1220120008', CURRENT_DATE - 30);
