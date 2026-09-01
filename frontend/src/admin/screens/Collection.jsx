import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion'
import {
  ChevronDown, ChevronUp, FileText, GripVertical, Plus, Search, Trash2, Upload, X,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { collections, FIELD } from '../schema'
import { Field } from '../components/Field'
import { Button, Confirm, EmptyState, Spinner, StatusPill, useToast } from '../components/ui'

/**
 * What "status" means for this content type, taken from the schema rather than
 * guessed from the row.
 *
 * Most types gate on `published`; homepage blocks gate on `enabled`. SEO
 * records have neither — their flag is `noindex`, which reads backwards, and
 * there is no publish endpoint for them at all. Guessing produced a "DRAFT"
 * pill on every SEO row when all nine were live, and a toggle that would have
 * 404ed.
 */
function statusOf(def) {
  const col = def.columns.find((c) => c.type === 'status')
  if (!col) return null
  return {
    field: col.name,
    invert: Boolean(col.invert),
    on: col.onLabel ?? (col.invert ? 'Visible' : 'Published'),
    off: col.offLabel ?? (col.invert ? 'Hidden' : 'Draft'),
    // Only the real gates have a publish endpoint behind them.
    toggleable: col.name === 'published' || col.name === 'enabled',
  }
}

/** Build a blank record from the schema, so every field is controlled. */
function blankOf(def) {
  const row = {}
  for (const f of def.fields) {
    if (f.section) continue
    row[f.name] =
      f.type === FIELD.switch ? (f.name === 'published' ? false : false)
        : f.type === FIELD.number ? (f.min ?? 0)
          : f.type === FIELD.select && f.optionsFrom ? null
            : ''
  }
  return row
}

/** Only send what the API's schema accepts, plus position. */
function payloadOf(def, row) {
  const out = {}
  for (const f of def.fields) {
    if (f.section) continue
    let v = row[f.name]
    // `lines` fields round-trip as an array out and text in.
    if (f.type === FIELD.lines && Array.isArray(v)) v = v.join('\n')
    out[f.name] = v ?? (f.type === FIELD.switch ? false : f.type === FIELD.number ? 0 : '')
  }
  if ('position' in row) out.position = row.position ?? 0
  // Optional foreign keys must stay null, never an empty string.
  for (const f of def.fields) {
    if (f.optionsFrom && out[f.name] === '') out[f.name] = null
  }
  return out
}

export default function Collection() {
  const { name } = useParams()
  const def = collections[name]
  const toast = useToast()
  const { can } = useAuth()
  const editable = can('editor')

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('')        // '', 'true', 'false'
  const [editing, setEditing] = useState(null)    // row being edited, or null
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(null)

  const load = useCallback(async () => {
    if (!def) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (q.trim()) params.set('q', q.trim())
      if (filter) params.set('published', filter)
      const page = await api.get(`${def.path}/all?${params}`)
      setRows(page.items)
      setTotal(page.total)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [def, q, filter, toast])

  // Reset everything when moving between content types.
  useEffect(() => { setQ(''); setFilter(''); setEditing(null) }, [name])
  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  const save = async () => {
    setSaving(true)
    try {
      const body = payloadOf(def, editing)
      if (editing.id) {
        await api.put(`${def.path}/${editing.id}`, body)
        toast.ok('Saved')
      } else {
        await api.post(def.path, body)
        toast.ok(`${def.singular[0].toUpperCase()}${def.singular.slice(1)} added`)
      }
      setEditing(null)
      load()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (row) => {
    const gate = statusOf(def)?.field
    if (!gate) return
    try {
      await api.patch(`${def.path}/${row.id}/publish`, { value: !row[gate] })
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [gate]: !r[gate] } : r)))
    } catch (e) {
      toast.error(e.message)
    }
  }

  const remove = async () => {
    try {
      await api.del(`${def.path}/${confirming.id}`)
      toast.ok('Deleted')
      setConfirming(null)
      load()
    } catch (e) {
      toast.error(e.message)
    }
  }

  /** Persist a new order. The list is already showing it. */
  const persistOrder = useCallback(async (ordered) => {
    try {
      await api.post(`${def.path}/reorder`, { ids: ordered.map((r) => r.id) })
    } catch (e) {
      toast.error(e.message)
      load()   // put the list back to whatever the server actually has
    }
  }, [def, toast, load])

  const move = (index, delta) => {
    const next = [...rows]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setRows(next)
    persistOrder(next)
  }

  const primary = useMemo(() => def?.columns.find((c) => c.primary)?.name, [def])
  const status = useMemo(() => (def ? statusOf(def) : null), [def])

  if (!def) return <EmptyState title="Unknown section" body={`There is no content type called "${name}".`} />

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-body">{def.title}</h1>
          {def.blurb && <p className="mt-1 text-sm text-muted">{def.blurb}</p>}
        </div>
        {editable && (
          <Button variant="primary" onClick={() => setEditing(blankOf(def))}>
            <Plus size={16} aria-hidden="true" /> Add {def.singular}
          </Button>
        )}
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${def.title.toLowerCase()}`}
            aria-label={`Search ${def.title}`}
            className="w-full rounded-xl border border-neutral-200 bg-surface py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10"
          />
        </div>
        {status?.toggleable && (
        <div className="flex rounded-xl border border-neutral-200 bg-surface p-1">
          {/* Plural here: these filter a list. The pill on a row names one
              record's state and stays singular. */}
          {[['', 'All'], ['true', `${status.on}`], ['false', `${status.off}s`]].map(([v, label]) => (
            <button
              key={label} type="button" onClick={() => setFilter(v)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                filter === v ? 'bg-ink-900 text-white' : 'text-body-soft hover:bg-neutral-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        )}
        <span className="tabular text-sm text-muted">{total} total</span>
      </div>

      <div className="mt-5">
        {loading ? <Spinner />
          : rows.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={q || filter ? 'Nothing matches' : `No ${def.title.toLowerCase()} yet`}
              body={q || filter ? 'Try clearing the search or the filter.' : `Add your first ${def.singular}.`}
              action={editable && !q && !filter
                ? <Button variant="primary" onClick={() => setEditing(blankOf(def))}>
                    <Plus size={16} aria-hidden="true" /> Add {def.singular}
                  </Button>
                : null}
            />
          ) : (
            <Reorder.Group
              axis="y" values={rows}
              onReorder={(next) => { setRows(next); persistOrder(next) }}
              className="space-y-2"
              // Ordering is only meaningful when the whole list is in view and
              // in its real order — not mid-search, not filtered.
              as="ul"
            >
              {rows.map((row, i) => (
                <Row
                  key={row.id} row={row} def={def} index={i} count={rows.length}
                  primary={primary} editable={editable} status={status}
                  draggable={Boolean(def.orderable && editable && !q && !filter)}
                  onEdit={() => setEditing({ ...row })}
                  onToggle={() => togglePublished(row)}
                  onDelete={() => setConfirming(row)}
                  onMove={(d) => move(i, d)}
                />
              ))}
            </Reorder.Group>
          )}
      </div>

      <Editor
        def={def} row={editing} saving={saving}
        onChange={setEditing} onSave={save} onClose={() => setEditing(null)}
      />

      <Confirm
        open={Boolean(confirming)}
        title={`Delete this ${def.singular}?`}
        body={confirming ? `"${confirming[primary] ?? ''}" will be removed from the site. This cannot be undone.` : ''}
        onConfirm={remove}
        onCancel={() => setConfirming(null)}
      />
    </div>
  )
}

function Row({ row, def, index, count, primary, editable, status, draggable, onEdit, onToggle, onDelete, onMove }) {
  const controls = useDragControls()
  // invert: a SEO record stores `noindex`, so false is the good state.
  const flag = status ? (status.invert ? !row[status.field] : Boolean(row[status.field])) : null

  return (
    <Reorder.Item
      value={row} as="li" dragListener={false} dragControls={controls}
      className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-surface p-3 transition-colors hover:border-neutral-300"
    >
      {draggable && (
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onPointerDown={(e) => controls.start(e)}
            aria-label="Drag to reorder"
            className="cursor-grab touch-none rounded-lg p-1.5 text-muted transition-colors hover:bg-neutral-100 hover:text-body-mid active:cursor-grabbing"
          >
            <GripVertical size={15} />
          </button>
          {/* Dragging is not reachable by keyboard, so the same move is also
              available as two buttons. */}
          <div className="flex flex-col">
            <button
              type="button" onClick={() => onMove(-1)} disabled={index === 0}
              aria-label="Move up"
              className="rounded p-0.5 text-muted transition-colors hover:text-body disabled:opacity-25"
            ><ChevronUp size={13} /></button>
            <button
              type="button" onClick={() => onMove(1)} disabled={index === count - 1}
              aria-label="Move down"
              className="rounded p-0.5 text-muted transition-colors hover:text-body disabled:opacity-25"
            ><ChevronDown size={13} /></button>
          </div>
        </div>
      )}

      {def.columns.filter((c) => c.type === 'thumb').map((c) => (
        <div key={c.name} className="grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
          {row[c.name]
            ? <img src={row[c.name]} alt="" className="h-full w-full object-cover" />
            : <span aria-hidden="true" className="text-[0.6rem] font-semibold text-muted">—</span>}
        </div>
      ))}

      <button
        type="button" onClick={onEdit}
        className="min-w-0 flex-1 text-left focus:outline-none focus-visible:underline"
      >
        <span className="block truncate font-semibold text-body">{row[primary] || 'Untitled'}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {def.columns
            .filter((c) => !c.primary && c.type !== 'thumb' && c.type !== 'status')
            .map((c) => row[c.name]).filter(Boolean).join(' · ')}
        </span>
      </button>

      {status && (
        status.toggleable ? (
          <button
            type="button" onClick={onToggle} disabled={!editable}
            className="shrink-0 disabled:pointer-events-none"
            aria-label={flag ? `Set to ${status.off}` : `Set to ${status.on}`}
          >
            <StatusPill on={flag} onLabel={status.on} offLabel={status.off} />
          </button>
        ) : (
          // Not a gate, so not a control. This state is edited in the form —
          // there is no publish endpoint behind it to call.
          <span className="shrink-0">
            <StatusPill on={flag} onLabel={status.on} offLabel={status.off} />
          </span>
        )
      )}

      {editable && (
        <button
          type="button" onClick={onDelete} aria-label="Delete"
          className="shrink-0 rounded-lg p-2 text-muted opacity-0 transition-all hover:bg-brand-deep/10 hover:text-accent focus:opacity-100 group-hover:opacity-100"
        >
          <Trash2 size={15} />
        </button>
      )}
    </Reorder.Item>
  )
}

/** The edit form, as a panel over the list rather than a separate page —
 *  so the client never loses their place in a long list. */
function Editor({ def, row, saving, onChange, onSave, onClose }) {
  const open = Boolean(row)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end bg-ink-950/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.form
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            onSubmit={(e) => { e.preventDefault(); onSave() }}
            className="flex h-full w-full max-w-xl flex-col bg-page shadow-raise"
            role="dialog" aria-modal="true"
            aria-label={`${row.id ? 'Edit' : 'New'} ${def.singular}`}
          >
            <header className="flex items-center justify-between border-b border-neutral-200 bg-surface px-6 py-4">
              <h2 className="font-display text-lg font-bold text-body">
                {row.id ? `Edit ${def.singular}` : `New ${def.singular}`}
              </h2>
              <Button type="button" variant="ghost" onClick={onClose} aria-label="Close">
                <X size={17} />
              </Button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {def.upload === 'document' && <DocumentUpload row={row} onChange={onChange} />}
              {def.fields.map((f, i) => (
                <Field
                  key={f.name ?? `section-${i}`}
                  field={f}
                  value={row[f.name]}
                  values={row}
                  onChange={(v) => onChange({ ...row, [f.name]: v })}
                />
              ))}
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-neutral-200 bg-surface px-6 py-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary" busy={saving}>Save</Button>
            </footer>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** PDFs are uploaded, not pasted as a URL. */
function DocumentUpload({ row, onChange }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const upload = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.upload('/media/document', form)
      onChange({
        ...row,
        file_url: res.file_url,
        filename: res.filename,
        bytes: res.bytes,
        // Give it a usable title if the client has not typed one yet.
        title: row.title || res.filename.replace(/\.pdf$/i, ''),
      })
      toast.ok('Document uploaded')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-surface p-4">
      <p className="text-sm font-semibold text-body-strong">PDF file</p>
      {row.filename
        ? <p className="mt-1 truncate text-xs text-muted">{row.filename} · {Math.round((row.bytes ?? 0) / 1024)} KB</p>
        : <p className="mt-1 text-xs text-muted">No file attached yet.</p>}
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-body-strong transition-colors hover:bg-neutral-200">
        <Upload size={15} aria-hidden="true" />
        {busy ? 'Uploading…' : row.filename ? 'Replace file' : 'Choose PDF'}
        <input
          type="file" accept="application/pdf" className="sr-only"
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </label>
    </div>
  )
}
