/**
 * Loading placeholder. Shaped like the thing it stands in for, so the layout
 * does not jump when content arrives. The sweep is a background animation
 * rather than a transform, so it never triggers layout.
 */
export function Skeleton({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-lg bg-ink-900/[0.06] motion-safe:animate-shimmer ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(90deg, transparent 0%, rgb(8 8 10 / 0.05) 45%, rgb(245 201 123 / 0.14) 50%, rgb(8 8 10 / 0.05) 55%, transparent 100%)',
        backgroundSize: '220% 100%',
      }}
    />
  )
}

/** A card-shaped skeleton, for grids waiting on the API. */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-[var(--radius-card)] border border-ink-900/[0.07] bg-white p-6 ${className}`}>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="mt-5 h-3.5 w-2/3" />
      <Skeleton className="mt-2.5 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  )
}

/** Announced politely so a screen reader knows something is coming. */
export function LoadingRegion({ label = 'Loading', children }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
