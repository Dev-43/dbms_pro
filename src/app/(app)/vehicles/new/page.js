'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';

export default function NewVehiclePage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [plateNo, setPlateNo] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [categoryId, setCategoryId] = useState('');
  const [odometerKm, setOdometerKm] = useState('0');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data.length > 0) {
          setCategories(data.data);
          setCategoryId(String(data.data[0].category_id));
        }
      })
      .catch(() => setError('Failed to load vehicle categories'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      plate_no: plateNo.trim().toUpperCase(),
      make: make.trim(),
      model: model.trim(),
      year: parseInt(year, 10),
      category_id: parseInt(categoryId, 10),
      odometer_km: parseInt(odometerKm, 10) || 0,
    };

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to add vehicle');
        setSaving(false);
      } else {
        router.push('/vehicles');
        router.refresh();
      }
    } catch {
      setError('Something went wrong');
      setSaving(false);
    }
  }

  const categoryOptions = categories.map((c) => ({
    value: String(c.category_id),
    label: `${c.name} (₹${c.daily_rate}/day)`,
  }));

  return (
    <>
      <PageHeader title="Add Vehicle" />
      <div className="card">
        <Alert type="error" message={error} />
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField
              label="Registration Plate"
              name="plate_no"
              placeholder="e.g. MH12 AB 1234"
              value={plateNo}
              onChange={(e) => setPlateNo(e.target.value)}
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
              label="Make / Manufacturer"
              name="make"
              placeholder="e.g. Maruti, Honda, BMW"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              required
            />
            <FormField
              label="Model"
              name="model"
              placeholder="e.g. Swift, City, 5 Series"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
            />
            <FormField
              label="Manufacturing Year"
              name="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
            <FormField
              label="Current Odometer (km)"
              name="odometer_km"
              type="number"
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value)}
              required
            />
          </div>
          <div className="form-actions" style={{ marginTop: 'var(--s5)' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Vehicle'}
            </button>
            <Link className="btn" href="/vehicles">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

