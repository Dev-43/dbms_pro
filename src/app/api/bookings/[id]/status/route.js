import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const PATCH = handle(async (request, { params }) => {
  await requireRole(request, ['admin', 'staff']);

  const id = parseInt(params.id, 10);
  const body = await request.json();
  const { status } = body || {};

  if (!['Active', 'Cancelled', 'Completed'].includes(status)) {
    const err = new Error('Invalid input');
    err.status = 400;
    throw err;
  }

  const { rows } = await query(
    `UPDATE bookings
     SET status = $1
     WHERE booking_id = $2
     RETURNING booking_id, customer_id, vehicle_id, start_date, end_date, returned_on, status, total_amount, created_by`,
    [status, id]
  );

  if (rows.length === 0) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  return ok(rows[0]);
});

