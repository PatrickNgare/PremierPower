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
 *
 * Consent first. Nothing loads, and no cookie is set, until the visitor
 * accepts in the cookie notice (components/ui/CookieConsent.jsx). The choice
 * is kept in this browser; "Cookie settings" in the footer reopens the notice.
 * See the Privacy page (/privacy) for what is collected.
 */
const ID = import.meta.env.VITE_GA_ID
const CONSENT_KEY = 'pp-analytics-consent'

/** True when this build has an analytics ID, i.e. there is anything to consent to. */
export const analyticsConfigured = Boolean(ID)

let started = false

/** 'granted', 'denied', or null when the visitor has not chosen yet. */
export function getConsent() {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch { return null }
}

export function setConsent(choice) {
  try { localStorage.setItem(CONSENT_KEY, choice) } catch { /* not remembered; asked again next visit */ }
  if (choice === 'granted') {
    if (ID) window[`ga-disable-${ID}`] = false
    startAnalytics()
    pageView(window.location.pathname)
  } else if (ID) {
    // Stop anything already running this visit, and clear what it stored.
    window[`ga-disable-${ID}`] = true
    const host = window.location.hostname.replace(/^www\./, '')
    for (const c of document.cookie.split(';')) {
      const name = c.split('=')[0].trim()
      if (name === '_ga' || name.startsWith('_ga_')) {
        for (const domain of ['', `; domain=.${host}`]) {
          document.cookie = `${name}=; Max-Age=0; path=/${domain}`
        }
      }
    }
  }
}

/** Ask the cookie notice to show again (the footer's "Cookie settings"). */
export const OPEN_CONSENT = 'pp:open-consent'
export const reopenConsent = () => window.dispatchEvent(new Event(OPEN_CONSENT))

export function startAnalytics() {
  if (!ID || started || typeof window === 'undefined') return
  if (getConsent() !== 'granted') return
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
