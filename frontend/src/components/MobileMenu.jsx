import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { navLinks } from './navLinks'
import Button from './Button'
import LicenseBadge from './LicenseBadge'
import { CloseIcon } from './Icons'

export default function MobileMenu({ open, onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-ink-900/45" onClick={onClose} />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="paper absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col p-6 outline-none"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="self-end rounded-lg p-2 text-ink-800 transition-colors hover:bg-ink-900/[0.06]"
            >
              <CloseIcon />
            </button>

            <ul className="mt-4 flex flex-col">
              {navLinks.map((l) => (
                <li key={l.to} className="border-b border-ink-900/10">
                  <Link
                    to={l.to}
                    onClick={onClose}
                    className="block py-4 font-display text-xl text-ink-900"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Button to="/contact" size="lg" className="mt-8 w-full" onClick={onClose}>
              Book a free site assessment
            </Button>
            <LicenseBadge className="mt-5 self-start" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
