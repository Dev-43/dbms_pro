'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok || data.data.role !== 'admin') {
          router.replace('/dashboard');
        } else {
          loadUsers();
        }
      })
      .catch(() => router.replace('/dashboard'));
  }, [router]);

  async function loadUsers() {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.ok) {
        setUsers(data.data);
      }
    } catch {
      setError('Failed to load users');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const payload = {
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      role,
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to create user');
      } else {
        setSuccess('User created successfully');
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('staff');
        loadUsers();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'user_id', label: 'ID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className={`badge ${row.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
          {row.role}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Staff & User Management" />
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card">
        <h2>Add New User</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField
              label="Full Name"
              name="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
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
            <FormField
              label="Role"
              name="role"
              type="select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'staff', label: 'Staff' },
                { value: 'admin', label: 'Admin' },
              ]}
              required
            />
          </div>
          <div className="form-actions" style={{ marginTop: 'var(--s4)' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>User Accounts</h2>
        <DataTable columns={columns} rows={users} />
      </div>
    </>
  );
}

