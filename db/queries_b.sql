-- queries_b.sql (Person B) — showcase queries: bookings and payments

-- Q1: booking details with customer and vehicle (3-table JOIN)
SELECT b.booking_id, c.full_name AS customer, v.plate_no, b.start_date, b.end_date, b.status, b.total_amount
FROM bookings b
JOIN customers c ON c.customer_id = b.customer_id
JOIN vehicles  v ON v.vehicle_id  = b.vehicle_id
ORDER BY b.booking_id;

-- Q2: total paid and balance per booking (LEFT JOIN + GROUP BY)
SELECT b.booking_id, b.total_amount,
       COALESCE(SUM(p.amount), 0) AS paid,
       b.total_amount - COALESCE(SUM(p.amount), 0) AS balance
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.booking_id
WHERE b.status <> 'Cancelled'
GROUP BY b.booking_id, b.total_amount
ORDER BY b.booking_id;

-- Q3: vehicles ranked by revenue (window function)
SELECT v.plate_no, COALESCE(SUM(p.amount), 0) AS revenue,
       RANK() OVER (ORDER BY COALESCE(SUM(p.amount), 0) DESC) AS revenue_rank
FROM vehicles v
LEFT JOIN bookings b ON b.vehicle_id = v.vehicle_id
LEFT JOIN payments p ON p.booking_id = b.booking_id
GROUP BY v.vehicle_id, v.plate_no
ORDER BY revenue_rank, v.plate_no;

-- Q4: customers who booked more than once (subquery with IN)
SELECT full_name, phone
FROM customers
WHERE customer_id IN (SELECT customer_id FROM bookings GROUP BY customer_id HAVING COUNT(*) > 1);

-- Q5: bookings overlapping a given date range (daterange overlap)
SELECT booking_id, vehicle_id, start_date, end_date, status
FROM bookings
WHERE status IN ('Reserved', 'Active')
  AND daterange(start_date, end_date, '[)') && daterange(CURRENT_DATE, CURRENT_DATE + 7, '[)');
