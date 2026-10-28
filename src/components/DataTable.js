export default function DataTable({ columns = [], rows = [], emptyText = 'No records found.' }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.numeric ? 'num' : ''}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row.id || row.booking_id || row.vehicle_id || row.customer_id || row.user_id || idx}>
                {columns.map((col) => {
                  const val = col.render ? col.render(row) : row[col.key];
                  return (
                    <td key={col.key} className={col.numeric ? 'num' : ''}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

