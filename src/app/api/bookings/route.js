import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || null;

  const { rows } = await query(
    `SELECT b.booking_id, b.customer_id, b.vehicle_id, b.start_date, b.end_date, b.returned_on,
            b.status, b.total_amount, b.created_by,
            c.full_name AS customer_name, v.plate_no
     FROM bookings b
     JOIN customers c ON c.customer_id = b.customer_id
     JOIN vehicles v  ON v.vehicle_id  = b.vehicle_id
     WHERE ($1::VARCHAR IS NULL OR b.status = $1)
     ORDER BY b.booking_id DESC`,
    [status]
  );

  return ok(rows);
});

export const POST = handle(async (request) => {
  const session = await requireRole(request, ['admin', 'staff']);

  const body = await request.json();
  const { customer_id, vehicle_id, start_date, end_date } = body || {};

  const { rows } = await query(
    `INSERT INTO bookings (customer_id, vehicle_id, start_date, end_date, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING booking_id, customer_id, vehicle_id, start_date, end_date, returned_on, status, total_amount, created_by`,
    [customer_id, vehicle_id, start_date, end_date, session.user_id]
  );

  return ok(rows[0], 201);
});

