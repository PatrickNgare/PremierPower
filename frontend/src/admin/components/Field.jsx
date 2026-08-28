import { useEffect, useState } from 'react'
import { Image as ImageIcon, Link2, X } from 'lucide-react'
import { api } from '../api'
import { FIELD } from '../schema'
import { MediaPicker } from './MediaPicker'
import { Button } from './ui'

/** "Nashulai Mara Safari Lodge" -> "nashulai-mara-safari-lodge" */
export const slugify = (s) =>
  String(s).toLowerCase().normalize('NFKD')
    .replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-')

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 ' +
  'outline-none transition-all duration-200 placeholder:text-ink-400 ' +
  'focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10 ' +
  'disabled:bg-neutral-50 disabled:text-ink-400'

function Label({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink-800">
      {children}
      {required && <span aria-hidden="true" className="ml-1 text-brand-deep">*</span>}
    </label>
  )
}

/** A switch that reads as on/off at a glance, not a bare checkbox. */
function Switch({ id, checked, onChange, disabled }) {
  return (
    <button
      type="button" id={id} role="switch" aria-checked={!!checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${
        checked ? 'bg-earth-ink' : 'bg-neutral-300'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

/** Options loaded from another collection — a product's category, say. */
function useRemoteOptions(spec) {
  const [options, setOptions] = useState([])
  useEffect(() => {
    if (!spec) return
    let alive = true
    api.get(spec.path)
      .then((res) => {
        // Admin list endpoints are paged; public ones are bare arrays.
        const rows = Array.isArray(res) ? res : (res?.items ?? [])
        if (alive) setOptions(rows.map((r) => ({ value: r[spec.value], label: r[spec.label] })))
      })
      .catch(() => { /* leave the select empty rather than breaking the form */ })
    return () => { alive = false }
  }, [spec])
  return options
}

export function Field({ field, value, values, onChange, disabled }) {
  const [picking, setPicking] = useState(false)
  const remote = useRemoteOptions(field.optionsFrom)
  const id = `f-${field.name}`

  // A section marker, not an input.
  if (field.section) {
    return (
      <div className="pt-3">
        <h3 className="border-b border-neutral-200 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-ink-400">
          {field.section}
        </h3>
      </div>
    )
  }

  const common = { id, disabled, className: inputClass, placeholder: field.placeholder }

  let control
  switch (field.type) {
    case FIELD.textarea:
      control = (
        <textarea {...common} rows={field.rows ?? 4} value={value ?? ''}
          onChange={(e) => onChange(e.target.value)} />
      )
      break

    case FIELD.lines:
      // The API hands these back as an array and takes them as text.
      control = (
        <textarea
          {...common} rows={field.rows ?? 4}
          value={Array.isArray(value) ? value.join('\n') : (value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break

    case FIELD.number:
      control = (
        <input {...common} type="number" min={field.min} max={field.max}
          value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
      )
      break

    case FIELD.switch:
      return (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5">
          <div className="min-w-0">
            <Label htmlFor={id}>{field.label}</Label>
            {field.help && <p className="mt-1 text-xs leading-relaxed text-ink-400">{field.help}</p>}
          </div>
          <Switch id={id} checked={!!value} onChange={onChange} disabled={disabled} />
        </div>
      )

    case FIELD.select: {
      const options = field.options
        ? field.options.map((o) => ({ value: o, label: o }))
        : remote
      control = (
        <select
          {...common}
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            // A numeric foreign key must go back as a number, and "" as null.
            if (raw === '') return onChange(null)
            onChange(field.optionsFrom ? Number(raw) : raw)
          }}
        >
          <option value="">{field.required ? 'Choose…' : 'None'}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
      break
    }

    case FIELD.image:
      return (
        <div>
          <Label htmlFor={id} required={field.required}>{field.label}</Label>
          {field.help && <p className="mt-1 text-xs leading-relaxed text-ink-400">{field.help}</p>}
          <div className="mt-2 flex items-start gap-3">
            <div className="grid h-24 w-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
              {value
                ? <img src={value} alt="" className="h-full w-full object-cover" />
                : <ImageIcon size={20} className="text-ink-400" aria-hidden="true" />}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex gap-2">
                <Button type="button" onClick={() => setPicking(true)} disabled={disabled}>
                  {value ? 'Change' : 'Choose photograph'}
                </Button>
                {value && (
                  <Button type="button" variant="ghost" onClick={() => onChange('')} disabled={disabled}>
                    <X size={14} aria-hidden="true" /> Remove
                  </Button>
                )}
              </div>
              {/* The address stays editable: some images are already hosted
                  elsewhere and never pass through the library. */}
              <div className="relative">
                <Link2 size={14} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  {...common} id={id} value={value ?? ''}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="/uploads/… or https://…"
                  className={`${inputClass} pl-9 text-xs`}
                />
              </div>
            </div>
          </div>
          <MediaPicker open={picking} onClose={() => setPicking(false)} onPick={onChange} />
        </div>
      )

    case FIELD.slug:
      control = (
        <div className="flex gap-2">
          <input {...common} value={value ?? ''} onChange={(e) => onChange(slugify(e.target.value))} />
          {field.from && (
            <Button
              type="button" variant="ghost" disabled={disabled || !values?.[field.from]}
              onClick={() => onChange(slugify(values[field.from]))}
            >
              From title
            </Button>
          )}
        </div>
      )
      break

    default:
      control = (
        <input {...common} type={field.type === FIELD.url ? 'text' : 'text'}
          value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      )
  }

  return (
    <div>
      <Label htmlFor={id} required={field.required}>{field.label}</Label>
      {field.help && <p className="mb-2 mt-1 text-xs leading-relaxed text-ink-400">{field.help}</p>}
      <div className={field.help ? '' : 'mt-2'}>{control}</div>
    </div>
  )
}
