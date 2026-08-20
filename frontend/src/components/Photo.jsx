import { useState } from 'react'
import { DEMO } from '../config/demo'

/**
 * Real installation photography is the hero asset. Until the client supplies
 * it, this renders an honest, labelled gap that doubles as the shot list —
 * never stock imagery, never a decorative placeholder pretending to be work.
 *
 * In demo mode the gap is filled so layout reads at full density, but it still
 * says "sample" on it. Drop files into public/demo/ (see config/demo.js) and
 * they are used instead; a missing or broken file falls back to the block
 * rather than showing a broken image.
 */
export default function Photo({
  src, demoSrc, alt, brief, ratio = '4 / 3', priority = false, className = '', sizes,
}) {
  const [failed, setFailed] = useState(false)
  const resolved = failed ? null : src || (DEMO ? demoSrc : null)

  if (!resolved) {
    return (
      <figure
        className={`relative overflow-hidden rounded-xl border border-graphite-900/20 ${
          DEMO ? 'border-solid bg-plaster-300' : 'border-dashed bg-plaster-200'
        } ${className}`}
        style={{ aspectRatio: ratio }}
      >
        <figcaption className="absolute inset-0 flex flex-col justify-end gap-1 p-5">
          <span className="font-mono text-[0.7rem] uppercase tracking-wider text-graphite-500">
            {DEMO ? 'Sample image' : 'Photograph required'}
          </span>
          <span className="max-w-sm text-sm leading-snug text-graphite-700">{brief}</span>
        </figcaption>
      </figure>
    )
  }

  return (
    <img
      src={resolved}
      alt={alt}
      sizes={sizes}
      onError={() => setFailed(true)}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding={priority ? 'sync' : 'async'}
      className={`rounded-xl object-cover ${className}`}
      style={{ aspectRatio: ratio }}
    />
  )
}
