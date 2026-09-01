import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Cloud, HardDrive, Image as ImageIcon, Search, Trash2, Upload } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Button, Confirm, EmptyState, Spinner, useToast } from '../components/ui'

/** The photograph library. Alt text is editable here because it is almost
 *  always written badly in the rush of uploading, and a wrong description is
 *  worse than a late one. */
export default function Media() {
  const toast = useToast()
  const { can } = useAuth()
  const editable = can('editor')
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const [editingAlt, setEditingAlt] = useState({})
  const [storage, setStorage] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    api.get('/media/storage').then(setStorage).catch(() => { /* a badge is not worth an error */ })
  }, [])

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

  useEffect(() => {
    const t = setTimeout(() => load(q), q ? 250 : 0)
    return () => clearTimeout(t)
  }, [q, load])

  const upload = async (files) => {
    if (!files?.length) return
    setBusy(true)
    let added = 0
    try {
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        await api.upload('/media/image', form)
        added += 1
      }
      toast.ok(`${added} photograph${added === 1 ? '' : 's'} added`)
      load(q)
    } catch (e) {
      // Report what did land before the failure, or the client re-uploads
      // everything and ends up with duplicates.
      toast.error(added ? `${added} added, then: ${e.message}` : e.message)
      if (added) load(q)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const saveAlt = async (asset) => {
    const alt = editingAlt[asset.id]
    if (alt === undefined || alt === asset.alt) return
    try {
      const next = await api.put(`/media/library/${asset.id}`, {
        alt, folder: asset.folder ?? '', tags: asset.tags ?? '',
      })
      setAssets((a) => a.map((x) => (x.id === next.id ? next : x)))
      setEditingAlt((e) => { const { [asset.id]: _, ...rest } = e; return rest })
      toast.ok('Description saved')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const remove = async () => {
    try {
      await api.del(`/media/library/${confirming.id}`)
      setAssets((a) => a.filter((x) => x.id !== confirming.id))
      setConfirming(null)
      toast.ok('Photograph deleted')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-body">Photographs</h1>
          <p className="mt-1 text-sm text-muted">
            Every image used across the site. Describe each one — it is read aloud to visitors
            using a screen reader, and shown if the image fails to load.
          </p>
        </div>
        {editable && (
          <>
            <input
              ref={fileRef} type="file" multiple className="sr-only"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => upload([...(e.target.files ?? [])])}
            />
            <Button variant="primary" busy={busy} onClick={() => fileRef.current?.click()}>
              <Upload size={16} aria-hidden="true" /> Add photographs
            </Button>
          </>
        )}
      </div>

      {storage && <StorageBadge storage={storage} />}

      <div className="relative mt-6 max-w-md">
        <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or description" aria-label="Search photographs"
          className="w-full rounded-xl border border-neutral-200 bg-surface py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10"
        />
      </div>

      <div className="mt-5">
        {loading ? <Spinner label="Loading photographs" />
          : assets.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title={q ? 'Nothing matches that' : 'No photographs yet'}
              body={q ? 'Try a different word.' : 'Add your first photograph to use it across the site.'}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 12) * 0.03, duration: 0.35 }}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-surface"
                >
                  <div className="relative">
                    <img src={a.url} alt={a.alt || a.filename} loading="lazy"
                      className="h-40 w-full bg-neutral-50 object-cover" />
                    {editable && (
                      <button
                        type="button" onClick={() => setConfirming(a)}
                        aria-label={`Delete ${a.filename || 'photograph'}`}
                        className="absolute right-2 top-2 rounded-lg bg-white/90 p-2 text-ink-600 shadow-lift transition-colors hover:text-brand-deep"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <input
                      value={editingAlt[a.id] ?? a.alt ?? ''}
                      disabled={!editable}
                      onChange={(e) => setEditingAlt((s) => ({ ...s, [a.id]: e.target.value }))}
                      onBlur={() => saveAlt(a)}
                      placeholder="Describe this photograph"
                      aria-label={`Description for ${a.filename}`}
                      className="w-full rounded-lg border border-neutral-200 bg-surface px-2.5 py-2 text-sm outline-none transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10 disabled:bg-neutral-50"
                    />
                    <p className="mt-1.5 truncate text-xs text-muted">
                      {a.filename || a.url} · {Math.round((a.bytes ?? 0) / 1024)} KB
                      {a.width ? ` · ${a.width}×${a.height}` : ''}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
      </div>

      <Confirm
        open={Boolean(confirming)}
        title="Delete this photograph?"
        body="It will disappear from anywhere on the site that uses it. This cannot be undone."
        onConfirm={remove} onCancel={() => setConfirming(null)}
      />
    </div>
  )
}

/** Where uploads land. Worth stating plainly: the difference between a CDN and
 *  a container volume is invisible until the day the volume is lost. */
function StorageBadge({ storage }) {
  const onCloud = storage.backend === 'cloudinary'
  const Icon = onCloud ? Cloud : HardDrive
  return (
    <div className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${
      onCloud ? 'border-earth-ink/25 bg-earth-ink/[0.04]' : 'border-neutral-200 bg-surface'
    }`}>
      <Icon size={17} aria-hidden="true" className={`mt-0.5 shrink-0 ${onCloud ? 'text-earth-ink' : 'text-muted'}`} />
      <div className="text-sm leading-relaxed">
        {onCloud ? (
          <p className="text-body-mid">
            <span className="font-semibold text-body">Stored on Cloudinary</span>
            {storage.cloud_name && <span className="text-muted"> · {storage.cloud_name}</span>}
            {' — '}served from their CDN and converted to the best format each browser
            supports.
          </p>
        ) : (
          <p className="text-body-mid">
            <span className="font-semibold text-body">Stored on this server</span>
            {' — '}photographs live on the container volume.
            {storage.missing?.length > 0 && (
              <> To use Cloudinary instead, set{' '}
                <span className="font-medium">{storage.missing.join(', ')}</span> and restart.</>
            )}
          </p>
        )}
        <p className="mt-1 text-xs text-muted">
          Up to {storage.max_upload_mb}MB per photograph.
          {onCloud && storage.documents_backend === 'local' && (
            <> PDFs are kept on this server — Cloudinary blocks PDF delivery until it is
              switched on in their console.</>
          )}
        </p>
      </div>
    </div>
  )
}
