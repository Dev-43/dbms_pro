'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import Alert from '@/components/Alert';
import { formatDate } from '@/lib/format';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    vehicles_total: 0,
    available: 0,
    rented: 0,
    in_shop: 0,
    active_bookings: 0,
    overdue_returns: 0,
  });
  const [overdueRows, setOverdueRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, overdueRes] = await Promise.all([
          fetch('/api/reports/dashboard'),
          fetch('/api/reports/overdue-returns'),
        ]);

        const dashData = await dashRes.json();
        const overdueData = await overdueRes.json();

        if (dashData.ok) {
          setStats(dashData.data);
        } else {
          setError(dashData?.error?.message || 'Failed to load dashboard metrics');
        }

        if (overdueData.ok) {
          setOverdueRows(overdueData.data);
        }
      } catch {
        setError('Network error while loading dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const overdueColumns = [
    { key: 'booking_id', label: 'Booking #' },
    { key: 'plate_no', label: 'Vehicle' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'end_date',
      label: 'Due Date',
      render: (row) => formatDate(row.end_date),
    },
    { key: 'days_overdue', label: 'Days Overdue', numeric: true },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <Alert type="error" message={error} />

      <div className="stat-grid">
        <div className="card stat">
          <div className="label">Total Vehicles</div>
          <div className="value">{loading ? '...' : stats.vehicles_total}</div>
        </div>
        <div className="card stat">
          <div className="label">Available</div>
          <div className="value">{loading ? '...' : stats.available}</div>
        </div>
        <div className="card stat">
          <div className="label">Rented</div>
          <div className="value">{loading ? '...' : stats.rented}</div>
        </div>
        <div className="card stat">
          <div className="label">In Shop</div>
          <div className="value">{loading ? '...' : stats.in_shop}</div>
        </div>
        <div className="card stat">
          <div className="label">Active Bookings</div>
          <div className="value">{loading ? '...' : stats.active_bookings}</div>
        </div>
        <div className="card stat">
          <div className="label">Overdue Returns</div>
          <div className="value">{loading ? '...' : stats.overdue_returns}</div>
        </div>
      </div>

      <div className="card">
        <h2>Overdue Returns</h2>
        <DataTable
          columns={overdueColumns}
          rows={overdueRows}
          emptyText="No overdue returns at this time."
        />
      </div>
    </>
  );
}

