import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Bell, ExternalLink, Eye, KeyRound, LogOut, Menu as MenuIcon } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { NAV, sectionOf, tabsFor } from '../nav'
import { Button, useToast } from './ui'
import Logo from '@/components/layout/Logo'
import { useTheme } from '@/hooks/useTheme'
import ThemeToggle from '@/components/ui/ThemeToggle'

export function Shell({ children }) {
  const { isDark } = useTheme()
  const { admin, signOut, can } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [pwOpen, setPwOpen] = useState(false)

  // Close the mobile drawer whenever the route changes, or it stays open
  // covering the page the client just chose.
  useEffect(() => { setOpen(false) }, [location.pathname])

  const refreshUnread = useCallback(() => {
    api.get('/notifications/unread-count')
      .then((r) => setUnread(r.count))
      .catch(() => { /* the bell is not worth an error message */ })
  }, [])

  useEffect(() => {
    refreshUnread()
    const t = setInterval(refreshUnread, 60000)
    return () => clearInterval(t)
  }, [refreshUnread])

  const preview = async () => {
    try {
      const { token } = await api.post('/preview/token')
      window.open(`/?preview=${encodeURIComponent(token)}`, '_blank', 'noopener')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const current = sectionOf(location.pathname)

  const nav = (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <div className="px-2 py-3"><Logo tone={isDark ? 'dark' : 'light'} /></div>

      <div className="mt-2 space-y-1">
        {NAV.map((item) => (
          <NavItem key={item.key} {...item} active={current === item.key} />
        ))}
      </div>

      <div className="mt-auto border-t border-neutral-200 pt-3">
        <div className="px-3 pb-2">
          <p className="truncate text-sm font-semibold text-body">{admin?.name || admin?.email}</p>
          <p className="text-xs capitalize text-muted">{admin?.role}</p>
        </div>
        <button
          type="button" onClick={() => setPwOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-body-soft transition-colors hover:bg-neutral-100 hover:text-body"
        >
          <KeyRound size={16} aria-hidden="true" /> Change password
        </button>
        <button
          type="button" onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-body-soft transition-colors hover:bg-neutral-100 hover:text-body"
        >
          <LogOut size={16} aria-hidden="true" /> Sign out
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-page-warm">
      <ChangePassword open={pwOpen} onClose={() => setPwOpen(false)} onDone={signOut} />
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-neutral-200 bg-surface lg:block">
        {nav}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          >
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="h-full w-72 bg-surface"
            >
              {nav}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-surface/85 px-4 py-3 backdrop-blur-xl sm:px-6">
          <button
            type="button" onClick={() => setOpen(true)} aria-label="Open menu"
            className="rounded-xl p-2 text-body-mid transition-colors hover:bg-neutral-100 lg:hidden"
          >
            <MenuIcon size={19} />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={preview} title="Open the site with drafts visible">
              <Eye size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Preview drafts</span>
            </Button>
            <a
              href="/" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-body-soft transition-colors hover:bg-neutral-100 hover:text-body"
            >
              <ExternalLink size={15} aria-hidden="true" />
              <span className="hidden sm:inline">View site</span>
            </a>
            <ThemeToggle variant="bare" />

            <Link
              to="/admin/inbox"
              className="relative rounded-xl p-2.5 text-body-soft transition-colors hover:bg-neutral-100 hover:text-body"
              aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-fill px-1 text-[0.6rem] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="px-4 py-7 sm:px-6 lg:px-9">
          <div className="mx-auto max-w-6xl">
            <SectionTabs path={location.pathname} owner={can('owner')} />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function NavItem({ to, label, icon: Icon, active }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition-colors ${
        active ? 'bg-ink-900 text-white' : 'text-body-soft hover:bg-neutral-100 hover:text-body'
      }`}
    >
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

/**
 * The tabs above a screen that belongs to a section: Products and Categories,
 * the settings screens, the home page and its slideshow. Pages also get a way
 * back to the list of pages.
 */
function SectionTabs({ path, owner }) {
  const tabs = tabsFor(path)?.filter((t) => !t.owner || owner)
  const inPages = sectionOf(path) === 'pages' && path !== '/admin/pages'

  if (!tabs && !inPages) return null

  return (
    <div className="mb-6">
      {inPages && (
        <Link
          to="/admin/pages"
          className="group mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-body-soft hover:text-body"
        >
          <ArrowLeft size={15} aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5" />
          All pages
        </Link>
      )}
      {tabs && (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <nav aria-label="In this section" className="flex w-max gap-1 rounded-2xl border border-line bg-surface p-1">
            {tabs.map((t) => (
              <NavLink
                key={t.to} to={t.to} end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-ink-900 text-white' : 'text-body-soft hover:bg-neutral-100 hover:text-body'
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}

/**
 * Change your own password. Changing it signs out every session, this one
 * included (the server bumps the token version), so the dialog says so and
 * then returns to the sign-in page.
 */
function ChangePassword({ open, onClose, onDone }) {
  const toast = useToast()
  const [form, setForm] = useState({ current: '', next: '', again: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) { setForm({ current: '', next: '', again: '' }); setError('') }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    if (form.next.length < 10) return setError('The new password needs at least 10 characters.')
    if (form.next !== form.again) return setError('The two new passwords do not match.')
    if (form.next === form.current) return setError('Choose a password different from the current one.')
    setError('')
    setBusy(true)
    try {
      await api.post('/admin/change-password', { current_password: form.current, new_password: form.next })
      toast.ok('Password changed. Sign in again with the new one.')
      onClose()
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input = 'mt-1.5 w-full rounded-xl border border-neutral-200 bg-surface px-3.5 py-2.5 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/45 p-5 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="cp-title"
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-raise">
        <h2 id="cp-title" className="font-display text-lg font-bold text-body">Change password</h2>
        <p className="mt-1 text-sm text-muted">You will be signed out everywhere and asked to sign in again.</p>
        <div className="mt-5 space-y-3">
          <div>
            <label htmlFor="cp-current" className="text-sm font-semibold text-body-strong">Current password</label>
            <input id="cp-current" type="password" required autoComplete="current-password" autoFocus className={input}
              value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
          </div>
          <div>
            <label htmlFor="cp-next" className="text-sm font-semibold text-body-strong">New password</label>
            <input id="cp-next" type="password" required minLength={10} autoComplete="new-password" className={input}
              value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
            <p className="mt-1 text-xs text-muted">At least 10 characters.</p>
          </div>
          <div>
            <label htmlFor="cp-again" className="text-sm font-semibold text-body-strong">New password again</label>
            <input id="cp-again" type="password" required autoComplete="new-password" className={input}
              value={form.again} onChange={(e) => setForm({ ...form, again: e.target.value })} />
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-brand-deep/8 px-3.5 py-2.5 text-sm font-medium text-accent">{error}</p>
        )}
        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" busy={busy}>Change password</Button>
        </div>
      </form>
    </div>
  )
}
