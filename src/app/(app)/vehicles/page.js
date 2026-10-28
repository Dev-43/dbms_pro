'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Alert from '@/components/Alert';
import { formatMoney } from '@/lib/format';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [tab, setTab] = useState('All');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVehicles() {
      setLoading(true);
      setError('');
      try {
        const url = tab === 'All' ? '/api/vehicles' : `/api/vehicles?status=${encodeURIComponent(tab)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.ok) {
          setVehicles(data.data);
        } else {
          setError(data?.error?.message || 'Failed to load vehicles');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    loadVehicles();
  }, [tab]);

  const tabs = ['All', 'Available', 'Rented', 'In Shop', 'Retired'];

  return (
    <>
      <PageHeader title="Vehicles" actionHref="/vehicles/new" actionLabel="Add Vehicle" />
      <Alert type="error" message={error} />

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'inherit' }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card">Loading fleet inventory...</div>
      ) : vehicles.length === 0 ? (
        <div className="card">No vehicles found in this category.</div>
      ) : (
        <div className="vehicle-grid">
          {vehicles.map((v) => (
            <div key={v.vehicle_id} className="vehicle-card">
              <div className="vehicle-img">
                <StatusBadge value={v.status} />
                <span>{v.category_name}</span>
              </div>
              <div className="vehicle-body">
                <div className="vehicle-title">
                  {v.make} {v.model}
                </div>
                <div className="vehicle-sub">{v.plate_no}</div>
                <div className="spec-row">
                  <span>{(v.odometer_km || 0).toLocaleString('en-IN')} km</span>
                  <span>{v.category_name}</span>
                  <span>{v.year}</span>
                </div>
                <div className="vehicle-foot">
                  <div className="price">
                    {formatMoney(v.daily_rate)} <small>/ day</small>
                  </div>
                  <Link href={`/vehicles/${v.vehicle_id}`}>View Details ↗</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

