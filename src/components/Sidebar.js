'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/login');
    router.refresh();
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Vehicles', href: '/vehicles' },
    { label: 'Customers', href: '/customers' },
    { label: 'Bookings', href: '/bookings' },
    { label: 'Payments', href: '/payments' },
    { label: 'Maintenance', href: '/maintenance' },
    { label: 'Fuel Logs', href: '/fuel' },
    { label: 'Reports', href: '/reports' },
  ];

  if (role === 'admin') {
    navItems.push(
      { label: 'Categories', href: '/categories' },
      { label: 'Users', href: '/users' }
    );
  }

  return (
    <aside className="sidebar">
      <div className="brand">FLEET MANAGER</div>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? 'active' : ''}
          >
            {item.label}
          </Link>
        );
      })}
      <div className="spacer" />
      <button
        onClick={handleLogout}
        className="btn"
        style={{ width: '100%', textAlign: 'center' }}
      >
        Logout
      </button>
    </aside>
  );
}

