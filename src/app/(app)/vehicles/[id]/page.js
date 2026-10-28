'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormField from '@/components/FormField';
import StatusBadge from '@/components/StatusBadge';
import Alert from '@/components/Alert';
import { formatDate, formatMoney } from '@/lib/format';

export default function VehicleDetailPage({ params }) {
  const router = useRouter();
  const vehicleId = params.id;

  const [role, setRole] = useState('staff');
  const [vehicle, setVehicle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [odometerKm, setOdometerKm] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [retiring, setRetiring] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setRole(d.data.role);
      })
      .catch(() => {});

    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setCategories(d.data);
      })
      .catch(() => {});

    loadVehicleData();
  }, [vehicleId]);

  async function loadVehicleData() {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      const data = await res.json();
      if (data.ok) {
        const v = data.data.vehicle;
        setVehicle(v);
        setMake(v.make);
        setModel(v.model);
        setYear(String(v.year));
        setCategoryId(String(v.category_id));
        setOdometerKm(String(v.odometer_km));
        setBookings(data.data.bookings || []);
        setMaintenance(data.data.maintenance || []);
      } else {
        setError(data?.error?.message || 'Failed to load vehicle');
      }
    } catch {
      setError('Network error');
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const payload = {
      make: make.trim(),
      model: model.trim(),
      year: parseInt(year, 10),
      category_id: parseInt(categoryId, 10),
      odometer_km: parseInt(odometerKm, 10) || 0,
    };

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to update vehicle');
      } else {
        setSuccess('Vehicle details updated successfully');
        loadVehicleData();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleRetire() {
    if (!confirm('Are you sure you want to retire this vehicle? This action is permanent.')) {
      return;
    }
    setError('');
    setSuccess('');
    setRetiring(true);

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/retire`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to retire vehicle');
      } else {
        setSuccess('Vehicle has been retired successfully');
        loadVehicleData();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setRetiring(false);
    }
  }

  const categoryOptions = categories.map((c) => ({
    value: String(c.category_id),
    label: `${c.name} (₹${c.daily_rate}/day)`,
  }));

  const bookingCols = [
    { key: 'booking_id', label: 'Booking #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'start_date', label: 'Start Date', render: (r) => formatDate(r.start_date) },
    { key: 'end_date', label: 'End Date', render: (r) => formatDate(r.end_date) },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge value={r.status} />,
    },
    {
      key: 'total_amount',
      label: 'Total Amount',
      numeric: true,
      render: (r) => formatMoney(r.total_amount),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => <Link href={`/bookings/${r.booking_id}`}>View</Link>,
    },
  ];

  const maintenanceCols = [
    { key: 'maintenance_id', label: 'ID' },
    { key: 'description', label: 'Description' },
    {
      key: 'cost',
      label: 'Cost',
      numeric: true,
      render: (r) => formatMoney(r.cost),
    },
    { key: 'opened_on', label: 'Opened', render: (r) => formatDate(r.opened_on) },
    { key: 'closed_on', label: 'Closed', render: (r) => formatDate(r.closed_on) || 'In Progress' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge value={r.closed_on ? 'Closed' : 'Open'} />,
    },
  ];

  if (!vehicle) {
    return (
      <div className="card">
        <Alert type="error" message={error} />
        {!error && 'Loading vehicle details...'}
      </div>
    );
  }

  return (
    <>
      <PageHeader title={`${vehicle.make} ${vehicle.model} (${vehicle.plate_no})`} />
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Vehicle Specifications & Status</h2>
          <div>
            <StatusBadge value={vehicle.status} />
          </div>
        </div>

        <form onSubmit={handleUpdate}>
          <div className="form-grid">
            <div className="field">
              <label>Plate Number</label>
              <input value={vehicle.plate_no} disabled />
            </div>
            <div className="field">
              <label>Current Status</label>
              <input value={vehicle.status} disabled />
            </div>
            <FormField
              label="Make"
              name="make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              required
            />
            <FormField
              label="Model"
              name="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
            />
            <FormField
              label="Year"
              name="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
            <FormField
              label="Category"
              name="category_id"
              type="select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categoryOptions}
              required
            />
            <FormField
              label="Odometer (km)"
              name="odometer_km"
              type="number"
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value)}
              required
            />
            <div className="field">
              <label>Daily Rental Rate</label>
              <input value={formatMoney(vehicle.daily_rate)} disabled />
            </div>
          </div>

          <div
            className="form-actions"
            style={{
              marginTop: 'var(--s5)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <button className="btn btn-primary" type="submit" disabled={saving || vehicle.status === 'Retired'}>
                {saving ? 'Updating...' : 'Update Details'}
              </button>
              <Link className="btn" href="/vehicles" style={{ marginLeft: 'var(--s3)' }}>
                Back to Fleet
              </Link>
            </div>

            {role === 'admin' && vehicle.status !== 'Retired' && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleRetire}
                disabled={retiring}
              >
                {retiring ? 'Retiring...' : 'Retire Vehicle'}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Booking History</h2>
        <DataTable columns={bookingCols} rows={bookings} emptyText="No bookings on record for this vehicle." />
      </div>

      <div className="card">
        <h2>Maintenance & Workshop Records</h2>
        <DataTable
          columns={maintenanceCols}
          rows={maintenance}
          emptyText="No workshop maintenance on record for this vehicle."
        />
      </div>
    </>
  );
}

