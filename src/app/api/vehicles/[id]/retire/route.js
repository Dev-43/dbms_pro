import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const PATCH = handle(async (request, { params }) => {
  await requireRole(request, ['admin']);

  const id = parseInt(params.id, 10);

  const { rows } = await query(
    `UPDATE vehicles
     SET status = 'Retired'
     WHERE vehicle_id = $1
     RETURNING vehicle_id, plate_no, make, model, year, category_id, odometer_km, status`,
    [id]
  );

  if (rows.length === 0) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  return ok(rows[0]);
});

