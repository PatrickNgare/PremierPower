import { motion, useReducedMotion } from 'framer-motion'
import { FaStar } from 'react-icons/fa'

/**
 * Fills in once on mount, star by star, settling with a brief warm glow — the
 * same "acknowledged" language as the rest of the site's power motifs, here
 * marking a rating as confirmed rather than just printed.
 *
 * Fires on mount rather than on scroll-into-view: its one usage today sits
 * inside TestimonialsStrip's infinite marquee, which loops continuously
 * rather than entering the viewport once, so a scroll trigger would rarely
 * fire at a moment that means anything.
 */
export default function StarRating({ value = 5, size = 13, className = '' }) {
  const reduce = useReducedMotion()

  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <motion.span
          key={i}
          initial={reduce ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.28 + i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex"
        >
          <FaStar
            size={size}
            className={i < value ? 'text-secondary-accent' : 'text-neutral-300'}
            style={i < value && !reduce ? { filter: 'drop-shadow(0 0 0 rgb(245 201 123 / 0))', animation: `starSettle 900ms ${0.28 + i * 0.07 + 0.1}s ease-out forwards` } : undefined}
            aria-hidden="true"
          />
        </motion.span>
      ))}
    </span>
  )
}
