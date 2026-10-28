'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import FormField from '@/components/FormField';
import Alert from '@/components/Alert';

export default function EditCustomerPage({ params }) {
  const router = useRouter();
  const customerId = params.id;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomer() {
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        const data = await res.json();
        if (data.ok) {
          const c = data.data;
          setFullName(c.full_name);
          setEmail(c.email);
          setPhone(c.phone);
          setLicenseNo(c.license_no);
          if (c.license_expiry) {
            setLicenseExpiry(c.license_expiry.split('T')[0]);
          }
        } else {
          setError(data?.error?.message || 'Customer not found');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [customerId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const payload = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      license_no: licenseNo.trim().toUpperCase(),
      license_expiry: licenseExpiry,
    };

    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Failed to update customer');
      } else {
        setSuccess('Customer record updated successfully');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card">Loading customer details...</div>;
  }

  return (
    <>
      <PageHeader title={`Edit Customer: ${fullName}`} />
      <div className="card">
        <Alert type="error" message={error} />
        <Alert type="success" message={success} />
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField
              label="Full Name"
              name="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FormField
              label="Phone Number"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <FormField
              label="Driving Licence Number"
              name="license_no"
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
              {saving ? 'Updating...' : 'Update Customer'}
            </button>
            <Link className="btn" href="/customers" style={{ marginLeft: 'var(--s3)' }}>
              Back to Customers
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

