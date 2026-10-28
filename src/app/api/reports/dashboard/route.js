import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const { rows } = await query(`
    SELECT
      COUNT(*)::INT AS vehicles_total,
      COUNT(*) FILTER (WHERE status = 'Available')::INT AS available,
      COUNT(*) FILTER (WHERE status = 'Rented')::INT AS rented,
      COUNT(*) FILTER (WHERE status = 'In Shop')::INT AS in_shop,
      (SELECT COUNT(*)::INT FROM bookings WHERE status = 'Active') AS active_bookings,
      (SELECT COUNT(*)::INT FROM v_overdue_returns) AS overdue_returns
    FROM vehicles;
  `);

  return ok(rows[0] || {
    vehicles_total: 0,
    available: 0,
    rented: 0,
    in_shop: 0,
    active_bookings: 0,
    overdue_returns: 0,
  });
});

