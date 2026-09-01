import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell, ExternalLink, Eye, FileText, Image as ImageIcon, Inbox, LayoutDashboard,
  LayoutTemplate, LogOut, Menu as MenuIcon, Package, ScrollText, Settings, Users,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { collections, GROUPS } from '../schema'
import { Button, useToast } from './ui'
import Logo from '@/components/layout/Logo'
import { useTheme } from '@/hooks/useTheme'
import ThemeToggle from '@/components/ui/ThemeToggle'

const ICONS = {
  banners: LayoutTemplate, sectors: LayoutTemplate, services: FileText,
  projects: ImageIcon, 'product-categories': Package, products: Package,
  testimonials: FileText, faqs: FileText, blog: FileText, team: Users,
  documents: ScrollText, social: ExternalLink, seo: FileText,
}

/** Everything not driven by the collections schema. */
const FIXED = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/inbox', label: 'Enquiries', icon: Inbox },
  { to: '/admin/homepage', label: 'Home page', icon: LayoutTemplate, group: 'Pages' },
  { to: '/admin/pages/services', label: 'Services page', icon: FileText, group: 'Pages' },
  { to: '/admin/pages/products', label: 'Lighting & fittings page', icon: FileText, group: 'Pages' },
  { to: '/admin/pages/portfolio', label: 'Installations page', icon: FileText, group: 'Pages' },
  { to: '/admin/pages/safety', label: 'Safety page', icon: FileText, group: 'Pages' },
  { to: '/admin/pages/about', label: 'About page', icon: FileText, group: 'Pages' },
  { to: '/admin/pages/testimonials', label: 'Reviews page', icon: FileText, group: 'Pages' },
  { to: '/admin/pages/faq', label: 'FAQ page', icon: FileText, group: 'Pages' },
  { to: '/admin/pages/contact', label: 'Contact page', icon: FileText, group: 'Pages' },
  { to: '/admin/menus', label: 'Navigation', icon: MenuIcon, group: 'Site' },
  { to: '/admin/media', label: 'Photographs', icon: ImageIcon, group: 'Site' },
  { to: '/admin/settings', label: 'Company details', icon: Settings, group: 'Site' },
  { to: '/admin/users', label: 'People', icon: Users, group: 'Site', owner: true },
  { to: '/admin/audit', label: 'Activity log', icon: ScrollText, group: 'Site', owner: true },
]

export function Shell({ children }) {
  const { isDark } = useTheme()
  const { admin, signOut, can } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

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

  const groups = GROUPS.map((group) => ({
    group,
    items: [
      ...FIXED.filter((f) => f.group === group && (!f.owner || can('owner')))
        .map((f) => ({ ...f, key: f.to })),
      ...Object.entries(collections)
        .filter(([, def]) => def.group === group)
        .map(([key, def]) => ({
          key, to: `/admin/c/${key}`, label: def.title, icon: ICONS[key] ?? FileText,
        })),
    ],
  })).filter((g) => g.items.length > 0)

  const nav = (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <div className="px-2 py-3"><Logo tone={isDark ? 'dark' : 'light'} /></div>

      {FIXED.filter((f) => !f.group).map((f) => (
        <NavItem key={f.to} {...f} />
      ))}

      {groups.map(({ group, items }) => (
        <div key={group} className="mt-5">
          <p className="px-3 pb-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
            {group}
          </p>
          {items.map((item) => <NavItem key={item.key} {...item} />)}
        </div>
      ))}

      <div className="mt-auto border-t border-neutral-200 pt-3">
        <div className="px-3 pb-2">
          <p className="truncate text-sm font-semibold text-body">{admin?.name || admin?.email}</p>
          <p className="text-xs capitalize text-muted">{admin?.role}</p>
        </div>
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
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to} end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-ink-900 text-white' : 'text-body-soft hover:bg-neutral-100 hover:text-body'
        }`
      }
    >
      <Icon size={16} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}
