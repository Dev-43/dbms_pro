'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';
import { formatMoney } from '@/lib/format';

export default function NewBookingPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetch('/api/customers'), fetch('/api/vehicles')])
      .then(async ([custRes, vehRes]) => {
        const custData = await custRes.json();
        const vehData = await vehRes.json();

        if (custData.ok && custData.data.length > 0) {
          setCustomers(custData.data);
          setCustomerId(String(custData.data[0].customer_id));
        }

        if (vehData.ok) {
          const activeVehicles = vehData.data.filter((v) => v.status !== 'Retired');
          setVehicles(activeVehicles);
          if (activeVehicles.length > 0) {
            setVehicleId(String(activeVehicles[0].vehicle_id));
          }
        }
      })
      .catch(() => setError('Failed to load customers or fleet records'));
  }, []);

  // Compute estimated amount
  let estimatedAmount = 0;
  let days = 0;
  if (startDate && endDate && vehicleId) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = e.getTime() - s.getTime();
    days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (days > 0) {
      const selectedVeh = vehicles.find((v) => String(v.vehicle_id) === String(vehicleId));
      if (selectedVeh) {
        estimatedAmount = days * parseFloat(selectedVeh.daily_rate);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      customer_id: parseInt(customerId, 10),
      vehicle_id: parseInt(vehicleId, 10),
      start_date: startDate,
      end_date: endDate,
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to create booking');
        setSaving(false);
      } else {
        router.push(`/bookings/${data.data.booking_id}`);
        router.refresh();
      }
    } catch {
      setError('Something went wrong');
      setSaving(false);
    }
  }

  const customerOptions = customers.map((c) => ({
    value: String(c.customer_id),
    label: `${c.full_name} (${c.phone} — Exp: ${c.license_expiry ? c.license_expiry.split('T')[0] : ''})`,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    value: String(v.vehicle_id),
    label: `${v.plate_no} — ${v.make} ${v.model} (${v.status}, ₹${v.daily_rate}/day)`,
  }));

  return (
    <>
      <PageHeader title="Create New Booking" />
      <div className="card">
        <Alert type="error" message={error} />
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField
              label="Customer"
              name="customer_id"
              type="select"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              options={customerOptions}
              required
            />
            <FormField
              label="Vehicle"
              name="vehicle_id"
              type="select"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              options={vehicleOptions}
              required
            />
            <FormField
              label="Rental Start Date"
              name="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <FormField
              label="Return End Date"
              name="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div
            style={{
              marginTop: 'var(--s4)',
              padding: 'var(--s3) var(--s4)',
              background: 'var(--neutral-soft)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <strong>Estimated Rental Cost: </strong>
            {days > 0 ? (
              <span>
                {days} day(s) × rate = <strong>{formatMoney(estimatedAmount)}</strong> (Calculated by PostgreSQL
                on reservation)
              </span>
            ) : (
              <span className="muted">Select valid start and end dates to preview estimate</span>
            )}
          </div>

          <div className="form-actions" style={{ marginTop: 'var(--s5)' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Reserving...' : 'Confirm Reservation'}
            </button>
            <Link className="btn" href="/bookings">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

