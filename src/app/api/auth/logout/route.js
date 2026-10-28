import { handle, ok } from '@/lib/api';

export const POST = handle(async () => {
  const response = ok({}, 200);
  response.cookies.set('session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
});

