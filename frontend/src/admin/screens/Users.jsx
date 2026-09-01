import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, UserCog } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Button, Confirm, Spinner, useToast } from '../components/ui'

const ROLES = [
  ['viewer', 'Viewer', 'Can see everything. Cannot change anything.'],
  ['editor', 'Editor', 'Can add, edit, publish and delete content.'],
  ['owner', 'Owner', 'Everything an editor can do, plus managing people.'],
]

export default function Users() {
  const toast = useToast()
  const { admin: me } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [confirming, setConfirming] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await api.get('/admin/users'))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const setRole = async (row, role) => {
    try {
      const next = await api.put(`/admin/users/${row.id}`, {
        name: row.name, role, is_active: row.is_active,
      })
      setRows((rs) => rs.map((r) => (r.id === next.id ? next : r)))
      toast.ok(`${next.email} is now ${role === 'owner' ? 'an owner' : `a ${role}`}`)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const setActive = async (row, is_active) => {
    try {
      const next = await api.put(`/admin/users/${row.id}`, {
        name: row.name, role: row.role, is_active,
      })
      setRows((rs) => rs.map((r) => (r.id === next.id ? next : r)))
      toast.ok(is_active ? 'Access restored' : 'Access removed — signed out immediately')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const remove = async () => {
    try {
      await api.del(`/admin/users/${confirming.id}`)
      setRows((rs) => rs.filter((r) => r.id !== confirming.id))
      setConfirming(null)
      toast.ok('Account deleted')
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (loading) return <Spinner label="Loading people" />

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-body">People</h1>
          <p className="mt-1 text-sm text-muted">Who can sign in, and what they are allowed to do.</p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>
          <Plus size={16} aria-hidden="true" /> Add person
        </Button>
      </div>

      <ul className="mt-6 space-y-2">
        {rows.map((row) => {
          const isMe = row.id === me?.id
          return (
            <li key={row.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-surface p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-body">
                  {row.name || row.email}
                  {isMe && <span className="ml-2 text-xs font-medium text-muted">(you)</span>}
                </p>
                <p className="truncate text-xs text-muted">{row.email}</p>
              </div>

              <select
                value={row.role} onChange={(e) => setRole(row, e.target.value)}
                aria-label={`Role for ${row.email}`}
                disabled={isMe}
                className="rounded-xl border border-neutral-200 bg-surface px-3 py-2 text-sm outline-none transition-all focus:border-brand-fill disabled:bg-neutral-50 disabled:text-muted"
              >
                {ROLES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>

              <Button
                variant={row.is_active ? 'ghost' : 'soft'}
                onClick={() => setActive(row, !row.is_active)}
                disabled={isMe}
              >
                {row.is_active ? 'Suspend' : 'Restore'}
              </Button>

              <button
                type="button" onClick={() => setConfirming(row)} disabled={isMe}
                aria-label={`Delete ${row.email}`}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-brand-deep/10 hover:text-accent disabled:pointer-events-none disabled:opacity-30"
              >
                <Trash2 size={15} />
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-surface p-5">
        <h2 className="flex items-center gap-2 font-display font-bold text-body">
          <UserCog size={16} aria-hidden="true" /> What the roles mean
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          {ROLES.map(([v, label, blurb]) => (
            <div key={v} className="flex gap-3">
              <dt className="w-20 shrink-0 font-semibold text-body-strong">{label}</dt>
              <dd className="text-body-soft">{blurb}</dd>
            </div>
          ))}
        </dl>
      </div>

      <AddPerson open={adding} onClose={() => setAdding(false)} onAdded={load} />

      <Confirm
        open={Boolean(confirming)}
        title="Delete this account?"
        body={confirming ? `${confirming.email} will lose access immediately and permanently.` : ''}
        onConfirm={remove} onCancel={() => setConfirming(null)}
      />
    </div>
  )
}

function AddPerson({ open, onClose, onAdded }) {
  const toast = useToast()
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'editor' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setForm({ email: '', name: '', password: '', role: 'editor' })
  }, [open])

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/admin/users', form)
      toast.ok(`${form.email} can now sign in`)
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input = 'mt-1.5 w-full rounded-xl border border-neutral-200 bg-surface px-3.5 py-2.5 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/45 p-5 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-label="Add a person"
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-raise">
        <h2 className="font-display text-lg font-bold text-body">Add a person</h2>
        <div className="mt-5 space-y-3">
          <div>
            <label htmlFor="np-email" className="text-sm font-semibold text-body-strong">Email address</label>
            <input id="np-email" type="email" required className={input}
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label htmlFor="np-name" className="text-sm font-semibold text-body-strong">Name</label>
            <input id="np-name" className={input}
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="np-pass" className="text-sm font-semibold text-body-strong">Temporary password</label>
            <input id="np-pass" type="text" required minLength={10} className={input}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <p className="mt-1 text-xs text-muted">
              At least 10 characters. They can change it once signed in.
            </p>
          </div>
          <div>
            <label htmlFor="np-role" className="text-sm font-semibold text-body-strong">Role</label>
            <select id="np-role" className={input}
              value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" busy={busy}>Add person</Button>
        </div>
      </form>
    </div>
  )
}
