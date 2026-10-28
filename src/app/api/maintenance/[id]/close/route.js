import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const PATCH = handle(async (request, { params }) => {
  await requireRole(request, ['admin', 'staff']);

  const id = parseInt(params.id, 10);
  const body = await request.json().catch(() => ({}));
  const { cost } = body || {};

  const { rows } = await query(
    `UPDATE maintenance
     SET closed_on = CURRENT_DATE,
         cost = COALESCE($1, cost)
     WHERE maintenance_id = $2
     RETURNING maintenance_id, vehicle_id, description, cost, opened_on, closed_on`,
    [cost !== undefined && cost !== null && cost !== '' ? parseFloat(cost) : null, id]
  );

  if (rows.length === 0) {
    const err = new Error('Maintenance record not found');
    err.status = 404;
    throw err;
  }

  return ok(rows[0]);
});

