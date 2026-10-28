import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request, { params }) => {
  await requireRole(request, ['admin', 'staff']);

  const id = parseInt(params.id, 10);

  const vehicleRes = await query(
    `SELECT v.vehicle_id, v.plate_no, v.make, v.model, v.year, v.category_id, v.odometer_km, v.status,
            c.name AS category_name, c.daily_rate
     FROM vehicles v
     JOIN vehicle_categories c ON c.category_id = v.category_id
     WHERE v.vehicle_id = $1`,
    [id]
  );

  if (vehicleRes.rows.length === 0) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  const vehicle = vehicleRes.rows[0];

  const bookingsRes = await query(
    `SELECT b.booking_id, c.full_name AS customer_name, b.start_date, b.end_date, b.status, b.total_amount
     FROM bookings b
     JOIN customers c ON c.customer_id = b.customer_id
     WHERE b.vehicle_id = $1
     ORDER BY b.start_date DESC`,
    [id]
  );

  const maintenanceRes = await query(
    `SELECT maintenance_id, description, cost, opened_on, closed_on
     FROM maintenance
     WHERE vehicle_id = $1
     ORDER BY opened_on DESC`,
    [id]
  );

  return ok({
    vehicle,
    bookings: bookingsRes.rows,
    maintenance: maintenanceRes.rows,
  });
});

export const PUT = handle(async (request, { params }) => {
  await requireRole(request, ['admin', 'staff']);

  const id = parseInt(params.id, 10);
  const body = await request.json();
  const { make, model, year, category_id, odometer_km } = body || {};

  const { rows } = await query(
    `UPDATE vehicles
     SET make = $1, model = $2, year = $3, category_id = $4, odometer_km = $5
     WHERE vehicle_id = $6
     RETURNING vehicle_id, plate_no, make, model, year, category_id, odometer_km, status`,
    [make, model, year, category_id, odometer_km, id]
  );

  if (rows.length === 0) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  return ok(rows[0]);
});

