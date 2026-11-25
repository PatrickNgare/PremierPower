import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Reorder, useDragControls } from 'framer-motion'
import { AlertTriangle, ChevronDown, Eye, EyeOff, GripVertical, MapPin, Plus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Button, Spinner, useToast } from '../components/ui'

/** What each block is called, in words a person would use for it. */
const SECTION_NAMES = {
  hero: 'Slideshow & headline', stats: 'Figures bar', about: 'About us', projects: 'Projects',
  solutions: 'Sectors', lighting: 'Lighting showcase', safety: 'Trust marks', services: 'Services',
  why: 'Why us — dark band', process: 'How it works', testimonials: 'Reviews',
  cta: 'Closing call to action', reel: 'Showroom clips',
}

/** One line on what the block looks like on the page. */
const SECTION_BLURBS = {
  hero: 'The big rotating photographs at the very top, with the main headline and buttons',
  stats: 'The four numbers on the dark strip under the slideshow',
  about: 'A short introduction beside a grid of project photographs',
  projects: 'Large photo cards of finished projects, with a link to all of them',
  solutions: 'Cards for each type of client: hotels, offices, homes and so on',
  lighting: 'A dark band of lighting photographs',
  safety: 'Four small badges: registration, testing, insurance and so on',
  services: 'A large feature card and a list of every service line',
  why: 'A dark band explaining why contractors choose one company for everything',
  process: 'Four numbered steps from drawings to handover',
  testimonials: 'Quotes from clients',
  cta: 'The last panel on the page, with the phone and WhatsApp buttons',
  reel: 'A sideways row of short showroom videos',
}

/** The same, for the pages other than home: there "hero" is a single banner
 *  photograph, not the slideshow, and sectionN are plain text blocks. */
const nameOf = (key, page) =>
  page !== '/' && key === 'hero' ? 'Page banner'
    : /^section\d+$/.test(key) ? `Text block ${key.slice(7)}`
      : SECTION_NAMES[key] || key
const blurbOf = (key, page) =>
  page !== '/' && key === 'hero' ? 'The photograph and headline at the top of the page'
    : /^section\d+$/.test(key) ? 'A heading and paragraph further down the page'
      : SECTION_BLURBS[key] || ''

/**
 * Which of the text fields a home block actually draws. The figures bar, the
 * trust marks and the closing panel draw none of them, so offering a heading
 * box there only invited typing into something that never appears.
 * Pages other than home keep every field.
 */
const HOME_FIELDS = {
  hero: ['eyebrow', 'title', 'subtitle', 'link'],
  lighting: ['eyebrow', 'title', 'subtitle', 'link'],
  projects: ['eyebrow', 'title', 'subtitle', 'link'],
  services: ['eyebrow', 'title', 'subtitle', 'link'],
  about: ['eyebrow', 'title', 'subtitle'],
  solutions: ['eyebrow', 'title', 'subtitle'],
  why: ['eyebrow', 'title', 'subtitle'],
  process: ['eyebrow', 'title', 'subtitle'],
  testimonials: ['eyebrow', 'title', 'subtitle'],
  stats: [], safety: [], cta: [],
}
const ALL_FIELDS = ['eyebrow', 'title', 'subtitle', 'link']

/** Where a block's other content is edited, said plainly rather than left to
 *  be discovered. */
const SECTION_NOTES = {
  hero: 'The rotating photographs behind this are edited under the Slideshow photos tab above.',
  stats: 'Type each number below. A figure left blank is left off the site.',
  cta: 'The phone number and WhatsApp number come from Settings → Company details.',
  projects: 'The projects shown here are edited under Projects.',
  solutions: 'The cards shown here are edited under Settings → Sectors.',
  services: 'The service lines shown here are edited under Settings → Services.',
  testimonials: 'The reviews shown here are edited under Settings → Reviews.',
  about: 'The photographs and figures in this block come from Projects and Settings → Company details.',
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
  ['/', 'Home page'], ['/services', 'Services page'],
  ['/products', 'Lighting & fittings page'], ['/portfolio', 'Installations page'],
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
  const [counts, setCounts] = useState({})

  // How many items the list-driven blocks have, so a block that is switched
  // on but has nothing to show can say so instead of silently vanishing.
  useEffect(() => {
    if (page !== '/') return
    Promise.all(['testimonials', 'projects', 'sectors', 'services'].map((k) =>
      api.get(`/${k}`).then((r) => [k, Array.isArray(r) ? r.length : 0]).catch(() => [k, null])))
      .then((pairs) => setCounts(Object.fromEntries(pairs)))
  }, [page])

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

  const input = 'w-full rounded-xl border border-neutral-200 bg-surface px-3.5 py-2.5 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10'

  if (loading) return <Spinner label="Loading the home page" />

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-body">{pageName}</h1>
      <p className="mt-1 text-sm text-muted">
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
            page={page}
            empty={EMPTY[row.key]?.(counts)}
          />
        ))}
      </Reorder.Group>
    </div>
  )
}

/** Why a switched-on block shows nothing, if it does. */
const EMPTY = {
  testimonials: (c) => c.testimonials === 0 && 'Not showing yet: there are no reviews. Add one under Settings → Reviews.',
  projects: (c) => c.projects === 0 && 'Not showing yet: there are no projects. Add one under Projects.',
  solutions: (c) => c.sectors === 0 && 'Empty: there are no sectors. Add them under Settings → Sectors.',
  services: (c) => c.services === 0 && 'Empty: there are no services. Add them under Settings → Services.',
}

function SectionRow({ row, editable, open, onOpen, onToggle, onPatch, onSave, saving, input, page, empty }) {
  const controls = useDragControls()
  // Which blocks hold a list, and what to call it. A block not listed here is
  // heading-only.
  const LIST = {
    safety: 'Trust marks', lighting: 'Lighting tiles', stats: 'Figures',
    reel: 'Showroom clips',
  }
  const listLabel = LIST[row.key]
  const fields = page === '/' ? (HOME_FIELDS[row.key] ?? ALL_FIELDS) : ALL_FIELDS

  return (
    <Reorder.Item
      value={row} as="li" dragListener={false} dragControls={controls}
      className={`rounded-xl border bg-surface transition-colors ${
        row.enabled ? 'border-neutral-200' : 'border-dashed border-neutral-300 bg-neutral-50/60'
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {editable && (
          <button
            type="button" onPointerDown={(e) => controls.start(e)} aria-label="Drag to reorder"
            className="cursor-grab touch-none rounded-lg p-1.5 text-muted transition-colors hover:bg-neutral-100 hover:text-body-mid active:cursor-grabbing"
          >
            <GripVertical size={15} />
          </button>
        )}

        {/* A chevron, because without one nothing said these rows opened. */}
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <ChevronDown
            size={15} aria-hidden="true"
            className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="rounded-md bg-ink-900/[0.06] px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-body-soft">
                {nameOf(row.key, page)}
              </span>
              {!row.enabled && (
                <span className="text-[0.7rem] font-bold uppercase tracking-wide text-muted">Hidden</span>
              )}
            </span>
            {/* Its own heading when it has one; blocks with no heading of their
                own (the figures bar, the trust marks) just say what they are. */}
            {(row.title || row.eyebrow) && (
              <span className={`mt-1 block truncate font-semibold ${row.enabled ? 'text-body' : 'text-muted'}`}>
                {row.title ? splitTitle(row.title) : row.eyebrow}
              </span>
            )}
            <span className={`mt-0.5 block truncate ${row.title || row.eyebrow ? 'text-xs text-muted' : `mt-1 text-sm font-medium ${row.enabled ? 'text-body-soft' : 'text-muted'}`}`}>
              {blurbOf(row.key, page) || row.subtitle || ''}
            </span>
            {row.enabled && empty && (
              <span className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-lumen-700">
                <AlertTriangle size={13} aria-hidden="true" className="mt-px shrink-0" />
                <span className="whitespace-normal">{empty}</span>
              </span>
            )}
          </span>
        </button>

        {page === '/' && row.enabled && (
          <a
            href={`/#section-${row.key}`} target="_blank" rel="noopener"
            title="Open the home page at this block"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-body-soft transition-colors hover:bg-neutral-100 hover:text-body"
          >
            <MapPin size={14} aria-hidden="true" /> <span className="hidden sm:inline">See it</span>
          </a>
        )}

        <button
          type="button" onClick={onToggle} disabled={!editable}
          aria-label={row.enabled ? 'Hide this block' : 'Show this block'}
          className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-neutral-100 hover:text-body disabled:pointer-events-none"
        >
          {row.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-neutral-200 p-4">
          {SECTION_NOTES[row.key] && (
            <p className="rounded-xl bg-neutral-50 p-3 text-xs leading-relaxed text-body-soft">
              {SECTION_NOTES[row.key]}
            </p>
          )}
          {fields.includes('eyebrow') && (
            <div>
              <label className="text-sm font-semibold text-body-strong">Small label</label>
              <input className={`${input} mt-1.5`} value={row.eyebrow ?? ''}
                onChange={(e) => onPatch('eyebrow', e.target.value)} disabled={!editable} />
            </div>
          )}
          {fields.includes('title') && (
            <div>
              <label className="text-sm font-semibold text-body-strong">Heading</label>
              <input className={`${input} mt-1.5`} value={row.title ?? ''}
                onChange={(e) => onPatch('title', e.target.value)} disabled={!editable} />
            </div>
          )}
          {fields.includes('subtitle') && (
            <div>
              <label className="text-sm font-semibold text-body-strong">Supporting paragraph</label>
              <textarea rows={3} className={`${input} mt-1.5`} value={row.subtitle ?? ''}
                onChange={(e) => onPatch('subtitle', e.target.value)} disabled={!editable} />
            </div>
          )}
          {fields.includes('link') && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-body-strong">Link text</label>
                <input className={`${input} mt-1.5`} value={row.cta_label ?? ''}
                  onChange={(e) => onPatch('cta_label', e.target.value)} disabled={!editable} />
              </div>
              <div>
                <label className="text-sm font-semibold text-body-strong">Link address</label>
                <input className={`${input} mt-1.5`} value={row.cta_href ?? ''}
                  onChange={(e) => onPatch('cta_href', e.target.value)} disabled={!editable} />
              </div>
            </div>
          )}
          {editable && fields.length > 0 && (
            <div className="flex justify-end pt-1">
              <Button variant="primary" onClick={onSave} busy={saving}>Save</Button>
            </div>
          )}

          {row.key === 'stats' && page === '/'
            ? <FiguresEditor editable={editable} />
            : listLabel && <SectionItems section={row.key} label={listLabel} editable={editable} />}
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

  const input = 'w-full rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10'

  if (loading) return <p className="pt-2 text-sm text-muted">Loading {label.toLowerCase()}…</p>

  return (
    <div className="border-t border-neutral-200 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">{label}</h4>
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
                  className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-brand-deep/10 hover:text-accent"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {/* A figure taken from Company details has nothing to type here —
                showing an empty body box would invite typing the number twice. */}
            {row.href ? (
              <p className="mt-2 text-xs text-muted">
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

/**
 * The four numbers on the figures bar, each with a box to type it in.
 *
 * Some figures are company details (years trading, projects delivered,
 * response time) that the site uses elsewhere too. Their box writes the
 * company detail itself, so the number is still only stored once, but nobody
 * has to know that or go to Settings to change it.
 */
function FiguresEditor({ editable }) {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [details, setDetails] = useState({})
  const [draft, setDraft] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [items, settings] = await Promise.all([
        api.get('/section-items/all?limit=100'),
        api.get('/settings/all'),
      ])
      const figures = items.items.filter((r) => r.section === 'stats')
        .sort((a, b) => a.position - b.position)
      const byKey = Object.fromEntries(settings.map((x) => [x.key, x]))
      setRows(figures)
      setDetails(byKey)
      setDraft(Object.fromEntries(figures.map((r) => [r.id, {
        title: r.title ?? '',
        number: r.href ? String(byKey[r.href]?.value ?? '') : String(r.value || r.body || ''),
      }])))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const set = (id, k, v) => setDraft((d) => ({ ...d, [id]: { ...d[id], [k]: v } }))

  const saveAll = async () => {
    setSaving(true)
    try {
      for (const r of rows) {
        const { title, number } = draft[r.id]
        const n = number.trim()
        if (r.href) {
          const before = String(details[r.href]?.value ?? '')
          if (n !== before) {
            await api.put(`/settings/${encodeURIComponent(r.href)}`, {
              key: r.href, value: n, note: details[r.href]?.note ?? '',
            })
          }
        }
        const value = r.href ? '' : n
        if (title !== (r.title ?? '') || (!r.href && value !== (r.value || r.body || ''))) {
          await api.put(`/section-items/${r.id}`, {
            section: r.section, title, body: value, icon: r.icon,
            image_url: r.image_url, image_alt: r.image_alt, href: r.href,
            value, position: r.position, published: r.published,
          })
        }
      }
      toast.ok('Figures saved')
      load()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const box = 'w-full rounded-lg border border-neutral-200 bg-surface px-3 py-2 outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10'

  if (loading) return <p className="pt-2 text-sm text-muted">Loading figures…</p>

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div key={r.id} className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">Figure {i + 1}</p>
            <label className="mt-2 block text-xs font-semibold text-body-soft" htmlFor={`fig-n-${r.id}`}>Number</label>
            <input
              id={`fig-n-${r.id}`} className={`${box} mt-1 font-display text-xl font-extrabold`}
              value={draft[r.id]?.number ?? ''} disabled={!editable}
              onChange={(e) => set(r.id, 'number', e.target.value)}
              placeholder={r.href === 'response_time' ? 'e.g. 24 hrs' : 'e.g. 15+'}
            />
            <label className="mt-2 block text-xs font-semibold text-body-soft" htmlFor={`fig-t-${r.id}`}>Label under it</label>
            <input
              id={`fig-t-${r.id}`} className={`${box} mt-1 text-sm`}
              value={draft[r.id]?.title ?? ''} disabled={!editable}
              onChange={(e) => set(r.id, 'title', e.target.value)}
            />
          </div>
        ))}
      </div>
      {editable && (
        <div className="mt-3 flex justify-end">
          <Button variant="primary" onClick={saveAll} busy={saving}>Save figures</Button>
        </div>
      )}
    </div>
  )
}
