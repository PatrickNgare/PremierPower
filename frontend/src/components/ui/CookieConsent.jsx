import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { OPEN_CONSENT, analyticsConfigured, getConsent, setConsent } from '@/utils/analytics'

/**
 * The cookie notice. Google Analytics loads only after "Accept"; "Decline"
 * keeps the site exactly as it is, with nothing tracked. Asked once per
 * browser, and reopened from "Cookie settings" in the footer.
 *
 * Not shown at all when the build has no analytics ID, since there is then
 * nothing to agree to. Sits bottom-left, clear of the WhatsApp button, and
 * above the call/WhatsApp/quote bar on phones.
 */
export default function CookieConsent() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(() => analyticsConfigured && getConsent() === null)

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener(OPEN_CONSENT, show)
    return () => window.removeEventListener(OPEN_CONSENT, show)
  }, [])

  if (!analyticsConfigured) return null
  const choose = (c) => { setConsent(c); setOpen(false) }
  // The bottom bar is hidden on the contact page, so the notice can sit lower there.
  const above = pathname === '/contact' ? 'bottom-4' : 'bottom-[4.75rem]'

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          role="region" aria-label="Cookie notice"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed inset-x-4 ${above} z-40 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-raise sm:inset-x-auto sm:left-6 sm:max-w-sm lg:bottom-6`}
        >
          <p className="text-sm leading-relaxed text-body-soft">
            We use Google Analytics cookies to see which pages are useful, only if you agree.{' '}
            <Link to="/privacy" className="font-semibold text-accent underline-offset-2 hover:underline">Privacy policy</Link>
          </p>
          <div className="mt-4 flex gap-2.5">
            <button type="button" onClick={() => choose('granted')} className="btn-primary flex-1 justify-center py-2.5 text-sm">
              Accept
            </button>
            <button type="button" onClick={() => choose('denied')} className="btn-outline flex-1 justify-center py-2.5 text-sm">
              Decline
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
