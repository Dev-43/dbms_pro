import { SignJWT, jwtVerify } from 'jose';

function getSecretKey() {
  const secret = process.env.SESSION_SECRET || 'default-secret-string-at-least-32-chars-long';
  return new TextEncoder().encode(secret);
}

export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey());
}

export async function getSession(request) {
  let token = null;

  if (request?.cookies?.get) {
    token = request.cookies.get('session')?.value;
  } else if (request?.headers) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/session=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

export async function requireRole(request, roles = []) {
  const session = await getSession(request);
  if (!session) {
    const err = new Error('Not logged in');
    err.status = 401;
    throw err;
  }

  if (roles.length > 0 && !roles.includes(session.role)) {
    const err = new Error(roles.includes('admin') && !roles.includes('staff') ? 'Admin access required' : 'Forbidden');
    err.status = 403;
    throw err;
  }

  return session;
}

