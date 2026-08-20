import { useLocation } from 'react-router-dom'
import { whatsappLink, telLink, site, isPending } from '../config/site'
import { PhoneIcon, WhatsAppIcon } from './Icons'

/**
 * Sticky bottom bar on small screens — more visible than a single FAB for a
 * decision this consequential. A quiet WhatsApp button on desktop.
 */
export default function FloatingActions() {
  const { pathname } = useLocation()
  const wa = whatsappLink()
  const tel = telLink()
  const onContact = pathname === '/contact'

  return (
    <>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message PremierPower on WhatsApp"
          className="fixed bottom-6 right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-ink-800 text-paper-100 shadow-[0_6px_20px_-6px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:-translate-y-0.5 lg:flex"
        >
          <WhatsAppIcon width="26" height="26" />
        </a>
      )}

      {!onContact && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-900/12 bg-paper-50/95 backdrop-blur-sm lg:hidden">
          <div className="grid grid-cols-3 divide-x divide-ink-900/10">
            {tel ? (
              <a href={tel} className="flex flex-col items-center gap-1 py-3 text-xs text-ink-700">
                <PhoneIcon width="20" height="20" /> Call
              </a>
            ) : (
              <span className="flex flex-col items-center gap-1 py-3 text-xs text-ink-400">
                <PhoneIcon width="20" height="20" /> Call
              </span>
            )}
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 py-3 text-xs text-ink-700">
                <WhatsAppIcon width="20" height="20" /> WhatsApp
              </a>
            ) : (
              <span className="flex flex-col items-center gap-1 py-3 text-xs text-ink-400">
                <WhatsAppIcon width="20" height="20" /> WhatsApp
              </span>
            )}
            <a href="/contact" className="flex items-center justify-center bg-red-600 px-2 text-center text-xs font-semibold text-paper-50">
              Free assessment
            </a>
          </div>
        </div>
      )}
      {!onContact && <div aria-hidden="true" className="h-16 lg:hidden" />}
    </>
  )
}
