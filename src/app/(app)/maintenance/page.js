'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Alert from '@/components/Alert';
import { formatDate, formatMoney } from '@/lib/format';

export default function MaintenancePage() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance');
      const data = await res.json();
      if (data.ok) {
        setRecords(data.data);
      } else {
        setError(data?.error?.message || 'Failed to load maintenance records');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleClose(m) {
    const finalCost = prompt('Enter final maintenance cost (₹):', String(m.cost || 0));
    if (finalCost === null) return;

    setError('');
    setSuccess('');
    setClosingId(m.maintenance_id);

    try {
      const res = await fetch(`/api/maintenance/${m.maintenance_id}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost: parseFloat(finalCost) || 0 }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to close maintenance record');
      } else {
        setSuccess('Maintenance record closed and vehicle availability restored');
        loadRecords();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setClosingId(null);
    }
  }

  const columns = [
    { key: 'maintenance_id', label: 'ID' },
    { key: 'plate_no', label: 'Vehicle' },
    { key: 'description', label: 'Description' },
    {
      key: 'cost',
      label: 'Cost',
      numeric: true,
      render: (r) => formatMoney(r.cost),
    },
    {
      key: 'opened_on',
      label: 'Opened',
      render: (r) => formatDate(r.opened_on),
    },
    {
      key: 'closed_on',
      label: 'Closed',
      render: (r) => formatDate(r.closed_on) || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge value={r.closed_on ? 'Closed' : 'Open'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        !r.closed_on ? (
          <button
            type="button"
            className="btn"
            onClick={() => handleClose(r)}
            disabled={closingId === r.maintenance_id}
          >
            {closingId === r.maintenance_id ? 'Closing...' : 'Close Ticket'}
          </button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title="Workshop & Maintenance" actionHref="/maintenance/new" actionLabel="Open Work Order" />
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />
      <div className="card">
        <DataTable
          columns={columns}
          rows={records}
          emptyText={loading ? 'Loading maintenance records...' : 'No workshop tickets on record.'}
        />
      </div>
    </>
  );
}

