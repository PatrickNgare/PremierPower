import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

/**
 * Pulls its child gently toward the cursor. A pointer affordance only — it is
 * disabled on touch, where there is no cursor to attract, and under
 * prefers-reduced-motion.
 */
export default function Magnetic({ children, strength = 0.32, className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const [fine, setFine] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const apply = () => setFine(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (!fine || reduce) return
    const el = ref.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      x.set((e.clientX - (r.left + r.width / 2)) * strength)
      y.set((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const reset = () => { x.set(0); y.set(0) }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', reset)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', reset)
    }
  }, [fine, reduce, strength, x, y])

  return (
    <motion.span
      ref={ref}
      style={fine && !reduce ? { x: sx, y: sy } : undefined}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.span>
  )
}
