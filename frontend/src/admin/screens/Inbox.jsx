import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Inbox as InboxIcon, Mail, Phone, Search, Trash2, X } from 'lucide-react'
import { api } from '../api'
import { Button, Confirm, EmptyState, Spinner, useToast } from '../components/ui'

const STAGES = [
  ['new', 'New'], ['in_progress', 'In progress'], ['quoted', 'Quoted'],
  ['won', 'Won'], ['lost', 'Lost'],
]

const TONE = {
  new: 'bg-brand-fill/10 text-brand-deep',
  in_progress: 'bg-lumen-100 text-lumen-700',
  quoted: 'bg-neutral-100 text-ink-700',
  won: 'bg-earth-ink/10 text-earth-ink',
  lost: 'bg-neutral-100 text-ink-400',
}

export default function Inbox() {
  const toast = useToast()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [stage, setStage] = useState('')
  const [open, setOpen] = useState(null)
  const [confirming, setConfirming] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (stage) params.set('status_filter', stage)
      setLeads(await api.get(`/leads?${params}`))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [q, stage, toast])

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  // Opening the inbox is the moment these stop being unread.
  useEffect(() => { api.post('/notifications/read-all').catch(() => {}) }, [])

  const update = async (lead, patch) => {
    try {
      const next = await api.patch(`/leads/${lead.id}`, {
        status: patch.status ?? lead.status,
        notes: patch.notes ?? lead.notes ?? '',
      })
      setLeads((ls) => ls.map((l) => (l.id === next.id ? next : l)))
      setOpen((o) => (o && o.id === next.id ? next : o))
      toast.ok('Updated')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const remove = async () => {
    try {
      await api.del(`/leads/${confirming.id}`)
      setLeads((ls) => ls.filter((l) => l.id !== confirming.id))
      setConfirming(null)
      setOpen(null)
      toast.ok('Deleted')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink-900">Enquiries</h1>
      <p className="mt-1 text-sm text-ink-400">
        Everything submitted through the website. What people wrote cannot be edited — only the
        stage and your own notes.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, company, phone or message"
            aria-label="Search enquiries"
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10"
          />
        </div>
        <div className="flex flex-wrap rounded-xl border border-neutral-200 bg-white p-1">
          <button
            type="button" onClick={() => setStage('')}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              stage === '' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-neutral-100'
            }`}
          >All</button>
          {STAGES.map(([v, label]) => (
            <button
              key={v} type="button" onClick={() => setStage(v)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                stage === v ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-neutral-100'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {loading ? <Spinner />
          : leads.length === 0 ? (
            <EmptyState
              icon={InboxIcon}
              title={q || stage ? 'Nothing matches' : 'No enquiries yet'}
              body={q || stage
                ? 'Try clearing the search or the stage filter.'
                : 'When someone fills in a form on the website, it appears here.'}
            />
          ) : (
            <ul className="space-y-2">
              {leads.map((l) => (
                <li key={l.id}>
                  <button
                    type="button" onClick={() => setOpen(l)}
                    className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 text-left transition-colors hover:border-neutral-300"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink-900">{l.name}</p>
                      <p className="truncate text-xs text-ink-400">
                        {[l.company, l.project_type, l.area].filter(Boolean).join(' · ') || l.phone}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${TONE[l.status] ?? TONE.new}`}>
                      {(STAGES.find(([v]) => v === l.status)?.[1]) ?? l.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
      </div>

      <Detail
        lead={open} onClose={() => setOpen(null)}
        onUpdate={update} onDelete={() => setConfirming(open)}
      />

      <Confirm
        open={Boolean(confirming)}
        title="Delete this enquiry?"
        body={confirming ? `The enquiry from ${confirming.name} will be permanently removed.` : ''}
        onConfirm={remove} onCancel={() => setConfirming(null)}
      />
    </div>
  )
}

function Detail({ lead, onClose, onUpdate, onDelete }) {
  const [notes, setNotes] = useState('')
  useEffect(() => { setNotes(lead?.notes ?? '') }, [lead])

  useEffect(() => {
    if (!lead) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lead, onClose])

  return (
    <AnimatePresence>
      {lead && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end bg-ink-950/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            role="dialog" aria-modal="true" aria-label={`Enquiry from ${lead.name}`}
            className="flex h-full w-full max-w-lg flex-col bg-paper shadow-raise"
          >
            <header className="flex items-start justify-between gap-3 border-b border-neutral-200 bg-white px-6 py-4">
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-bold text-ink-900">{lead.name}</h2>
                {lead.company && <p className="truncate text-sm text-ink-400">{lead.company}</p>}
              </div>
              <Button variant="ghost" onClick={onClose} aria-label="Close"><X size={17} /></Button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div className="flex flex-wrap gap-2">
                {lead.phone && (
                  <a href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-ink-800 shadow-lift transition-shadow hover:shadow-raise">
                    <Phone size={14} aria-hidden="true" /> {lead.phone}
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-ink-800 shadow-lift transition-shadow hover:shadow-raise">
                    <Mail size={14} aria-hidden="true" /> {lead.email}
                  </a>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-sm">
                {[
                  ['Type', lead.kind], ['Project', lead.project_type], ['Area', lead.area],
                  ['Property', lead.property],
                  ['Received', lead.created_at ? new Date(lead.created_at).toLocaleString() : ''],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-ink-400">{k}</dt>
                    <dd className="mt-0.5 font-medium text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>

              {lead.message && (
                <div>
                  <h3 className="text-sm font-semibold text-ink-800">What they wrote</h3>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-4 text-sm leading-relaxed text-ink-700">
                    {lead.message}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-ink-800">Stage</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STAGES.map(([v, label]) => (
                    <button
                      key={v} type="button" onClick={() => onUpdate(lead, { status: v })}
                      className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                        lead.status === v ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 shadow-lift hover:text-ink-900'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="lead-notes" className="text-sm font-semibold text-ink-800">Your notes</label>
                <textarea
                  id="lead-notes" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Quoted 14 March, waiting on drawings…"
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10"
                />
                <Button
                  className="mt-2" onClick={() => onUpdate(lead, { notes })}
                  disabled={notes === (lead.notes ?? '')}
                >Save notes</Button>
              </div>
            </div>

            <footer className="flex justify-between border-t border-neutral-200 bg-white px-6 py-4">
              <Button variant="danger" onClick={onDelete}>
                <Trash2 size={15} aria-hidden="true" /> Delete
              </Button>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
