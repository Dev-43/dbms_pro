export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  options = [],
  hint,
  required = false,
  disabled = false,
}) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={name}>
          {label}
          {required && ' *'}
        </label>
      )}

      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          required={required}
          disabled={disabled}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          required={required}
          disabled={disabled}
          rows={3}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          required={required}
          disabled={disabled}
        />
      )}

      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

