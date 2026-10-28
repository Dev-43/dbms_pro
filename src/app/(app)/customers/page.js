'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import Alert from '@/components/Alert';
import { formatDate } from '@/lib/format';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers(search);
  }, []);

  async function loadCustomers(queryStr = '') {
    setLoading(true);
    try {
      const url = queryStr.trim() ? `/api/customers?q=${encodeURIComponent(queryStr.trim())}` : '/api/customers';
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setCustomers(data.data);
      } else {
        setError(data?.error?.message || 'Failed to load customers');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadCustomers(search);
  }

  const columns = [
    { key: 'customer_id', label: 'ID' },
    { key: 'full_name', label: 'Customer Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'license_no', label: 'Driving Licence #' },
    {
      key: 'license_expiry',
      label: 'Licence Expiry',
      render: (row) => {
        const exp = new Date(row.license_expiry);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        exp.setHours(0, 0, 0, 0);

        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          return (
            <span className="badge badge-danger">
              Expired ({formatDate(row.license_expiry)})
            </span>
          );
        } else if (diffDays <= 30) {
          return (
            <span className="badge badge-warning">
              Expires soon ({formatDate(row.license_expiry)})
            </span>
          );
        }
        return formatDate(row.license_expiry);
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => <Link href={`/customers/${row.customer_id}`}>Edit</Link>,
    },
  ];

  return (
    <>
      <PageHeader title="Customers" actionHref="/customers/new" actionLabel="Add Customer" />
      <Alert type="error" message={error} />

      <div className="card">
        <form onSubmit={handleSearchSubmit} className="filters" style={{ display: 'flex', gap: 'var(--s3)' }}>
          <input
            type="text"
            placeholder="Search by name, phone, or licence number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setSearch('');
                loadCustomers('');
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          rows={customers}
          emptyText={loading ? 'Loading customers...' : 'No customer records found.'}
        />
      </div>
    </>
  );
}

