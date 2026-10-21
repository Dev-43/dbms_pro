-- views.sql (OWNER: Person C)

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
