import { useRef } from 'react'
import { useInView } from 'framer-motion'

/**
 * A conductor that powers on when it scrolls into view.
 *
 * The site's argument is "Powering spaces" — so its one signature motion is a
 * circuit closing: a cold hairline warms to lit and a charge runs its length,
 * once. It is a thin band, placed under a section heading, and it is the only
 * place this effect appears. Restraint is the point; a page full of travelling
 * charges would read as a toy, not a contractor.
 *
 * All the animation lives in CSS on `[data-lit]` (see .power-rule in
 * index.css). This component only decides when to flip the attribute, and
 * `useInView(..., { once: true })` means it fires a single time. Under
 * prefers-reduced-motion the CSS resolves straight to the lit end-state with
 * no travelling charge, so nothing moves.
 */
export default function PowerOnRule({ className = '' }) {
  const ref = useRef(null)
  const lit = useInView(ref, { once: true, amount: 0.8 })

  return (
    <div
      ref={ref}
      data-lit={lit}
      className={`power-rule ${className}`}
      role="presentation"
      aria-hidden="true"
    />
  )
}
