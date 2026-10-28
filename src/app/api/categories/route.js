import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const { rows } = await query(
    'SELECT category_id, name, daily_rate FROM vehicle_categories ORDER BY category_id ASC'
  );

  return ok(rows);
});

export const POST = handle(async (request) => {
  await requireRole(request, ['admin']);

  const body = await request.json();
  const { name, daily_rate } = body || {};

  const { rows } = await query(
    'INSERT INTO vehicle_categories (name, daily_rate) VALUES ($1, $2) RETURNING category_id, name, daily_rate',
    [name, daily_rate]
  );

  return ok(rows[0], 201);
});

