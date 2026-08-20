import { useEffect, useRef, useState } from 'react'

/**
 * The chase route — the one authored motion moment on the site.
 *
 * An orthogonal run, drawn the way a chase is marked out: straight drops,
 * square turns, a tick at each outlet. It draws itself in once when it comes
 * into view. Under reduced motion it is already drawn.
 */
export default function ChaseRoute({
  d,
  className = '',
  viewBox = '0 0 100 400',
  outlets = [],
  duration = 1600,
}) {
  const ref = useRef(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setDrawn(true); return }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setDrawn(true); io.disconnect() } },
      { rootMargin: '-10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <svg
      ref={ref}
      className={className}
      viewBox={viewBox}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* The chase itself — brand red, because the channel is the action. */}
      <path
        d={d}
        stroke="var(--color-brand-red)"
        strokeWidth="2"
        strokeLinecap="square"
        vectorEffect="non-scaling-stroke"
        pathLength="1"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: drawn ? 0 : 1,
          transition: `stroke-dashoffset ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      />
      {/* Outlets are ticks, not dots: the viewBox is stretched to the section
          height, which would squash a circle into an ellipse. */}
      {outlets.map((o, i) => (
        <line
          key={i}
          x1={o.x - 6}
          x2={o.x + 6}
          y1={o.y}
          y2={o.y}
          stroke="var(--color-ink-700)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          style={{
            opacity: drawn ? 1 : 0,
            transition: `opacity 400ms ease-out ${duration * (o.at ?? (i + 1) / (outlets.length + 1))}ms`,
          }}
        />
      ))}
    </svg>
  )
}
