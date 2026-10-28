'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';
import { formatDate, formatMoney } from '@/lib/format';

export default function BookingDetailPage({ params }) {
  const bookingId = params.id;
  const [booking, setBooking] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadBookingData();
  }, [bookingId]);

  async function loadBookingData() {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      const data = await res.json();
      if (data.ok) {
        setBooking(data.data);
      } else {
        setError(data?.error?.message || 'Booking not found');
      }
    } catch {
      setError('Network error');
    }
  }

  async function handleStatusChange(newStatus) {
    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || `Failed to transition booking to ${newStatus}`);
      } else {
        setSuccess(`Booking status transitioned to ${newStatus}`);
        loadBookingData();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setUpdating(false);
    }
  }

  async function handleRecordPayment(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPaying(true);

    const payload = {
      booking_id: parseInt(bookingId, 10),
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
    };

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to record payment');
      } else {
        setSuccess('Payment recorded successfully');
        setPaymentAmount('');
        loadBookingData();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setPaying(false);
    }
  }

  const paymentCols = [
    { key: 'payment_id', label: 'Payment #' },
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

  if (!booking) {
    return (
      <div className="card">
        <Alert type="error" message={error} />
        {!error && 'Loading booking details...'}
      </div>
    );
  }

  return (
    <>
      <PageHeader title={`Booking #${booking.booking_id} — ${booking.customer_name}`} />
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Rental Details</h2>
          <StatusBadge value={booking.status} />
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Customer Name</label>
            <div>{booking.customer_name}</div>
          </div>
          <div className="field">
            <label>Vehicle Plate</label>
            <div>
              <Link href={`/vehicles/${booking.vehicle_id}`}>{booking.plate_no}</Link>
            </div>
          </div>
          <div className="field">
            <label>Start Date</label>
            <div>{formatDate(booking.start_date)}</div>
          </div>
          <div className="field">
            <label>Return Date</label>
            <div>{formatDate(booking.end_date)}</div>
          </div>
          <div className="field">
            <label>Actual Return Date</label>
            <div>{formatDate(booking.returned_on) || 'Not yet returned'}</div>
          </div>
          <div className="field">
            <label>Total Booking Amount</label>
            <div style={{ fontWeight: 'bold' }}>{formatMoney(booking.total_amount)}</div>
          </div>
          <div className="field">
            <label>Total Paid to Date</label>
            <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>{formatMoney(booking.paid)}</div>
          </div>
          <div className="field">
            <label>Outstanding Balance</label>
            <div style={{ color: booking.balance > 0 ? 'var(--danger)' : 'var(--muted)', fontWeight: 'bold' }}>
              {formatMoney(booking.balance)}
            </div>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: 'var(--s5)' }}>
          {booking.status === 'Reserved' && (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleStatusChange('Active')}
                disabled={updating}
              >
                {updating ? 'Activating...' : 'Activate Rental (Handover)'}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleStatusChange('Cancelled')}
                disabled={updating}
              >
                {updating ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </>
          )}

          {booking.status === 'Active' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleStatusChange('Completed')}
              disabled={updating}
            >
              {updating ? 'Completing...' : 'Mark Completed (Vehicle Returned)'}
            </button>
          )}

          <Link className="btn" href="/bookings">
            Back to Bookings
          </Link>
        </div>
      </div>

      {booking.status !== 'Cancelled' && (
        <div className="card">
          <h2>Record Payment</h2>
          <form onSubmit={handleRecordPayment}>
            <div className="form-grid">
              <FormField
                label="Amount (₹)"
                name="amount"
                type="number"
                placeholder={`Balance: ₹${booking.balance}`}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
              <FormField
                label="Payment Method"
                name="method"
                type="select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'UPI', label: 'UPI' },
                  { value: 'Card', label: 'Credit / Debit Card' },
                  { value: 'Cash', label: 'Cash' },
                ]}
                required
              />
            </div>
            <div className="form-actions" style={{ marginTop: 'var(--s4)' }}>
              <button className="btn btn-primary" type="submit" disabled={paying || booking.balance <= 0}>
                {paying ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Payment Ledger</h2>
        <DataTable columns={paymentCols} rows={booking.payments || []} emptyText="No payments recorded yet." />
      </div>
    </>
  );
}

