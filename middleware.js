import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Ignore login, API, next internals, and static assets
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const key = new TextEncoder().encode(secret);
    await jwtVerify(sessionCookie.value, key);
    return NextResponse.next();
  } catch (err) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

