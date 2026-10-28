'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';
import { formatDate, formatMoney } from '@/lib/format';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings(statusFilter);
  }, [statusFilter]);

  async function loadBookings(filter = '') {
    setLoading(true);
    try {
      const url = filter ? `/api/bookings?status=${encodeURIComponent(filter)}` : '/api/bookings';
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setBookings(data.data);
      } else {
        setError(data?.error?.message || 'Failed to load bookings');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: 'booking_id', label: 'Booking #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'plate_no', label: 'Vehicle' },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (r) => formatDate(r.start_date),
    },
    {
      key: 'end_date',
      label: 'End Date',
      render: (r) => formatDate(r.end_date),
    },
    {
      key: 'total_amount',
      label: 'Amount',
      numeric: true,
      render: (r) => formatMoney(r.total_amount),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge value={r.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => <Link href={`/bookings/${r.booking_id}`}>View</Link>,
    },
  ];

  return (
    <>
      <PageHeader title="Bookings & Reservations" actionHref="/bookings/new" actionLabel="Create Booking" />
      <Alert type="error" message={error} />

      <div className="card">
        <div className="filters" style={{ maxWidth: '300px' }}>
          <FormField
            label="Filter by Status"
            name="status"
            type="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Reserved', label: 'Reserved' },
              { value: 'Active', label: 'Active' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          rows={bookings}
          emptyText={loading ? 'Loading bookings...' : 'No bookings found.'}
        />
      </div>
    </>
  );
}

