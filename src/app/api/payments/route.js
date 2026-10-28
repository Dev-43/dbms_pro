import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const { searchParams } = new URL(request.url);
  const bookingIdParam = searchParams.get('booking_id');
  const bookingId = bookingIdParam ? parseInt(bookingIdParam, 10) : null;

  const { rows } = await query(
    `SELECT p.payment_id, p.booking_id, p.amount, p.method, p.paid_on,
            c.full_name AS customer_name
     FROM payments p
     JOIN bookings b ON b.booking_id = p.booking_id
     JOIN customers c ON c.customer_id = b.customer_id
     WHERE ($1::INT IS NULL OR p.booking_id = $1)
     ORDER BY p.paid_on DESC`,
    [bookingId]
  );

  return ok(rows);
});

export const POST = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const body = await request.json();
  const { booking_id, amount, method } = body || {};

  const { rows } = await query(
    `INSERT INTO payments (booking_id, amount, method)
     VALUES ($1, $2, $3)
     RETURNING payment_id, booking_id, amount, method, paid_on`,
    [booking_id, amount, method]
  );

  return ok(rows[0], 201);
});

