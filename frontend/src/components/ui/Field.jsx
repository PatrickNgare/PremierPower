import { useId, useState } from 'react'

/**
 * Text input with a floating label. The label sits inside the control until
 * the field is focused or filled, so the form reads as a quiet stack rather
 * than a wall of labels — while remaining a real <label for> pairing.
 */
export function Field({
  label, name, type = 'text', required = false, autoComplete,
  as = 'input', rows = 4, options, className = '', error, ...rest
}) {
  const id = useId()
  const errId = `${id}-error`
  const [filled, setFilled] = useState(false)

  const shared = {
    id, name, required, autoComplete,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errId : undefined,
    ...rest,
    onChange: (e) => { setFilled(Boolean(e.target.value)); rest.onChange?.(e) },
    className:
      'peer w-full rounded-xl border bg-surface px-4 pb-2.5 pt-6 text-[0.95rem] ' +
      'text-body outline-none transition-all duration-300 focus:ring-4 ' +
      (error
        ? 'border-brand-fill focus:border-brand-fill focus:ring-brand-fill/15'
        : 'border-line hover:border-line focus:border-brand-fill focus:ring-brand-fill/10'),
  }

  return (
    <div className={`relative ${className}`}>
      {as === 'select' ? (
        <select {...shared} defaultValue="">
          <option value="" disabled />
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : as === 'textarea' ? (
        <textarea {...shared} rows={rows} />
      ) : (
        <input {...shared} type={type} />
      )}

      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 origin-left text-muted transition-all duration-200 ${
          filled ? 'top-2 text-[0.68rem] font-semibold uppercase tracking-wider' : 'top-4 text-[0.95rem]'
        } peer-focus:top-2 peer-focus:text-[0.68rem] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent`}
      >
        {label}{required && <span aria-hidden="true" className="text-accent"> *</span>}
      </label>
      {error && (
        <p id={errId} className="mt-1.5 px-1 text-sm font-medium text-accent">{error}</p>
      )}
    </div>
  )
}
