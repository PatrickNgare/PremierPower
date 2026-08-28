import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Reorder, useDragControls } from 'framer-motion'
import { ChevronDown, Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Button, Spinner, useToast } from '../components/ui'

/** Plain names for blocks whose heading is not their own words. */
const SECTION_NAMES = {
  hero: 'Hero', stats: 'Figures bar', lighting: 'Lighting showcase',
  safety: 'Trust marks', cta: 'Closing call to action',
}

const SECTION_BLURBS = {
  hero: 'The headline and buttons at the top of the page',
  stats: 'The four figures on the dark band',
  safety: 'The four trust marks below the lighting section',
  cta: 'The closing panel with the phone and WhatsApp buttons',
}

/** Where a block's other content is edited, said plainly rather than left to
 *  be discovered. */
const SECTION_NOTES = {
  hero: 'The rotating photographs behind this are edited under Hero slides.',
  stats: 'Each figure is taken from Company details, so a number is only ever typed once.',
  cta: 'The phone number and WhatsApp number come from Company details.',
  projects: 'The projects shown here are edited under Installations.',
  solutions: 'The cards shown here are edited under Sectors.',
  services: 'The service lines shown here are edited under Services.',
  testimonials: 'The reviews shown here are edited under Reviews.',
  about: 'The photographs and figures in this block come from Installations and Company details.',
}

/** Titles are stored with "|" where the design breaks the heading in two. */
const splitTitle = (t) => String(t).replace('|', ' ')

/**
 * The home page, block by block.
 *
 * Sections can be reordered, hidden and retitled, but not created: `key` names
 * a component that has to exist in the code. A CMS that lets someone name a
 * section nobody built renders a blank space they cannot diagnose.
 */
/** Which pages the CMS can edit, and what to call them. */
export const PAGES = [
  ['/', 'Home page'], ['/services', 'Services page'], ['/portfolio', 'Installations page'],
  ['/safety', 'Safety page'], ['/about', 'About page'], ['/testimonials', 'Reviews page'],
  ['/faq', 'FAQ page'], ['/contact', 'Contact page'],
]

export default function Homepage() {
  const params = useParams()
  // The route carries the page without its leading slash; "/" has none.
  const page = params.page ? `/${params.page}` : '/'
  const pageName = PAGES.find(([p]) => p === page)?.[1] ?? page

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
      const res = await api.get('/page-sections/all?limit=300')
      setRows(res.items.filter((r) => r.page === page))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, toast])

  useEffect(() => { load() }, [load])

  const persistOrder = async (ordered) => {
    try {
      await api.post('/page-sections/reorder', { ids: ordered.map((r) => r.id) })
    } catch (e) {
      toast.error(e.message)
      load()
    }
  }

  const toggle = async (row) => {
    try {
      await api.patch(`/page-sections/${row.id}/publish`, { value: !row.enabled })
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, enabled: !r.enabled } : r)))
    } catch (e) {
      toast.error(e.message)
    }
  }

  const save = async (row) => {
    setSaving(true)
    try {
      await api.put(`/page-sections/${row.id}`, {
        page: row.page, key: row.key, eyebrow: row.eyebrow, title: row.title,
        subtitle: row.subtitle, cta_label: row.cta_label, cta_href: row.cta_href,
        image_url: row.image_url ?? '', image_alt: row.image_alt ?? '',
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
      <h1 className="font-display text-2xl font-extrabold text-ink-900">{pageName}</h1>
      <p className="mt-1 text-sm text-ink-400">
        {page === '/'
          ? 'Drag to reorder. Hide a block to take it off the page without deleting anything.'
          : 'The words on this page. The lists it shows — services, projects, reviews — are edited in their own sections.'}
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
  // Which blocks hold a list, and what to call it. A block not listed here is
  // heading-only.
  const LIST = {
    safety: 'Trust marks', lighting: 'Lighting tiles', stats: 'Figures',
  }
  const listLabel = LIST[row.key]

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

        {/* A chevron, because without one nothing said these rows opened. */}
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <ChevronDown
            size={15} aria-hidden="true"
            className={`shrink-0 text-ink-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
          <span className="min-w-0">
            <span className={`block truncate font-semibold ${row.enabled ? 'text-ink-900' : 'text-ink-400'}`}>
              {row.title ? splitTitle(row.title) : row.eyebrow || SECTION_NAMES[row.key] || row.key}
            </span>
            <span className="mt-0.5 block truncate text-xs text-ink-400">
              {row.subtitle || SECTION_BLURBS[row.key] || row.key}
            </span>
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

      {open && (
        <div className="space-y-3 border-t border-neutral-200 p-4">
          {SECTION_NOTES[row.key] && (
            <p className="rounded-xl bg-neutral-50 p-3 text-xs leading-relaxed text-ink-600">
              {SECTION_NOTES[row.key]}
            </p>
          )}
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

          {listLabel && <SectionItems section={row.key} label={listLabel} editable={editable} />}
        </div>
      )}
    </Reorder.Item>
  )
}

/**
 * The repeated items inside a block — trust marks, lighting tiles, figures.
 *
 * Kept inline under the section rather than given its own screen: they are
 * meaningless away from the block they belong to, and a client looking at the
 * home page should not have to know the phrase "section item".
 */
function SectionItems({ section, label, editable }) {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const page = await api.get(`/section-items/all?limit=100`)
      setRows(page.items.filter((r) => r.section === section))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [section, toast])

  useEffect(() => { load() }, [load])

  const patch = (id, key, value) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)))

  const save = async (row, overrides = {}) => {
    const next = { ...row, ...overrides }
    try {
      await api.put(`/section-items/${next.id}`, {
        section: next.section, title: next.title, body: next.body, icon: next.icon,
        image_url: next.image_url, image_alt: next.image_alt, href: next.href,
        value: next.value, position: next.position, published: next.published,
      })
      toast.ok('Saved')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const add = async () => {
    try {
      const created = await api.post('/section-items', {
        section, title: 'New item', body: '', position: rows.length, published: true,
      })
      setRows((r) => [...r, created])
    } catch (e) {
      toast.error(e.message)
    }
  }

  const remove = async (row) => {
    try {
      await api.del(`/section-items/${row.id}`)
      setRows((r) => r.filter((x) => x.id !== row.id))
      toast.ok('Removed')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const input = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10'

  if (loading) return <p className="pt-2 text-sm text-ink-400">Loading {label.toLowerCase()}…</p>

  return (
    <div className="border-t border-neutral-200 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-ink-400">{label}</h4>
        {editable && (
          <Button variant="ghost" onClick={add}><Plus size={14} aria-hidden="true" /> Add</Button>
        )}
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
            <div className="flex gap-2">
              <input
                className={input} value={row.title ?? ''} disabled={!editable}
                onChange={(e) => patch(row.id, 'title', e.target.value)}
                onBlur={() => save(row)} aria-label="Title"
              />
              {editable && (
                <button
                  type="button" onClick={() => remove(row)} aria-label="Remove"
                  className="shrink-0 rounded-lg p-2 text-ink-400 transition-colors hover:bg-brand-deep/10 hover:text-brand-deep"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {/* A figure taken from Company details has nothing to type here —
                showing an empty body box would invite typing the number twice. */}
            {row.href ? (
              <p className="mt-2 text-xs text-ink-400">
                Figure taken from Company details: <span className="font-medium">{row.href}</span>
              </p>
            ) : (
              <textarea
                rows={2} className={`${input} mt-2`} value={row.body ?? ''} disabled={!editable}
                onChange={(e) => patch(row.id, 'body', e.target.value)}
                onBlur={() => save(row)} aria-label="Description"
                placeholder={section === 'stats' ? 'Figure, e.g. 7' : 'Description'}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
