import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || null;
  const categoryIdParam = searchParams.get('category_id');
  const categoryId = categoryIdParam ? parseInt(categoryIdParam, 10) : null;

  const { rows } = await query(
    `SELECT v.vehicle_id, v.plate_no, v.make, v.model, v.year, v.category_id, v.odometer_km, v.status,
            c.name AS category_name, c.daily_rate
     FROM vehicles v
     JOIN vehicle_categories c ON c.category_id = v.category_id
     WHERE ($1::VARCHAR IS NULL OR v.status = $1)
       AND ($2::INT IS NULL OR v.category_id = $2)
     ORDER BY v.vehicle_id ASC`,
    [status, categoryId]
  );

  return ok(rows);
});

export const POST = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const body = await request.json();
  const { plate_no, make, model, year, category_id, odometer_km } = body || {};

  const { rows } = await query(
    `INSERT INTO vehicles (plate_no, make, model, year, category_id, odometer_km, status)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 0), 'Available')
     RETURNING vehicle_id, plate_no, make, model, year, category_id, odometer_km, status`,
    [plate_no, make, model, year, category_id, odometer_km]
  );

  return ok(rows[0], 201);
});

