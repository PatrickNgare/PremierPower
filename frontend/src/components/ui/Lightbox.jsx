import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1]

/**
 * Full-screen image viewer.
 *
 * Keyboard is a first-class path, not an afterthought: Escape closes, arrows
 * move between images, and focus is trapped inside the dialog and restored to
 * whatever opened it. Background scroll is locked while open.
 */
export default function Lightbox({ items, index, onClose, onIndex }) {
  const reduce = useReducedMotion()
  const panelRef = useRef(null)
  const restoreTo = useRef(null)
  const open = index !== null && index >= 0

  const go = useCallback(
    (delta) => onIndex((index + delta + items.length) % items.length),
    [index, items.length, onIndex],
  )

  useEffect(() => {
    if (!open) return
    restoreTo.current = document.activeElement

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); return }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); return }
      if (e.key !== 'Tab') return
      // Trap focus: the dialog is modal, so Tab must not escape it.
      const focusable = panelRef.current?.querySelectorAll('button, [href]')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', onKey)

    // Scroll lock that preserves position.
    //
    // Setting overflow:hidden alone collapses the scrollable height, so the
    // browser clamps scrollY to the new maximum and the page visibly jumps
    // upward — measured at up to 284px from a deep scroll position. Pinning
    // the body at a negative offset keeps the page exactly where it was and
    // still prevents scrolling; the offset is restored on close.
    const y = window.scrollY
    const gap = window.innerWidth - document.documentElement.clientWidth
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
    }
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`

    panelRef.current?.focus({ preventScroll: true })

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.position = prev.position
      document.body.style.top = prev.top
      document.body.style.width = prev.width
      document.body.style.paddingRight = prev.paddingRight
      // Restore on the next frame: immediately after unpinning, layout has
      // not settled and scrollTo gets clamped to a stale maximum, landing the
      // page a few dozen pixels short. Smooth behaviour is disabled so the
      // restore does not animate.
      const behavior = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'
      requestAnimationFrame(() => {
        window.scrollTo(0, y)
        document.documentElement.style.scrollBehavior = behavior
      })
      if (restoreTo.current instanceof HTMLElement) restoreTo.current.focus({ preventScroll: true })
    }
  }, [open, onClose, go])

  const item = open ? items[index] : null

  // Rendered into <body>. PageTransition animates transform and filter, which
  // creates a containing block — inside it a `fixed` overlay is positioned
  // against that element and its z-index is scoped to it, so the sticky header
  // painted over the viewer.
  return createPortal(
    <AnimatePresence>
      {open && item && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="absolute inset-0 bg-ink-950/95 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={item.alt || 'Project image'}
            className="relative flex max-h-full w-full max-w-6xl flex-col outline-none"
            initial={reduce ? {} : { scale: 0.96, y: 12 }}
            animate={reduce ? {} : { scale: 1, y: 0 }}
            exit={reduce ? {} : { scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="flex items-start justify-between gap-4 pb-4">
              <div className="min-w-0">
                {item.title && <p className="font-display text-lg font-bold text-white">{item.title}</p>}
                {item.caption && <p className="mt-0.5 truncate text-sm text-ink-300">{item.caption}</p>}
              </div>
              <button
                type="button" onClick={onClose} aria-label="Close image viewer"
                className="shrink-0 rounded-full border border-white/20 p-2.5 text-white transition-colors hover:border-white/60 hover:bg-white/10"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={item.src}
                  src={item.src}
                  alt={item.alt || ''}
                  initial={reduce ? {} : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? {} : { opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  className="max-h-[72vh] w-auto max-w-full rounded-xl object-contain"
                />
              </AnimatePresence>
            </div>

            {items.length > 1 && (
              <div className="flex items-center justify-between gap-4 pt-4">
                <button
                  type="button" onClick={() => go(-1)} aria-label="Previous image"
                  className="rounded-full border border-white/20 p-2.5 text-white transition-colors hover:border-lumen-500 hover:text-lumen-500"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <p className="tabular text-sm text-ink-400" aria-live="polite">
                  {index + 1} / {items.length}
                </p>
                <button
                  type="button" onClick={() => go(1)} aria-label="Next image"
                  className="rounded-full border border-white/20 p-2.5 text-white transition-colors hover:border-lumen-500 hover:text-lumen-500"
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
