import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Save } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Button, Spinner, useToast } from '../components/ui'

/**
 * Company details, one row per setting.
 *
 * The keys and their notes are seeded by the backend, so this screen never
 * invents a field — it renders whatever the API says the client still owes,
 * with the note explaining what each one is.
 */
export default function Settings() {
  const toast = useToast()
  const { can } = useAuth()
  const editable = can('editor')
  const [rows, setRows] = useState([])
  const [dirty, setDirty] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await api.get('/settings/all'))
      setDirty({})
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const saveAll = async () => {
    const changed = Object.entries(dirty)
    if (changed.length === 0) return
    setSaving(true)
    try {
      for (const [key, value] of changed) {
        const row = rows.find((r) => r.key === key)
        // Keyed by name, not id: the endpoint upserts on the key, so posting
        // an id here silently created a new setting called "5".
        await api.put(`/settings/${encodeURIComponent(row.key)}`, {
          key: row.key, value, note: row.note,
        })
      }
      toast.ok(`Saved ${changed.length} ${changed.length === 1 ? 'detail' : 'details'}`)
      load()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading company details" />

  const valueOf = (row) => (row.key in dirty ? dirty[row.key] : row.value)
  const blanks = rows.filter((r) => !String(valueOf(r)).trim())
  const changedCount = Object.keys(dirty).length

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Company details</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            These appear across the whole site. Anything left blank is hidden rather than
            guessed at — the site will not invent a licence number or a phone line.
          </p>
        </div>
        {editable && (
          <Button variant="primary" onClick={saveAll} busy={saving} disabled={changedCount === 0}>
            <Save size={15} aria-hidden="true" />
            {changedCount ? `Save ${changedCount} change${changedCount === 1 ? '' : 's'}` : 'Saved'}
          </Button>
        )}
      </div>

      {blanks.length > 0 && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-lumen-700/25 bg-lumen-100 p-4">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-lumen-700" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-ink-700">
            <span className="font-semibold">{blanks.length} still blank.</span>{' '}
            Each blank one is simply left off the site until you fill it in.
          </p>
        </div>
      )}

      <ul className="mt-5 space-y-2">
        {rows.map((row) => {
          const value = valueOf(row)
          const empty = !String(value).trim()
          return (
            <li key={row.id} className={`rounded-xl border bg-white p-4 ${empty ? 'border-lumen-700/30' : 'border-neutral-200'}`}>
              <label htmlFor={`s-${row.key}`} className="block text-sm font-semibold text-ink-800">
                {row.key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
              </label>
              {row.note && <p className="mt-1 text-xs leading-relaxed text-muted">{row.note}</p>}
              <input
                id={`s-${row.key}`} value={value} disabled={!editable}
                onChange={(e) => setDirty((d) => ({ ...d, [row.key]: e.target.value }))}
                placeholder="Not supplied yet"
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10 disabled:bg-neutral-50"
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
