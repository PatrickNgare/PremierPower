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
      {/* The chase itself — amber, because the channel is the action. */}
      <path
        d={d}
        stroke="var(--color-amber-500)"
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
      {outlets.map((o, i) => (
        <circle
          key={i}
          cx={o.x}
          cy={o.y}
          r="3.5"
          fill="var(--color-plaster-100)"
          stroke="var(--color-graphite-700)"
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
