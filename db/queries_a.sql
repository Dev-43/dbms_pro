-- queries_a.sql (Person A) — showcase queries: fleet and customers

-- Q1: vehicles with their category (INNER JOIN)
SELECT v.plate_no, v.make, v.model, c.name AS category, c.daily_rate, v.status
FROM vehicles v
JOIN vehicle_categories c ON c.category_id = v.category_id
ORDER BY c.daily_rate, v.plate_no;

-- Q2: vehicles that have never been booked (LEFT JOIN ... IS NULL)
SELECT v.plate_no, v.make, v.model
FROM vehicles v
LEFT JOIN bookings b ON b.vehicle_id = v.vehicle_id
WHERE b.booking_id IS NULL;

-- Q3: number of vehicles per category and status (GROUP BY)
SELECT c.name AS category, v.status, COUNT(*) AS vehicles
FROM vehicles v
JOIN vehicle_categories c ON c.category_id = v.category_id
GROUP BY c.name, v.status
ORDER BY c.name, v.status;

-- Q4: categories with more than 2 vehicles (HAVING)
SELECT c.name AS category, COUNT(*) AS vehicles
FROM vehicles v
JOIN vehicle_categories c ON c.category_id = v.category_id
GROUP BY c.name
HAVING COUNT(*) > 2;

-- Q5: customers whose licence expires in the next 30 days (date expression)
SELECT full_name, phone, license_no, license_expiry, (license_expiry - CURRENT_DATE) AS days_left
FROM customers
WHERE license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
ORDER BY license_expiry;
