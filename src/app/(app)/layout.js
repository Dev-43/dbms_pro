import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import Sidebar from '@/components/Sidebar';

export default async function AppLayout({ children }) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session');

  let role = 'staff';

  if (!sessionCookie || !sessionCookie.value) {
    redirect('/login');
  }

  try {
    const secret = process.env.SESSION_SECRET || 'default-secret-string-at-least-32-chars-long';
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(sessionCookie.value, key);
    role = payload.role || 'staff';
  } catch {
    redirect('/login');
  }

  return (
    <div className="app-shell">
      <Sidebar role={role} />
      <main className="main">{children}</main>
    </div>
  );
}

