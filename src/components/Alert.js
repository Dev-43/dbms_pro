export default function Alert({ type = 'error', message }) {
  if (!message) return null;

  const className = type === 'success' ? 'alert alert-success' : 'alert alert-error';

  return <div className={className}>{message}</div>;
}

