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
/* Nothing fires until someone has actually been here a while. Without this the
   listener is armed on the first frame, so a visitor who reaches for their tab
   bar two seconds after landing gets a modal — which reads as a popup ad, not
   as an offer. */
const ARM_AFTER_MS = 15000

/* Storage throws in some privacy modes; a thrown error inside an effect would
   take the whole site down for the sake of a popup. */
const readUntil = () => { try { return Number(localStorage.getItem(KEY) || 0) } catch { return 0 } }
const writeUntil = (v) => { try { localStorage.setItem(KEY, String(v)) } catch { /* nothing to remember */ } }

export default function ExitIntentPopup() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (EXCLUDED.includes(pathname)) return
    if (Date.now() < readUntil()) return

    const onLeave = (e) => {
      // relatedTarget is null only when the pointer leaves the document
      // entirely; without that check any hover onto an iframe or a select
      // popup counts as an exit.
      if (e.clientY <= 0 && !e.relatedTarget) setOpen(true)
    }
    const arm = setTimeout(() => document.addEventListener('mouseout', onLeave), ARM_AFTER_MS)
    return () => {
      clearTimeout(arm)
      document.removeEventListener('mouseout', onLeave)
    }
  }, [pathname])

  const dismiss = () => {
    writeUntil(Date.now() + COOLDOWN_DAYS * 864e5)
    setOpen(false)
  }

  // Escape closes it, and focus moves into the dialog so a keyboard user is
  // not left behind it.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('keydown', onKey)
    document.getElementById('exit-cta')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-primary-dark/60" onClick={dismiss} />
          <motion.div role="dialog" aria-modal="true" aria-labelledby="exit-title"
            className="relative w-full max-w-md rounded-2xl bg-surface p-8 shadow-2xl"
            initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            <button type="button" onClick={dismiss} aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-neutral-100 hover:text-neutral-700">
              <FiX size={19} aria-hidden="true" />
            </button>
            <span className="eyebrow">No obligation</span>
            <h2 id="exit-title" className="mt-3 font-heading text-2xl font-bold text-body">
              Before you go — site visits are free.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Send drawings, a tender document or a short description of the project, and we
              will come back with scope and next steps.
            </p>
            <Button id="exit-cta" to="/contact" variant="primaryLg" className="mt-6 w-full" onClick={dismiss}>
              Request a quote
            </Button>
            <LicenseBadge className="mt-4 w-full justify-center" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
