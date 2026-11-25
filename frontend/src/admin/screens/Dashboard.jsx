import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle, ArrowRight, FolderPlus, ImagePlus, Inbox, LayoutTemplate, PackagePlus, TrendingUp,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Spinner, StatusPill } from '../components/ui'

/** The jobs people actually come in for, one click each. */
const ACTIONS = [
  { to: '/admin/c/projects?new=1', label: 'Add a project', hint: 'A finished installation', icon: FolderPlus, editor: true },
  { to: '/admin/c/products?new=1', label: 'Add a product', hint: 'A light or fitting', icon: PackagePlus, editor: true },
  { to: '/admin/media', label: 'Upload photos', hint: 'Into the photo library', icon: ImagePlus },
  { to: '/admin/homepage', label: 'Edit the home page', hint: 'Slideshow and blocks', icon: LayoutTemplate },
]

const card = 'rounded-2xl border border-line bg-surface/80 p-5 shadow-lift backdrop-blur-xl'

export default function Dashboard() {
  const { admin, can } = useAuth()
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    let alive = true
    Promise.all([
      api.get('/leads').catch(() => []),
      api.get('/notifications?limit=6').catch(() => []),
      api.get('/settings/all').catch(() => []),
      api.get('/stats').catch(() => null),
    ]).then(([leads, notes, settings, counts]) => {
      if (!alive) return
      setState({ loading: false, leads, notes, settings, counts })
    })
    return () => { alive = false }
  }, [])

  if (state.loading) return <Spinner label="Loading your dashboard" />

  const { leads, notes, settings, counts } = state
  const email = counts?.email
  const open = leads.filter((l) => l.status === 'new').length
  // Settings the client has still not supplied. Surfaced here rather than
  // buried, because an empty NCA number is a launch blocker, not a detail.
  const blanks = settings.filter((s) => !String(s.value).trim())

  const stats = [
    { label: 'New enquiries', value: open, to: '/admin/inbox', icon: Inbox },
    { label: 'Enquiries in total', value: leads.length, to: '/admin/inbox', icon: TrendingUp },
    { label: 'Details still needed', value: blanks.length, to: '/admin/settings', icon: AlertTriangle },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-body">
        {admin?.name ? `Hello, ${admin.name.split(' ')[0]}` : 'Hello'}
      </h1>
      <p className="mt-1 text-sm text-muted">What would you like to do?</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ACTIONS.filter((x) => !x.editor || can('editor')).map((x, i) => (
          <motion.div
            key={x.to}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to={x.to}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand-fill/40 hover:shadow-raise sm:p-5"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-fill/10 text-accent transition-colors group-hover:bg-brand-fill group-hover:text-white">
                <x.icon size={19} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display font-bold text-body">{x.label}</span>
                <span className="mt-0.5 block text-xs text-muted sm:text-sm">{x.hint}</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      <h2 className="mt-9 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">Waiting for you</h2>

      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to={s.to} className={`${card} block transition-shadow hover:shadow-raise`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted">{s.label}</p>
                <s.icon size={16} className="text-muted" aria-hidden="true" />
              </div>
              <p className="tabular mt-2 font-display text-3xl font-extrabold text-body">{s.value}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-body">Latest enquiries</h2>
            <Link to="/admin/inbox" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
              All <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
          {leads.length === 0
            ? <p className="mt-4 text-sm text-muted">Nothing yet. Enquiries from the website arrive here.</p>
            : (
              <ul className="mt-4 space-y-2.5">
                {leads.slice(0, 5).map((l) => (
                  <li key={l.id}>
                    <Link to="/admin/inbox" className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 transition-colors hover:border-neutral-300">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-body">{l.name}</p>
                        <p className="truncate text-xs text-muted">
                          {[l.company, l.project_type, l.phone].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <StatusPill on={l.status !== 'new'} onLabel={l.status.replace('_', ' ')} offLabel="New" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </section>

        <section className={card}>
          <h2 className="font-display font-bold text-body">Recent activity</h2>
          {notes.length === 0
            ? <p className="mt-4 text-sm text-muted">Nothing to report.</p>
            : (
              <ul className="mt-4 space-y-2.5">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl border border-neutral-200 p-3">
                    <p className="text-sm font-semibold text-body">{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p>}
                  </li>
                ))}
              </ul>
            )}
        </section>
      </div>

      {email && !email.configured && (
        <section className="mt-4 rounded-2xl border border-brand-deep/25 bg-brand-deep/[0.04] p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <h2 className="font-display font-bold text-body">
                Nobody is being emailed about enquiries
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-body-soft">
                {email.unsent > 0
                  ? `${email.unsent} ${email.unsent === 1 ? 'enquiry has' : 'enquiries have'} arrived and
                     been saved, but no email was sent for any of them.`
                  : 'Enquiries will be saved and shown here, but no email will be sent.'}
                {' '}Set <span className="font-medium">SMTP_PASSWORD</span> in the server
                environment{email.notify ? <> so they reach <span className="font-medium">{email.notify}</span></> : null}.
              </p>
            </div>
          </div>
        </section>
      )}

      {blanks.length > 0 && (
        <section className="mt-4 rounded-2xl border border-lumen-700/25 bg-lumen-100 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-lumen-700" aria-hidden="true" />
            <div>
              <h2 className="font-display font-bold text-body">
                {blanks.length} company {blanks.length === 1 ? 'detail is' : 'details are'} still blank
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-body-soft">
                The site hides anything you have not supplied rather than inventing it. Fill these
                in and they appear everywhere at once:{' '}
                <span className="font-medium">{blanks.slice(0, 4).map((b) => b.key).join(', ')}</span>
                {blanks.length > 4 && ` and ${blanks.length - 4} more`}.
              </p>
              <Link to="/admin/settings" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                Fill them in <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
