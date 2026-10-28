import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  let sql = 'SELECT customer_id, full_name, email, phone, license_no, license_expiry FROM customers';
  let params = [];

  if (q && q.trim()) {
    sql += ' WHERE full_name ILIKE $1 OR phone ILIKE $1 OR license_no ILIKE $1';
    params.push(`%${q.trim()}%`);
  }

  sql += ' ORDER BY customer_id ASC';

  const { rows } = await query(sql, params);
  return ok(rows);
});

export const POST = handle(async (request) => {
  await requireRole(request, ['admin', 'staff']);

  const body = await request.json();
  const { full_name, email, phone, license_no, license_expiry } = body || {};

  const { rows } = await query(
    `INSERT INTO customers (full_name, email, phone, license_no, license_expiry)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING customer_id, full_name, email, phone, license_no, license_expiry`,
    [full_name, email, phone, license_no, license_expiry]
  );

  return ok(rows[0], 201);
});

