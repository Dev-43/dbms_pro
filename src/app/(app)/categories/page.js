'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';
import { formatMoney } from '@/lib/format';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [dailyRate, setDailyRate] = useState('');
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
          loadCategories();
        }
      })
      .catch(() => router.replace('/dashboard'));
  }, [router]);

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.ok) {
        setCategories(data.data);
      }
    } catch {
      setError('Failed to load categories');
    }
  }

  function handleEdit(cat) {
    setEditId(cat.category_id);
    setName(cat.name);
    setDailyRate(String(cat.daily_rate));
    setError('');
    setSuccess('');
  }

  function handleCancel() {
    setEditId(null);
    setName('');
    setDailyRate('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const payload = {
      name: name.trim(),
      daily_rate: parseFloat(dailyRate),
    };

    try {
      let res;
      if (editId) {
        res = await fetch(`/api/categories/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to save category');
      } else {
        setSuccess(editId ? 'Category updated successfully' : 'Category created successfully');
        handleCancel();
        loadCategories();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'category_id', label: 'ID' },
    { key: 'name', label: 'Category Name' },
    {
      key: 'daily_rate',
      label: 'Daily Rate',
      numeric: true,
      render: (row) => formatMoney(row.daily_rate),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          type="button"
          className="btn"
          onClick={() => handleEdit(row)}
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Vehicle Categories" />
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card">
        <h2>{editId ? 'Edit Category' : 'Add New Category'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField
              label="Category Name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <FormField
              label="Daily Rate (₹)"
              name="daily_rate"
              type="number"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              required
            />
          </div>
          <div className="form-actions" style={{ marginTop: 'var(--s4)' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Save'}
            </button>
            {editId && (
              <button className="btn" type="button" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Existing Categories</h2>
        <DataTable columns={columns} rows={categories} />
      </div>
    </>
  );
}

