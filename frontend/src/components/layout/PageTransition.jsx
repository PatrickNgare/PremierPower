import { motion, useReducedMotion } from 'framer-motion'
import { DUR, EASE_OUT, EASE_EXIT } from '@/utils/motion'

/**
 * Route-level entrance. Deliberately short and blur-led rather than a slide:
 * a long page transition delays content the visitor already asked for.
 * Under reduced motion the page simply appears.
 */
export default function PageTransition({ children }) {
  const reduce = useReducedMotion()
  if (reduce) return children

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      // The outgoing page leaves faster than the new one arrives, so the
      // handover never feels like waiting.
      exit={{ opacity: 0, scale: 0.995, filter: 'blur(4px)', transition: { duration: DUR.interaction, ease: EASE_EXIT } }}
      transition={{ duration: DUR.component, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}
