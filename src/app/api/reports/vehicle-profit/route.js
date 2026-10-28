import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const { rows } = await query(
    `SELECT vehicle_id, plate_no, revenue, maintenance_cost, fuel_cost, profit
     FROM v_vehicle_profit
     ORDER BY profit DESC`
  );

  return ok(rows);
});

