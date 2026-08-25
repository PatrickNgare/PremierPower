import { motion, useReducedMotion } from 'framer-motion'

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
      initial={{ opacity: 0, y: 12, filter: 'blur(5px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
