import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { api } from '../api'
import { EmptyState, Spinner, useToast } from '../components/ui'

const TONE = {
  create: 'bg-earth-ink/10 text-earth-ink',
  delete: 'bg-brand-deep/10 text-brand-deep',
  publish: 'bg-earth-ink/10 text-earth-ink',
  unpublish: 'bg-lumen-100 text-lumen-700',
  login: 'bg-neutral-100 text-ink-600',
}

/** Who changed what, and when. Read-only by design — an activity log that
 *  can be edited is not evidence of anything. */
export default function Audit() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/audit?limit=200')
      .then(setRows)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [toast])

  if (loading) return <Spinner label="Loading activity" />

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink-900">Activity log</h1>
      <p className="mt-1 text-sm text-muted">Every change made through the admin, most recent first.</p>

      {rows.length === 0
        ? <div className="mt-6"><EmptyState icon={ScrollText} title="Nothing recorded yet" /></div>
        : (
          <ul className="mt-6 space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5">
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${TONE[r.action] ?? 'bg-neutral-100 text-ink-600'}`}>
                  {r.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {r.entity}{r.entity_id ? ` #${r.entity_id}` : ''}
                    {r.detail && <span className="font-normal text-ink-600"> — {r.detail}</span>}
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
    </div>
  )
}
