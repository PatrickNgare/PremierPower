/**
 * Google Analytics 4, only when an ID is configured.
 *
 * Set VITE_GA_ID (e.g. G-XXXXXXXXXX) in Vercel → Project → Settings →
 * Environment Variables and redeploy. Without it nothing is loaded and every
 * call here does nothing, so local builds and previews never send data.
 *
 * Tracked: page views (the app changes pages without reloading, so these are
 * sent by hand), and the actions that mean a lead:
 *   click_call       a tel: link was tapped
 *   click_whatsapp   a wa.me link was tapped
 *   click_email      a mailto: link was tapped
 *   generate_lead    the enquiry form was sent successfully
 * Mark generate_lead (and the click events if wanted) as key events in GA4.
 */
const ID = import.meta.env.VITE_GA_ID

let started = false

export function startAnalytics() {
  if (!ID || started || typeof window === 'undefined') return
  // Never count the CMS or its users.
  if (window.location.pathname.startsWith('/admin')) return
  started = true

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`
  document.head.appendChild(s)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() { window.dataLayer.push(arguments) } // gtag needs the arguments object itself
  window.gtag('js', new Date())
  window.gtag('config', ID, { send_page_view: false })

  // One listener for every call, WhatsApp and email link on the site,
  // including ones the CMS adds later.
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]')
    if (!a) return
    const href = a.getAttribute('href') || ''
    const where = { link_url: href, page_path: window.location.pathname }
    if (href.startsWith('tel:')) track('click_call', where)
    else if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) track('click_whatsapp', where)
    else if (href.startsWith('mailto:')) track('click_email', where)
  }, { capture: true })
}

export function track(name, params = {}) {
  if (!started || !window.gtag) return
  window.gtag('event', name, params)
}

export function pageView(path) {
  if (!started || path.startsWith('/admin')) return
  track('page_view', { page_path: path, page_location: window.location.href, page_title: document.title })
}
