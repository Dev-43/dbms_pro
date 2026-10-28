import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request, { params }) => {
  await requireRole(request, ['admin', 'staff']);

  const id = parseInt(params.id, 10);
  const { rows } = await query(
    'SELECT customer_id, full_name, email, phone, license_no, license_expiry FROM customers WHERE customer_id = $1',
    [id]
  );

  if (rows.length === 0) {
    const err = new Error('Customer not found');
    err.status = 404;
    throw err;
  }

  return ok(rows[0]);
});

export const PUT = handle(async (request, { params }) => {
  await requireRole(request, ['admin', 'staff']);

  const id = parseInt(params.id, 10);
  const body = await request.json();
  const { full_name, email, phone, license_no, license_expiry } = body || {};

  const { rows } = await query(
    `UPDATE customers
     SET full_name = $1, email = $2, phone = $3, license_no = $4, license_expiry = $5
     WHERE customer_id = $6
     RETURNING customer_id, full_name, email, phone, license_no, license_expiry`,
    [full_name, email, phone, license_no, license_expiry, id]
  );

  if (rows.length === 0) {
    const err = new Error('Customer not found');
    err.status = 404;
    throw err;
  }

  return ok(rows[0]);
});

