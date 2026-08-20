/**
 * Real installation photography is the hero asset. Until the client supplies
 * it, this renders an honest, labelled gap that doubles as the shot list —
 * never stock imagery, never a decorative placeholder pretending to be work.
 */
export default function Photo({ src, alt, brief, ratio = '4 / 3', priority = false, className = '', sizes }) {
  if (!src) {
    return (
      <figure
        className={`relative overflow-hidden rounded-xl border border-dashed border-graphite-900/25 bg-plaster-200 ${className}`}
        style={{ aspectRatio: ratio }}
      >
        <figcaption className="absolute inset-0 flex flex-col justify-end gap-1 p-5">
          <span className="font-mono text-[0.7rem] uppercase tracking-wider text-graphite-500">
            Photograph required
          </span>
          <span className="max-w-sm text-sm leading-snug text-graphite-700">{brief}</span>
        </figcaption>
      </figure>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding={priority ? 'sync' : 'async'}
      className={`rounded-xl object-cover ${className}`}
      style={{ aspectRatio: ratio }}
    />
  )
}
