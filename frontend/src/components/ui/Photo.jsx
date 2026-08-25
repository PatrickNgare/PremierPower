import { useState } from 'react'
import { DEMO } from '@/config/demo'

/**
 * Real installation photography is the hero asset. Until the client supplies
 * it, this renders an honest, labelled gap that doubles as the shot list —
 * never stock imagery. In demo mode the gap is filled but still says "sample".
 *
 * `fill` makes it cover its positioned parent, for full-bleed hero use.
 */
export default function Photo({
  src, demoSrc, alt, brief, ratio = '4 / 3', priority = false,
  className = '', sizes, kenBurns = false, fill = false, tone = 'light',
}) {
  const [failed, setFailed] = useState(false)
  const resolved = failed ? null : src || (DEMO ? demoSrc : null)
  const dark = tone === 'dark' || fill
  const box = fill ? { position: 'absolute', inset: 0 } : { aspectRatio: ratio }

  if (!resolved) {
    return (
      <figure
        className={`relative overflow-hidden border ${fill ? '' : 'rounded-xl'} ${
          dark
            ? 'border-white/10 bg-primary-dark'
            : DEMO ? 'border-neutral-300 bg-neutral-200' : 'border-dashed border-neutral-300 bg-neutral-100'
        } ${className}`}
        style={box}
      >
        <figcaption className={`absolute inset-0 flex flex-col justify-end gap-1 ${fill ? 'p-8 pb-40 md:p-14 md:pb-44' : 'p-5'}`}>
          <span className={`text-[0.68rem] font-bold uppercase tracking-[0.16em] ${dark ? 'text-white/40' : 'text-neutral-500'}`}>
            {DEMO ? 'Sample image' : 'Photograph required'}
          </span>
          <span className={`max-w-sm text-sm leading-snug ${dark ? 'text-white/55' : 'text-neutral-600'}`}>{brief}</span>
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
      className={`object-cover object-center ${fill ? 'absolute inset-0 h-full w-full' : 'rounded-xl'} ${kenBurns ? 'animate-ken-burns' : ''} ${className}`}
      style={fill ? undefined : { aspectRatio: ratio }}
    />
  )
}
