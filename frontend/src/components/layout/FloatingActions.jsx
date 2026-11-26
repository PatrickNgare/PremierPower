import { Link, useLocation } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import { FiPhone, FiCalendar } from 'react-icons/fi'
import { whatsappLink, telLink } from '@/config/site'
import { useSite } from '@/hooks/useSite'

/**
 * Sticky bottom bar on small screens — more visible than a single FAB for a
 * decision this consequential. A quiet WhatsApp button on desktop.
 *
 * Every tap target answers the press. On the bar only the icon dips (plus a
 * tint): scaling the whole cell would drag its divider line with it.
 */
export default function FloatingActions() {
  const site = useSite()
  const { pathname } = useLocation()
  const wa = whatsappLink(site)
  const tel = telLink(site)
  const onContact = pathname === '/contact'

  return (
    <>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer"
          aria-label="Message Premier Power on WhatsApp"
          className="fixed bottom-6 right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-95 motion-reduce:active:scale-100 lg:flex">
          <FaWhatsapp size={27} aria-hidden="true" />
        </a>
      )}

      {!onContact && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-surface/97 backdrop-blur-sm lg:hidden">
            <div className="grid grid-cols-3 divide-x divide-neutral-200">
              {tel ? (
                <a href={tel} className="flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold text-neutral-700 transition-colors duration-150 active:bg-surface-2 [&>svg]:transition-transform [&>svg]:duration-150 [&>svg]:ease-out active:[&>svg]:scale-90 motion-reduce:active:[&>svg]:scale-100">
                  <FiPhone size={19} aria-hidden="true" /> Call
                </a>
              ) : (
                <span className="flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold text-muted">
                  <FiPhone size={19} aria-hidden="true" /> Call
                </span>
              )}
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold text-neutral-700 transition-colors duration-150 active:bg-surface-2 [&>svg]:transition-transform [&>svg]:duration-150 [&>svg]:ease-out active:[&>svg]:scale-90 motion-reduce:active:[&>svg]:scale-100">
                  <FaWhatsapp size={19} aria-hidden="true" /> WhatsApp
                </a>
              ) : (
                <span className="flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold text-muted">
                  <FaWhatsapp size={19} aria-hidden="true" /> WhatsApp
                </span>
              )}
              <Link to="/contact" className="flex flex-col items-center gap-1 bg-secondary-dark py-2.5 text-[0.7rem] font-bold text-white active:brightness-110 [&>svg]:transition-transform [&>svg]:duration-150 [&>svg]:ease-out active:[&>svg]:scale-90 motion-reduce:active:[&>svg]:scale-100">
                <FiCalendar size={19} aria-hidden="true" /> Get a quote
              </Link>
            </div>
          </div>
          <div aria-hidden="true" className="h-16 lg:hidden" />
        </>
      )}
    </>
  )
}
