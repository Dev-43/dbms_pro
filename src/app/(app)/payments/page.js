'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import Alert from '@/components/Alert';
import { formatDate, formatMoney } from '@/lib/format';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await fetch('/api/payments');
        const data = await res.json();
        if (data.ok) {
          setPayments(data.data);
        } else {
          setError(data?.error?.message || 'Failed to load payments');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  const columns = [
    { key: 'payment_id', label: 'Payment #' },
    {
      key: 'booking_id',
      label: 'Booking #',
      render: (r) => <Link href={`/bookings/${r.booking_id}`}>#{r.booking_id}</Link>,
    },
    { key: 'customer_name', label: 'Customer' },
    {
      key: 'amount',
      label: 'Amount Paid',
      numeric: true,
      render: (r) => formatMoney(r.amount),
    },
    { key: 'method', label: 'Payment Method' },
    {
      key: 'paid_on',
      label: 'Paid On',
      render: (r) => formatDate(r.paid_on),
    },
  ];

  return (
    <>
      <PageHeader title="Payments & Transactions" />
      <Alert type="error" message={error} />
      <div className="card">
        <DataTable
          columns={columns}
          rows={payments}
          emptyText={loading ? 'Loading payment records...' : 'No payments found.'}
        />
      </div>
    </>
  );
}

