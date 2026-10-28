import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const PUT = handle(async (request, { params }) => {
  await requireRole(request, ['admin']);

  const id = parseInt(params.id, 10);
  const body = await request.json();
  const { name, daily_rate } = body || {};

  const { rows } = await query(
    'UPDATE vehicle_categories SET name = $1, daily_rate = $2 WHERE category_id = $3 RETURNING category_id, name, daily_rate',
    [name, daily_rate, id]
  );

  if (rows.length === 0) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }

  return ok(rows[0]);
});

