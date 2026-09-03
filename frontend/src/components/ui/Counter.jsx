import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

/**
 * Counts up once when the number enters the viewport. Under reduced motion it
 * simply renders the final value — a number ticking is decoration, not
 * information.
 *
 * Glows once as it settles on its final value — confirmation that the ramp is
 * done, the same "acknowledged" language as the rest of the site's power
 * motifs (see PowerOnRule.jsx, the form's success pulse). Skipped under
 * reduced motion along with the count itself, since there is no settle to
 * mark when the value simply appears.
 */
export default function Counter({ value, duration = 1600, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const [settled, setSettled] = useState(false)

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
      else setSettled(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduce, target, duration])

  if (target === null) return <span ref={ref} className={className}>{value}</span>

  return (
    <span
      ref={ref}
      className={`tabular ${className}`}
      style={settled ? { animation: 'numberSettle 900ms ease-out' } : undefined}
    >
      {prefix}{n.toLocaleString()}{suffix}
    </span>
  )
}
