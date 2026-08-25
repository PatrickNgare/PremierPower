import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { navLinks } from './navLinks'
import Logo from './Logo'
import Button from '@/components/ui/Button'
import LicenseBadge from '@/components/ui/LicenseBadge'
import { whatsappLink } from '@/config/site'

export default function MobileMenu({ open, onClose }) {
  const panelRef = useRef(null)
  const wa = whatsappLink()

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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-primary-dark/55" onClick={onClose} />
          <motion.div
            ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Menu"
            className="absolute inset-y-0 right-0 flex w-[min(23rem,88vw)] flex-col bg-white p-6 outline-none"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
          >
            <div className="flex items-center justify-between">
              <Logo className="h-9" />
              <button type="button" onClick={onClose} aria-label="Close menu"
                className="rounded-lg p-2 text-primary transition-colors hover:bg-neutral-100">
                <FiX size={22} aria-hidden="true" />
              </button>
            </div>

            <ul className="mt-6 flex flex-col overflow-y-auto">
              {navLinks.map((l) => (
                <li key={l.to} className="border-b border-neutral-100">
                  <Link to={l.to} onClick={onClose}
                    className="block py-3.5 font-heading text-lg font-medium text-primary hover:text-secondary-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-6">
              <Button to="/contact" variant="primaryLg" className="w-full" onClick={onClose}>
                Request a quote
              </Button>
              {wa && (
                <Button href={wa} variant="outline" className="mt-3 w-full" target="_blank" rel="noopener noreferrer">
                  <FaWhatsapp size={17} aria-hidden="true" /> WhatsApp us
                </Button>
              )}
              <LicenseBadge className="mt-5 w-full justify-center" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
