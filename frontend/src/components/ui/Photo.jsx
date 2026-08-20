import { useState } from 'react'
import { DEMO } from '@/config/demo'

/**
 * Real installation photography is the hero asset. Until the client supplies
 * it, this renders an honest, labelled gap that doubles as the shot list —
 * never stock imagery. In demo mode the gap is filled but still says "sample".
 */
export default function Photo({
  src, demoSrc, alt, brief, ratio = '4 / 3', priority = false,
  className = '', sizes, kenBurns = false,
}) {
  const [failed, setFailed] = useState(false)
  const resolved = failed ? null : src || (DEMO ? demoSrc : null)

  if (!resolved) {
    return (
      <figure
        className={`relative overflow-hidden rounded-xl border ${
          DEMO ? 'border-neutral-300 bg-neutral-200' : 'border-dashed border-neutral-300 bg-neutral-100'
        } ${className}`}
        style={{ aspectRatio: ratio }}
      >
        <figcaption className="absolute inset-0 flex flex-col justify-end gap-1 p-5">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-neutral-500">
            {DEMO ? 'Sample image' : 'Photograph required'}
          </span>
          <span className="max-w-sm text-sm leading-snug text-neutral-600">{brief}</span>
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
      className={`rounded-xl object-cover ${kenBurns ? 'animate-ken-burns' : ''} ${className}`}
      style={{ aspectRatio: ratio }}
    />
  )
}
