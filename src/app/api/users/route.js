import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';

export const GET = handle(async (request) => {
  await requireRole(request, ['admin']);

  const { rows } = await query(
    'SELECT user_id, full_name, email, role FROM users ORDER BY user_id ASC'
  );

  return ok(rows);
});

export const POST = handle(async (request) => {
  await requireRole(request, ['admin']);

  const body = await request.json();
  const { full_name, email, password, role } = body || {};

  if (!password) {
    const err = new Error('Password is required');
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);

  const { rows } = await query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, full_name, email, role',
    [full_name, email, hash, role]
  );

  return ok(rows[0], 201);
});

