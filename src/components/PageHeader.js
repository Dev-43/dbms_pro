import Link from 'next/link';

export default function PageHeader({ title, actionHref, actionLabel }) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

