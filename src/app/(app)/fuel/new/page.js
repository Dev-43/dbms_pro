'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';

export default function NewFuelLogPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [litres, setLitres] = useState('');
  const [cost, setCost] = useState('');
  const [loggedOn, setLoggedOn] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/vehicles')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data.length > 0) {
          const nonRetired = data.data.filter((v) => v.status !== 'Retired');
          setVehicles(nonRetired);
          if (nonRetired.length > 0) {
            setVehicleId(String(nonRetired[0].vehicle_id));
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
      litres: parseFloat(litres),
      cost: parseFloat(cost),
      logged_on: loggedOn,
    };

    try {
      const res = await fetch('/api/fuel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to log fuel entry');
        setSaving(false);
      } else {
        router.push('/fuel');
        router.refresh();
      }
    } catch {
      setError('Something went wrong');
      setSaving(false);
    }
  }

  const vehicleOptions = vehicles.map((v) => ({
    value: String(v.vehicle_id),
    label: `${v.plate_no} — ${v.make} ${v.model}`,
  }));

  return (
    <>
      <PageHeader title="Log Fuel Expense" />
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
              required
            />
            <FormField
              label="Fuel Volume (Litres)"
              name="litres"
              type="number"
              placeholder="e.g. 15.50"
              value={litres}
              onChange={(e) => setLitres(e.target.value)}
              required
            />
            <FormField
              label="Total Cost (₹)"
              name="cost"
              type="number"
              placeholder="e.g. 1550.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
            <FormField
              label="Date"
              name="logged_on"
              type="date"
              value={loggedOn}
              onChange={(e) => setLoggedOn(e.target.value)}
              required
            />
          </div>

          <div className="form-actions" style={{ marginTop: 'var(--s5)' }}>
            <button className="btn btn-primary" type="submit" disabled={saving || vehicles.length === 0}>
              {saving ? 'Recording...' : 'Save Fuel Log'}
            </button>
            <Link className="btn" href="/fuel">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

