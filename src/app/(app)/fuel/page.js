'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';
import { formatDate, formatMoney } from '@/lib/format';

export default function FuelPage() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setVehicles(d.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadFuelLogs(selectedVehicle);
  }, [selectedVehicle]);

  async function loadFuelLogs(vehId = '') {
    setLoading(true);
    try {
      const url = vehId ? `/api/fuel?vehicle_id=${encodeURIComponent(vehId)}` : '/api/fuel';
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setLogs(data.data);
      } else {
        setError(data?.error?.message || 'Failed to load fuel logs');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: 'fuel_id', label: 'Log #' },
    { key: 'plate_no', label: 'Vehicle' },
    {
      key: 'litres',
      label: 'Volume (Litres)',
      numeric: true,
      render: (r) => `${parseFloat(r.litres).toFixed(2)} L`,
    },
    {
      key: 'cost',
      label: 'Total Cost',
      numeric: true,
      render: (r) => formatMoney(r.cost),
    },
    {
      key: 'logged_on',
      label: 'Logged On',
      render: (r) => formatDate(r.logged_on),
    },
  ];

  const vehicleFilterOptions = [
    { value: '', label: 'All Fleet Vehicles' },
    ...vehicles.map((v) => ({
      value: String(v.vehicle_id),
      label: `${v.plate_no} (${v.make} ${v.model})`,
    })),
  ];

  return (
    <>
      <PageHeader title="Fuel Logs" actionHref="/fuel/new" actionLabel="Log Refill" />
      <Alert type="error" message={error} />

      <div className="card">
        <div className="filters" style={{ maxWidth: '300px' }}>
          <FormField
            label="Filter by Vehicle"
            name="vehicle_filter"
            type="select"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            options={vehicleFilterOptions}
          />
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          rows={logs}
          emptyText={loading ? 'Loading fuel logs...' : 'No fuel logs recorded.'}
        />
      </div>
    </>
  );
}

