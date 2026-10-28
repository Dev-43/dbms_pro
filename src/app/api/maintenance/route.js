import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const { rows } = await query(
    `SELECT m.maintenance_id, m.vehicle_id, m.description, m.cost, m.opened_on, m.closed_on,
            v.plate_no
     FROM maintenance m
     JOIN vehicles v ON v.vehicle_id = m.vehicle_id
     ORDER BY m.opened_on DESC`
  );

  return ok(rows);
});

export const POST = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const body = await request.json();
  const { vehicle_id, description, cost } = body || {};

  const { rows } = await query(
    `INSERT INTO maintenance (vehicle_id, description, cost)
     VALUES ($1, $2, COALESCE($3, 0))
     RETURNING maintenance_id, vehicle_id, description, cost, opened_on, closed_on`,
    [vehicle_id, description, cost]
  );

  return ok(rows[0], 201);
});

