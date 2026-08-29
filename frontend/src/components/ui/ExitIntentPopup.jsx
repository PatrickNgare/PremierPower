import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import Button from './Button'
import LicenseBadge from './LicenseBadge'

const KEY = 'pp-exit-dismissed'
const COOLDOWN_DAYS = 30
/* Never interrupt someone already converting. */
const EXCLUDED = ['/contact']

export default function ExitIntentPopup() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (EXCLUDED.includes(pathname)) return
    const until = Number(localStorage.getItem(KEY) || 0)
    if (Date.now() < until) return

    const onLeave = (e) => { if (e.clientY <= 0) setOpen(true) }
    document.addEventListener('mouseout', onLeave)
    return () => document.removeEventListener('mouseout', onLeave)
  }, [pathname])

  const dismiss = () => {
    localStorage.setItem(KEY, String(Date.now() + COOLDOWN_DAYS * 864e5))
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-primary-dark/60" onClick={dismiss} />
          <motion.div role="dialog" aria-modal="true" aria-labelledby="exit-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
            initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            <button type="button" onClick={dismiss} aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-neutral-100 hover:text-neutral-700">
              <FiX size={19} aria-hidden="true" />
            </button>
            <span className="eyebrow">No obligation</span>
            <h2 id="exit-title" className="mt-3 font-heading text-2xl font-bold text-primary">
              Before you go — the assessment is free.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              We open the board, test what is there, photograph what we find, and put the
              findings in writing. Including the parts that are fine.
            </p>
            <Button to="/contact" variant="primaryLg" className="mt-6 w-full" onClick={dismiss}>
              Book my free assessment
            </Button>
            <LicenseBadge className="mt-4 w-full justify-center" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
