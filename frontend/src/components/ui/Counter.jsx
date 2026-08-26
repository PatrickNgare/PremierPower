import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

/**
 * Counts up once when the number enters the viewport. Under reduced motion it
 * simply renders the final value — a number ticking is decoration, not
 * information.
 */
export default function Counter({ value, duration = 1600, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()

  // Split "500+" into the number and whatever decorates it.
  const match = String(value).match(/^(\D*)([\d.,]+)(.*)$/)
  const prefix = match?.[1] ?? ''
  const target = match ? Number(match[2].replace(/,/g, '')) : null
  const suffix = match?.[3] ?? ''

  // Starts at the target so the value is correct before the ramp runs and
  // if the animation never starts (reduced motion, never scrolled into view).
  const [n, setN] = useState(target ?? 0)

  useEffect(() => {
    if (target === null || !inView || reduce) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      // Ease-out cubic: fast first, settles gently.
      setN(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduce, target, duration])

  if (target === null) return <span ref={ref} className={className}>{value}</span>

  return (
    <span ref={ref} className={`tabular ${className}`}>
      {prefix}{n.toLocaleString()}{suffix}
    </span>
  )
}
