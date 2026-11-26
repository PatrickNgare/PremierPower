import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react'
import { api } from '../api'
import { EmptyState, Spinner, useToast } from '../components/ui'

const TONE = {
  create: 'bg-earth-ink/10 text-earth-ink',
  delete: 'bg-brand-deep/10 text-accent',
  publish: 'bg-earth-ink/10 text-earth-ink',
  unpublish: 'bg-lumen-100 text-lumen-700',
  login: 'bg-neutral-100 text-body-soft',
}

const PAGE_SIZE = 50

/** Who changed what, and when. Read-only by design — an activity log that
 *  can be edited is not evidence of anything. Entries are deleted by the
 *  server after six months. */
export default function Audit() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    setLoading(true)
    api.get(`/audit?page=${page}&page_size=${PAGE_SIZE}`)
      .then((d) => { if (live) setData(d) })
      .catch((e) => toast.error(e.message))
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [page, toast])

  if (!data) return loading ? <Spinner label="Loading activity" /> : null

  const rows = data.items
  const from = data.total ? (data.page - 1) * data.page_size + 1 : 0
  const to = Math.min(data.page * data.page_size, data.total)
  const go = (p) => { setPage(p); window.scrollTo({ top: 0 }) }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-body">Activity log</h1>
      <p className="mt-1 text-sm text-muted">
        Every change made through the admin, most recent first.
        Entries older than six months are deleted automatically.
      </p>

      {rows.length === 0
        ? <div className="mt-6"><EmptyState icon={ScrollText} title="Nothing recorded yet" /></div>
        : (
          <ul className="mt-6 space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-surface p-3.5">
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${TONE[r.action] ?? 'bg-neutral-100 text-body-soft'}`}>
                  {r.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-body">
                    {r.entity}{r.entity_id ? ` #${r.entity_id}` : ''}
                    {r.detail && <span className="font-normal text-body-soft"> — {r.detail}</span>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {r.actor}{r.ip ? ` · ${r.ip}` : ''}
                  </p>
                </div>
                <time className="tabular shrink-0 text-xs text-muted">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                </time>
              </li>
            ))}
          </ul>
        )}

      {data.total > 0 && (
        <nav aria-label="Activity log pages" className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="tabular text-sm text-muted">
            {from}–{to} of {data.total}
          </p>
          <div className={`flex items-center gap-2 ${loading ? 'opacity-60' : ''}`}>
            <button
              type="button" onClick={() => go(page - 1)} disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-sm font-semibold text-body transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} aria-hidden="true" /> Newer
            </button>
            <span className="tabular px-1 text-sm text-body-soft" aria-current="page">
              Page {data.page} of {data.pages}
            </span>
            <button
              type="button" onClick={() => go(page + 1)} disabled={page >= data.pages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-sm font-semibold text-body transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Older <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}
