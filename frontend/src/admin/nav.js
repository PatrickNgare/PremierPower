import {
  FolderKanban, Image as ImageIcon, Inbox, LayoutDashboard, LayoutTemplate, Package, Settings,
} from 'lucide-react'

/*
 * How the CMS is arranged, in one place.
 *
 * Seven links, named for what someone comes in to do, not for how the data is
 * stored. Screens that used to be links of their own now sit as tabs under the
 * link they belong to. The routes themselves are unchanged, so an old
 * bookmark still opens the same screen, now with its tabs above it.
 *
 * Team, Documents and Social links are deliberately absent: the public
 * site shows none of them, so editing them changed nothing. Their routes still
 * work (/admin/c/team etc.) for the day the site grows those sections.
 */

export const NAV = [
  { key: 'home', to: '/admin', label: 'Home', icon: LayoutDashboard, end: true },
  { key: 'inbox', to: '/admin/inbox', label: 'Enquiries', icon: Inbox, match: ['/admin/inbox'] },
  {
    key: 'pages', to: '/admin/pages', label: 'Website pages', icon: LayoutTemplate,
    match: ['/admin/pages', '/admin/homepage', '/admin/c/banners', '/admin/c/blog'],
  },
  { key: 'projects', to: '/admin/c/projects', label: 'Projects', icon: FolderKanban, match: ['/admin/c/projects'] },
  {
    key: 'products', to: '/admin/c/products', label: 'Products', icon: Package,
    match: ['/admin/c/products', '/admin/c/product-categories'],
  },
  { key: 'media', to: '/admin/media', label: 'Photos', icon: ImageIcon, match: ['/admin/media'] },
  {
    key: 'settings', to: '/admin/settings', label: 'Settings', icon: Settings,
    match: [
      '/admin/settings', '/admin/menus', '/admin/users', '/admin/audit',
      '/admin/c/services', '/admin/c/sectors', '/admin/c/testimonials', '/admin/c/faqs', '/admin/c/seo',
    ],
  },
]

/** Tabs shown above the screens of a section. */
export const TABS = {
  pages: [
    { to: '/admin/pages', label: 'Pages' },
    { to: '/admin/c/blog', label: 'Insights articles' },
  ],
  products: [
    { to: '/admin/c/products', label: 'Products' },
    { to: '/admin/c/product-categories', label: 'Categories' },
  ],
  homepage: [
    { to: '/admin/homepage', label: 'Sections' },
    { to: '/admin/c/banners', label: 'Slideshow photos' },
  ],
  settings: [
    { to: '/admin/settings', label: 'Company details' },
    { to: '/admin/menus', label: 'Menu' },
    { to: '/admin/c/services', label: 'Services' },
    { to: '/admin/c/sectors', label: 'Sectors' },
    { to: '/admin/c/testimonials', label: 'Reviews' },
    { to: '/admin/c/faqs', label: 'FAQs' },
    { to: '/admin/c/seo', label: 'SEO' },
    { to: '/admin/users', label: 'People', owner: true },
    { to: '/admin/audit', label: 'Activity log', owner: true },
  ],
}

const under = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`)

/** Which sidebar link a path belongs to. */
export function sectionOf(path) {
  if (path === '/admin' || path === '/admin/') return 'home'
  return NAV.find((n) => n.match?.some((m) => under(path, m)))?.key ?? null
}

/** The tab row for a path, if it has one. */
export function tabsFor(path) {
  if (under(path, '/admin/homepage') || under(path, '/admin/c/banners')) return TABS.homepage
  if (path === '/admin/pages' || under(path, '/admin/c/blog')) return TABS.pages
  const section = sectionOf(path)
  // A single page's editor has the "All pages" link instead of tabs.
  if (section === 'pages') return null
  return TABS[section] ?? null
}
