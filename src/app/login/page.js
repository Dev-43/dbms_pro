'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="brand">FLEET MANAGER</div>
        <h2>Staff Login</h2>
        <div className="sub">Sign in to manage vehicles and bookings.</div>
        <Alert type="error" message={error} />
        <form onSubmit={handleSubmit}>
          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--s3)' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

