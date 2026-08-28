import { useCallback, useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { Eye, EyeOff, GripVertical } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Button, Spinner, useToast } from '../components/ui'

/**
 * The home page, block by block.
 *
 * Sections can be reordered, hidden and retitled, but not created: `key` names
 * a component that has to exist in the code. A CMS that lets someone name a
 * section nobody built renders a blank space they cannot diagnose.
 */
export default function Homepage() {
  const toast = useToast()
  const { can } = useAuth()
  const editable = can('editor')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const page = await api.get('/homepage-sections/all?limit=100')
      setRows(page.items)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const persistOrder = async (ordered) => {
    try {
      await api.post('/homepage-sections/reorder', { ids: ordered.map((r) => r.id) })
    } catch (e) {
      toast.error(e.message)
      load()
    }
  }

  const toggle = async (row) => {
    try {
      await api.patch(`/homepage-sections/${row.id}/publish`, { value: !row.enabled })
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, enabled: !r.enabled } : r)))
    } catch (e) {
      toast.error(e.message)
    }
  }

  const save = async (row) => {
    setSaving(true)
    try {
      await api.put(`/homepage-sections/${row.id}`, {
        key: row.key, eyebrow: row.eyebrow, title: row.title, subtitle: row.subtitle,
        cta_label: row.cta_label, cta_href: row.cta_href,
        position: row.position, enabled: row.enabled, config: row.config ?? {},
      })
      toast.ok('Saved')
      setOpenId(null)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const patch = (id, key, value) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)))

  const input = 'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10'

  if (loading) return <Spinner label="Loading the home page" />

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink-900">Home page</h1>
      <p className="mt-1 text-sm text-ink-400">
        Drag to reorder. Hide a block to take it off the page without deleting anything.
        The content inside each block is edited in its own section.
      </p>

      <Reorder.Group
        axis="y" values={rows} as="ul" className="mt-6 space-y-2"
        onReorder={(next) => { setRows(next); persistOrder(next) }}
      >
        {rows.map((row) => (
          <SectionRow
            key={row.id} row={row} editable={editable}
            open={openId === row.id}
            onOpen={() => setOpenId(openId === row.id ? null : row.id)}
            onToggle={() => toggle(row)}
            onPatch={(k, v) => patch(row.id, k, v)}
            onSave={() => save(row)}
            saving={saving}
            input={input}
          />
        ))}
      </Reorder.Group>
    </div>
  )
}

function SectionRow({ row, editable, open, onOpen, onToggle, onPatch, onSave, saving, input }) {
  const controls = useDragControls()
  // Some blocks are pure composition — the hero, the stats bar — and carry no
  // heading of their own. Offering empty boxes for them would be a puzzle.
  const hasHeader = Boolean(row.title || row.eyebrow || row.subtitle)

  return (
    <Reorder.Item
      value={row} as="li" dragListener={false} dragControls={controls}
      className={`rounded-xl border bg-white transition-colors ${
        row.enabled ? 'border-neutral-200' : 'border-dashed border-neutral-300 bg-neutral-50/60'
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {editable && (
          <button
            type="button" onPointerDown={(e) => controls.start(e)} aria-label="Drag to reorder"
            className="cursor-grab touch-none rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-neutral-100 hover:text-ink-700 active:cursor-grabbing"
          >
            <GripVertical size={15} />
          </button>
        )}

        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <span className={`block truncate font-semibold ${row.enabled ? 'text-ink-900' : 'text-ink-400'}`}>
            {row.title || row.eyebrow || row.key}
          </span>
          <span className="mt-0.5 block truncate text-xs text-ink-400">
            {hasHeader ? (row.subtitle || row.key) : `${row.key} — no heading of its own`}
          </span>
        </button>

        <button
          type="button" onClick={onToggle} disabled={!editable}
          aria-label={row.enabled ? 'Hide this block' : 'Show this block'}
          className="shrink-0 rounded-lg p-2 text-ink-400 transition-colors hover:bg-neutral-100 hover:text-ink-900 disabled:pointer-events-none"
        >
          {row.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      {open && hasHeader && (
        <div className="space-y-3 border-t border-neutral-200 p-4">
          <div>
            <label className="text-sm font-semibold text-ink-800">Small label</label>
            <input className={`${input} mt-1.5`} value={row.eyebrow ?? ''}
              onChange={(e) => onPatch('eyebrow', e.target.value)} disabled={!editable} />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink-800">Heading</label>
            <input className={`${input} mt-1.5`} value={row.title ?? ''}
              onChange={(e) => onPatch('title', e.target.value)} disabled={!editable} />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink-800">Supporting paragraph</label>
            <textarea rows={3} className={`${input} mt-1.5`} value={row.subtitle ?? ''}
              onChange={(e) => onPatch('subtitle', e.target.value)} disabled={!editable} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-ink-800">Link text</label>
              <input className={`${input} mt-1.5`} value={row.cta_label ?? ''}
                onChange={(e) => onPatch('cta_label', e.target.value)} disabled={!editable} />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink-800">Link address</label>
              <input className={`${input} mt-1.5`} value={row.cta_href ?? ''}
                onChange={(e) => onPatch('cta_href', e.target.value)} disabled={!editable} />
            </div>
          </div>
          {editable && (
            <div className="flex justify-end pt-1">
              <Button variant="primary" onClick={onSave} busy={saving}>Save</Button>
            </div>
          )}
        </div>
      )}
    </Reorder.Item>
  )
}
