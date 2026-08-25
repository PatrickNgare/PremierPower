import { useLocation } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import { FiPhone, FiCalendar } from 'react-icons/fi'
import { whatsappLink, telLink } from '@/config/site'

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
        <a href={wa} target="_blank" rel="noopener noreferrer"
          aria-label="Message Premier Power on WhatsApp"
          className="fixed bottom-6 right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 lg:flex">
          <FaWhatsapp size={27} aria-hidden="true" />
        </a>
      )}

      {!onContact && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/97 backdrop-blur-sm lg:hidden">
            <div className="grid grid-cols-3 divide-x divide-neutral-200">
              {tel ? (
                <a href={tel} className="flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold text-neutral-700">
                  <FiPhone size={19} aria-hidden="true" /> Call
                </a>
              ) : (
                <span className="flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold text-neutral-400">
                  <FiPhone size={19} aria-hidden="true" /> Call
                </span>
              )}
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold text-neutral-700">
                  <FaWhatsapp size={19} aria-hidden="true" /> WhatsApp
                </a>
              ) : (
                <span className="flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold text-neutral-400">
                  <FaWhatsapp size={19} aria-hidden="true" /> WhatsApp
                </span>
              )}
              <a href="/contact" className="flex flex-col items-center gap-1 bg-secondary-dark py-2.5 text-[0.7rem] font-bold text-white">
                <FiCalendar size={19} aria-hidden="true" /> Get a quote
              </a>
            </div>
          </div>
          <div aria-hidden="true" className="h-16 lg:hidden" />
        </>
      )}
    </>
  )
}
