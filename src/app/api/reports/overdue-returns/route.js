import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const { rows } = await query(`
    SELECT booking_id, plate_no, customer_name, phone, end_date, days_overdue
    FROM v_overdue_returns
    ORDER BY days_overdue DESC;
  `);

  return ok(rows);
});

