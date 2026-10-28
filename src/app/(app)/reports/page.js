'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import Alert from '@/components/Alert';
import { formatDate, formatMoney } from '@/lib/format';

export default function ReportsPage() {
  const [profitRows, setProfitRows] = useState([]);
  const [monthlyRows, setMonthlyRows] = useState([]);
  const [overdueRows, setOverdueRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const [profRes, monRes, overRes] = await Promise.all([
          fetch('/api/reports/vehicle-profit'),
          fetch('/api/reports/monthly-revenue'),
          fetch('/api/reports/overdue-returns'),
        ]);

        const profData = await profRes.json();
        const monData = await monRes.json();
        const overData = await overRes.json();

        if (profData.ok) setProfitRows(profData.data);
        if (monData.ok) setMonthlyRows(monData.data);
        if (overData.ok) setOverdueRows(overData.data);
      } catch {
        setError('Network error while fetching report views');
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const profitCols = [
    { key: 'plate_no', label: 'Plate Number' },
    {
      key: 'revenue',
      label: 'Gross Revenue',
      numeric: true,
      render: (r) => formatMoney(r.revenue),
    },
    {
      key: 'maintenance_cost',
      label: 'Maintenance Cost',
      numeric: true,
      render: (r) => formatMoney(r.maintenance_cost),
    },
    {
      key: 'fuel_cost',
      label: 'Fuel Cost',
      numeric: true,
      render: (r) => formatMoney(r.fuel_cost),
    },
    {
      key: 'profit',
      label: 'Net Profit',
      numeric: true,
      render: (r) => {
        const p = parseFloat(r.profit) || 0;
        return (
          <span className={`badge ${p >= 0 ? 'badge-success' : 'badge-danger'}`}>
            {formatMoney(p)}
          </span>
        );
      },
    },
  ];

  const monthlyCols = [
    { key: 'month', label: 'Billing Month (YYYY-MM)' },
    {
      key: 'revenue',
      label: 'Total Realized Revenue',
      numeric: true,
      render: (r) => formatMoney(r.revenue),
    },
  ];

  const overdueCols = [
    { key: 'booking_id', label: 'Booking #' },
    { key: 'plate_no', label: 'Vehicle' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'end_date',
      label: 'Due Date',
      render: (r) => formatDate(r.end_date),
    },
    { key: 'days_overdue', label: 'Days Overdue', numeric: true },
  ];

  return (
    <>
      <PageHeader title="Financial & Operational Reports" />
      <Alert type="error" message={error} />

      <div className="card">
        <h2>Profit per Vehicle (v_vehicle_profit)</h2>
        <DataTable
          columns={profitCols}
          rows={profitRows}
          emptyText={loading ? 'Calculating fleet profits...' : 'No vehicle profit records found.'}
        />
      </div>

      <div className="card">
        <h2>Monthly Revenue Breakdown (v_monthly_revenue)</h2>
        <DataTable
          columns={monthlyCols}
          rows={monthlyRows}
          emptyText={loading ? 'Aggregating monthly collections...' : 'No monthly revenue records found.'}
        />
      </div>

      <div className="card">
        <h2>Overdue Returns (v_overdue_returns)</h2>
        <DataTable
          columns={overdueCols}
          rows={overdueRows}
          emptyText={loading ? 'Checking overdue rentals...' : 'Zero vehicles currently overdue.'}
        />
      </div>
    </>
  );
}

