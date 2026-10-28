'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';

export default function NewCustomerPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      license_no: licenseNo.trim().toUpperCase(),
      license_expiry: licenseExpiry,
    };

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to create customer');
        setSaving(false);
      } else {
        router.push('/customers');
        router.refresh();
      }
    } catch {
      setError('Something went wrong');
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Add New Customer" />
      <div className="card">
        <Alert type="error" message={error} />
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField
              label="Full Name"
              name="full_name"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FormField
              label="Phone Number"
              name="phone"
              placeholder="e.g. 9812345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <FormField
              label="Driving Licence Number"
              name="license_no"
              placeholder="e.g. MH1220200001"
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              required
            />
            <FormField
              label="Licence Expiry Date"
              name="license_expiry"
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
              required
            />
          </div>
          <div className="form-actions" style={{ marginTop: 'var(--s5)' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Customer'}
            </button>
            <Link className="btn" href="/customers">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

