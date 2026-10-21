-- seed_c.sql (OWNER: Person C) — maintenance and fuel logs
-- Closed rows first, then one open row (the trigger puts that vehicle In Shop).

INSERT INTO maintenance (vehicle_id, description, cost, opened_on, closed_on) VALUES
  (1, 'Oil change and general service',   4500,  CURRENT_DATE - 60,  CURRENT_DATE - 58),
  (3, 'Brake pad replacement',            3200,  CURRENT_DATE - 40,  CURRENT_DATE - 38),
  (8, 'Annual service and tyre rotation', 9800,  CURRENT_DATE - 25,  CURRENT_DATE - 24),
  (9, 'Gearbox repair',                  28000,  CURRENT_DATE - 100, CURRENT_DATE - 80);

INSERT INTO maintenance (vehicle_id, description, cost, opened_on) VALUES
  (6, 'Clutch plate replacement', 12000, CURRENT_DATE - 2);

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
