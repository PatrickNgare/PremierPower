import { useCallback, useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Button, Confirm, Spinner, StatusPill, useToast } from '../components/ui'

const MENUS = [['header', 'Top navigation'], ['footer', 'Footer links']]

export default function Menus() {
  const toast = useToast()
  const { can } = useAuth()
  const editable = can('editor')
  const [menu, setMenu] = useState('header')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const page = await api.get('/menu/all?limit=200')
      setRows(page.items.filter((r) => r.menu === menu))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [menu, toast])

  useEffect(() => { load() }, [load])

  const add = async () => {
    try {
      const created = await api.post('/menu', {
        menu, label: 'New link', href: '/', position: rows.length, published: true,
      })
      setRows((r) => [...r, created])
    } catch (e) {
      toast.error(e.message)
    }
  }

  /** `overrides` matters for the visibility toggle: the click handler's
   *  closure still holds the row as it was before the toggle, so the new
   *  value has to travel with the call rather than be read back off it. */
  const save = async (row, overrides = {}) => {
    const next = { ...row, ...overrides }
    try {
      await api.put(`/menu/${next.id}`, {
        menu: next.menu, label: next.label, href: next.href, parent_id: next.parent_id,
        new_tab: next.new_tab, position: next.position, published: next.published,
      })
      toast.ok('Saved')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const remove = async () => {
    try {
      await api.del(`/menu/${confirming.id}`)
      setRows((r) => r.filter((x) => x.id !== confirming.id))
      setConfirming(null)
      toast.ok('Removed')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const persistOrder = async (ordered) => {
    try {
      await api.post('/menu/reorder', { ids: ordered.map((r) => r.id) })
    } catch (e) {
      toast.error(e.message)
      load()
    }
  }

  const patch = (id, key, value) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)))

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-body">Navigation</h1>
          <p className="mt-1 text-sm text-muted">The links across the top of the site and in the footer.</p>
        </div>
        {editable && (
          <Button variant="primary" onClick={add}><Plus size={16} aria-hidden="true" /> Add link</Button>
        )}
      </div>

      <div className="mt-6 flex rounded-xl border border-neutral-200 bg-surface p-1">
        {MENUS.map(([v, label]) => (
          <button
            key={v} type="button" onClick={() => setMenu(v)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              menu === v ? 'bg-ink-900 text-white' : 'text-body-soft hover:bg-neutral-100'
            }`}
          >{label}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <Reorder.Group
          axis="y" values={rows} as="ul" className="mt-5 space-y-2"
          onReorder={(next) => { setRows(next); persistOrder(next) }}
        >
          {rows.map((row) => (
            <LinkRow
              key={row.id} row={row} editable={editable}
              onPatch={(k, v) => patch(row.id, k, v)}
              onSave={(overrides) => save(row, overrides)}
              onDelete={() => setConfirming(row)}
            />
          ))}
        </Reorder.Group>
      )}

      <Confirm
        open={Boolean(confirming)}
        title="Remove this link?"
        body={confirming ? `"${confirming.label}" will no longer appear in the ${menu === 'header' ? 'top navigation' : 'footer'}.` : ''}
        confirmLabel="Remove"
        onConfirm={remove} onCancel={() => setConfirming(null)}
      />
    </div>
  )
}

function LinkRow({ row, editable, onPatch, onSave, onDelete }) {
  const controls = useDragControls()
  const input = 'rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10'

  return (
    <Reorder.Item
      value={row} as="li" dragListener={false} dragControls={controls}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-surface p-3"
    >
      {editable && (
        <button
          type="button" onPointerDown={(e) => controls.start(e)} aria-label="Drag to reorder"
          className="cursor-grab touch-none rounded-lg p-1.5 text-muted transition-colors hover:bg-neutral-100 active:cursor-grabbing"
        >
          <GripVertical size={15} />
        </button>
      )}
      <input
        className={`${input} min-w-[8rem] flex-1`} value={row.label}
        onChange={(e) => onPatch('label', e.target.value)} onBlur={() => onSave()}
        aria-label="Link text" disabled={!editable}
      />
      <input
        className={`${input} min-w-[10rem] flex-[2]`} value={row.href}
        onChange={(e) => onPatch('href', e.target.value)} onBlur={() => onSave()}
        aria-label="Link address" placeholder="/services" disabled={!editable}
      />
      <button
        type="button" disabled={!editable}
        onClick={() => {
          const published = !row.published
          onPatch('published', published)
          onSave({ published })
        }}
        aria-label={row.published ? 'Hide this link' : 'Show this link'}
        className="disabled:pointer-events-none"
      >
        <StatusPill on={row.published} onLabel="Visible" offLabel="Hidden" />
      </button>
      {editable && (
        <button
          type="button" onClick={onDelete} aria-label="Remove link"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-brand-deep/10 hover:text-accent"
        >
          <Trash2 size={15} />
        </button>
      )}
    </Reorder.Item>
  )
}
