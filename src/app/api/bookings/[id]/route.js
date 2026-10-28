import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request, { params }) => {
  await requireRole(request, ['admin', 'staff']);

  const id = parseInt(params.id, 10);

  const { rows } = await query(
    `SELECT b.booking_id, b.customer_id, b.vehicle_id, b.start_date, b.end_date, b.returned_on,
            b.status, b.total_amount, b.created_by,
            c.full_name AS customer_name, v.plate_no,
            COALESCE(p.paid, 0)::NUMERIC(10,2) AS paid,
            (b.total_amount - COALESCE(p.paid, 0))::NUMERIC(10,2) AS balance
     FROM bookings b
     JOIN customers c ON c.customer_id = b.customer_id
     JOIN vehicles v  ON v.vehicle_id  = b.vehicle_id
     LEFT JOIN (
       SELECT booking_id, SUM(amount) AS paid
       FROM payments
       GROUP BY booking_id
     ) p ON p.booking_id = b.booking_id
     WHERE b.booking_id = $1`,
    [id]
  );

  if (rows.length === 0) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  const booking = rows[0];

  const paymentsRes = await query(
    `SELECT payment_id, booking_id, amount, method, paid_on
     FROM payments
     WHERE booking_id = $1
     ORDER BY paid_on ASC`,
    [id]
  );

  booking.payments = paymentsRes.rows;

  return ok(booking);
});

