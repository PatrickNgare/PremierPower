import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Check, Info, Loader2, X } from 'lucide-react'

/* ── Toasts ──────────────────────────────────────────────────────────── */

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const dismiss = useCallback((id) => setItems((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setItems((t) => [...t, { id, message, tone }])
    // Errors stay longer, but not forever: a message left standing covered
    // whatever sat under it until someone found its close button.
    setTimeout(() => dismiss(id), tone === 'error' ? 9000 : 4000)
  }, [dismiss])

  const value = useMemo(() => ({
    ok: (m) => push(m, 'ok'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Top centre, below the header. Bottom right sat exactly on the Save
          button of the editing panel, so a "please fill in" message blocked
          the very button needed to try again. */}
      <div className="pointer-events-none fixed left-1/2 top-20 z-[60] flex w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.16 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 pr-2.5 shadow-raise backdrop-blur-xl ${
                t.tone === 'error'
                  ? 'border-brand-deep/25 bg-surface/95 text-accent'
                  : t.tone === 'info'
                    ? 'border-neutral-200 bg-surface/95 text-body-mid'
                    : 'border-earth-ink/25 bg-surface/95 text-earth-ink'
              }`}
              role={t.tone === 'error' ? 'alert' : 'status'}
            >
              <span className="mt-0.5 shrink-0">
                {t.tone === 'error' ? <AlertTriangle size={16} />
                  : t.tone === 'info' ? <Info size={16} /> : <Check size={16} />}
              </span>
              <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
              <button
                type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss"
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-neutral-100 hover:text-body-mid"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

/* ── Buttons ─────────────────────────────────────────────────────────── */

const VARIANTS = {
  primary: 'bg-brand-fill text-white hover:bg-brand-deep shadow-lift',
  soft: 'bg-neutral-100 text-body-strong hover:bg-neutral-200',
  ghost: 'text-body-soft hover:bg-neutral-100 hover:text-body',
  danger: 'bg-surface text-accent border border-brand-deep/30 hover:bg-brand-deep hover:text-white',
}

export function Button({ variant = 'soft', busy, className = '', children, ...rest }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold
        transition-all duration-200 active:scale-[0.98]
        disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    >
      {busy && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {children}
    </button>
  )
}

/* ── Small pieces ────────────────────────────────────────────────────── */

export function StatusPill({ on, onLabel = 'Published', offLabel = 'Draft' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${
      on ? 'bg-earth-ink/10 text-earth-ink' : 'bg-neutral-100 text-muted'
    }`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-earth-ink' : 'bg-ink-400'}`} />
      {on ? onLabel : offLabel}
    </span>
  )
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-sm text-muted" role="status">
      <Loader2 size={17} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
      {label}…
    </div>
  )
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 px-6 py-16 text-center">
      {Icon && <Icon size={26} className="mb-4 text-muted" aria-hidden="true" />}
      <p className="font-display text-lg font-bold text-body">{title}</p>
      {body && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/* ── Confirm ─────────────────────────────────────────────────────────── */

/**
 * Deletions ask first, and the dialog names what is about to go. "Delete this
 * item?" is not a question anyone can answer safely.
 */
export function Confirm({ open, title, body, confirmLabel = 'Delete', onConfirm, onCancel, busy }) {
  const reduce = useReducedMotion()
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus({ preventScroll: true })
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center bg-ink-950/45 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
        >
          <motion.div
            ref={panelRef} tabIndex={-1} role="alertdialog" aria-modal="true" aria-label={title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-raise outline-none"
          >
            <h2 className="font-display text-lg font-bold text-body">{title}</h2>
            {body && <p className="mt-2 text-sm leading-relaxed text-body-soft">{body}</p>}
            <div className="mt-7 flex justify-end gap-2.5">
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button variant="danger" onClick={onConfirm} busy={busy}>{confirmLabel}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
