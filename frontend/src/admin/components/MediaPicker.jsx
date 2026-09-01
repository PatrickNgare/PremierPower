import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Image as ImageIcon, Search, Trash2, Upload, X } from 'lucide-react'
import { api } from '../api'
import { Button, EmptyState, Spinner, useToast } from './ui'

/**
 * Choose a photograph, or add one.
 *
 * Deliberately one control rather than two: a client who has just uploaded a
 * photo should not then have to find it in a separate list. Uploading selects
 * the result immediately.
 */
export function MediaPicker({ open, onPick, onClose }) {
  const toast = useToast()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)
  const panelRef = useRef(null)

  const load = useCallback(async (term = '') => {
    setLoading(true)
    try {
      setAssets(await api.get(`/media/library?q=${encodeURIComponent(term)}`))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { if (open) load() }, [open, load])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus({ preventScroll: true })
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Search as you type, but not on every keystroke.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => load(q), 250)
    return () => clearTimeout(t)
  }, [q, open, load])

  const upload = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const asset = await api.upload('/media/image', form)
      toast.ok('Photograph added')
      onPick(asset.url)
      onClose()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const remove = async (asset) => {
    try {
      await api.del(`/media/library/${asset.id}`)
      setAssets((a) => a.filter((x) => x.id !== asset.id))
      toast.ok('Photograph removed')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[65] grid place-items-center bg-ink-950/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Choose a photograph"
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-raise outline-none"
          >
            <header className="flex items-center gap-3 border-b border-neutral-200 p-4">
              <div className="relative flex-1">
                <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Search photographs"
                  aria-label="Search photographs"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-fill focus:bg-surface"
                />
              </div>
              <input
                ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only" onChange={(e) => upload(e.target.files?.[0])}
              />
              <Button variant="primary" busy={busy} onClick={() => fileRef.current?.click()}>
                <Upload size={15} aria-hidden="true" /> Add photograph
              </Button>
              <Button variant="ghost" onClick={onClose} aria-label="Close"><X size={16} /></Button>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? <Spinner label="Loading photographs" />
                : assets.length === 0 ? (
                  <EmptyState
                    icon={ImageIcon}
                    title={q ? 'Nothing matches that' : 'No photographs yet'}
                    body={q ? 'Try a different word.' : 'Add your first photograph to use it across the site.'}
                  />
                ) : (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {assets.map((a) => (
                      <li key={a.id} className="group relative">
                        <button
                          type="button"
                          onClick={() => { onPick(a.url); onClose() }}
                          className="block w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 text-left transition-all duration-200 hover:border-brand-fill hover:shadow-lift focus:outline-none focus-visible:border-brand-fill"
                        >
                          <img
                            src={a.url} alt={a.alt || a.filename}
                            loading="lazy" className="h-28 w-full object-cover"
                          />
                          <span className="block truncate px-2.5 py-2 text-xs text-body-soft">
                            {a.alt || a.filename || 'Untitled'}
                          </span>
                        </button>
                        <button
                          type="button" onClick={() => remove(a)}
                          aria-label={`Delete ${a.filename || 'photograph'}`}
                          className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1.5 text-ink-600 opacity-0 shadow-lift transition-all hover:text-brand-deep focus:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
