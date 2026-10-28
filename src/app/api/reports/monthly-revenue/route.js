import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const { rows } = await query(
    `SELECT month, revenue
     FROM v_monthly_revenue
     ORDER BY month ASC`
  );

  return ok(rows);
});

