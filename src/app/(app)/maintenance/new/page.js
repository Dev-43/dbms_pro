'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';

export default function NewMaintenancePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('0');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/vehicles')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          // Available or In Shop only (cannot open on Rented or Retired - R11)
          const eligible = data.data.filter((v) => v.status === 'Available' || v.status === 'In Shop');
          setVehicles(eligible);
          if (eligible.length > 0) {
            setVehicleId(String(eligible[0].vehicle_id));
          }
        }
      })
      .catch(() => setError('Failed to load fleet vehicles'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      vehicle_id: parseInt(vehicleId, 10),
      description: description.trim(),
      cost: parseFloat(cost) || 0,
    };

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to open maintenance ticket');
        setSaving(false);
      } else {
        router.push('/maintenance');
        router.refresh();
      }
    } catch {
      setError('Something went wrong');
      setSaving(false);
    }
  }

  const vehicleOptions = vehicles.map((v) => ({
    value: String(v.vehicle_id),
    label: `${v.plate_no} — ${v.make} ${v.model} (${v.status})`,
  }));

  return (
    <>
      <PageHeader title="Open Maintenance Ticket" />
      <div className="card">
        <Alert type="error" message={error} />
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField
              label="Vehicle"
              name="vehicle_id"
              type="select"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              options={vehicleOptions}
              hint="Only Available or In Shop vehicles can be sent to maintenance."
              required
            />
            <FormField
              label="Estimated Repair / Service Cost (₹)"
              name="cost"
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: 'var(--s3)' }}>
            <FormField
              label="Service / Repair Description"
              name="description"
              type="textarea"
              placeholder="e.g. Brake pad replacement and periodic oil service..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-actions" style={{ marginTop: 'var(--s5)' }}>
            <button className="btn btn-primary" type="submit" disabled={saving || vehicles.length === 0}>
              {saving ? 'Opening...' : 'Open Work Order'}
            </button>
            <Link className="btn" href="/maintenance">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

