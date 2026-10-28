export default function StatusBadge({ value }) {
  if (!value) return null;

  let badgeClass = 'badge-neutral';

  switch (value) {
    case 'Available':
    case 'Completed':
    case 'Closed':
      badgeClass = 'badge-success';
      break;
    case 'Rented':
    case 'Active':
      badgeClass = 'badge-primary';
      break;
    case 'In Shop':
    case 'Reserved':
    case 'Open':
      badgeClass = 'badge-warning';
      break;
    case 'Retired':
    case 'Cancelled':
      badgeClass = 'badge-neutral';
      break;
    default:
      badgeClass = 'badge-neutral';
  }

  return <span className={`badge ${badgeClass}`}>{value}</span>;
}

