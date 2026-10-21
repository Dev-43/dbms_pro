-- queries_c.sql (Person C) — showcase queries: maintenance, fuel and reports

-- Q1: top 3 vehicles by profit (view)
SELECT plate_no, revenue, maintenance_cost, fuel_cost, profit
FROM v_vehicle_profit
ORDER BY profit DESC
LIMIT 3;

-- Q2: vehicles currently In Shop with their open maintenance (JOIN)
SELECT v.plate_no, m.description, m.opened_on, (CURRENT_DATE - m.opened_on) AS days_in_shop
FROM vehicles v
JOIN maintenance m ON m.vehicle_id = v.vehicle_id AND m.closed_on IS NULL
WHERE v.status = 'In Shop';

-- Q3: monthly fuel cost per vehicle (GROUP BY + HAVING)
SELECT v.plate_no, to_char(f.logged_on, 'YYYY-MM') AS month, SUM(f.cost) AS fuel_cost
FROM fuel_logs f
JOIN vehicles v ON v.vehicle_id = f.vehicle_id
GROUP BY v.plate_no, to_char(f.logged_on, 'YYYY-MM')
HAVING SUM(f.cost) > 0
ORDER BY v.plate_no, month;

-- Q4: vehicles never sent to maintenance (NOT EXISTS)
SELECT v.plate_no, v.make, v.model
FROM vehicles v
WHERE NOT EXISTS (SELECT 1 FROM maintenance m WHERE m.vehicle_id = v.vehicle_id);

-- Q5: running total of revenue by month (window function)
SELECT month, revenue, SUM(revenue) OVER (ORDER BY month) AS running_total
FROM v_monthly_revenue
ORDER BY month;
