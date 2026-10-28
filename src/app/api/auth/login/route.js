import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signSession } from '@/lib/auth';
import { handle, ok } from '@/lib/api';

export const POST = handle(async (request) => {
  const body = await request.json();
  const { email, password } = body || {};

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: { message: 'Invalid email or password' } },
      { status: 401 }
    );
  }

  const { rows } = await query(
    'SELECT user_id, full_name, role, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, error: { message: 'Invalid email or password' } },
      { status: 401 }
    );
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { ok: false, error: { message: 'Invalid email or password' } },
      { status: 401 }
    );
  }

  const payload = {
    user_id: user.user_id,
    full_name: user.full_name,
    role: user.role,
  };

  const token = await signSession(payload);

  const response = ok(payload, 200);
  response.cookies.set('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60, // 8 hours
  });

  return response;
});

