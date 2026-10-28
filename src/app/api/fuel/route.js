import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const { searchParams } = new URL(request.url);
  const vehicleIdParam = searchParams.get('vehicle_id');
  const vehicleId = vehicleIdParam ? parseInt(vehicleIdParam, 10) : null;

  const { rows } = await query(
    `SELECT f.fuel_id, f.vehicle_id, f.litres, f.cost, f.logged_on,
            v.plate_no
     FROM fuel_logs f
     JOIN vehicles v ON v.vehicle_id = f.vehicle_id
     WHERE ($1::INT IS NULL OR f.vehicle_id = $1)
     ORDER BY f.logged_on DESC`,
    [vehicleId]
  );

  return ok(rows);
});

export const POST = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const body = await request.json();
  const { vehicle_id, litres, cost, logged_on } = body || {};

  const { rows } = await query(
    `INSERT INTO fuel_logs (vehicle_id, litres, cost, logged_on)
     VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE))
     RETURNING fuel_id, vehicle_id, litres, cost, logged_on`,
    [vehicle_id, litres, cost, logged_on || null]
  );

  return ok(rows[0], 201);
});

