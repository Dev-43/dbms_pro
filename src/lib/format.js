export function formatDate(d) {
  if (!d) return '';
  if (typeof d === 'string' && d.includes('T')) {
    d = d.split('T')[0];
  }
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [year, month, day] = d.split('-');
    return `${day}-${month}-${year}`;
  }
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatMoney(n) {
  const num = typeof n === 'number' ? n : parseFloat(n);
  if (isNaN(num)) return '₹0.00';
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return `₹${formatted}`;
}

