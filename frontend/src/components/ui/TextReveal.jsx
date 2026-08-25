import { motion, useReducedMotion } from 'framer-motion'
import { DUR, EASE_OUT } from '@/utils/motion'

/**
 * Reveals a heading line by line from behind a mask, the way type is uncovered
 * rather than faded in. Splits on words and lets them wrap naturally, so the
 * text stays selectable and readable to assistive technology as one string.
 *
 * Under reduced motion it renders as plain text with no wrapper at all.
 */
export default function TextReveal({ text, as: Tag = 'span', className = '', delay = 0, stagger = 0.045 }) {
  const reduce = useReducedMotion()
  if (reduce) return <Tag className={className}>{text}</Tag>

  const words = String(text).split(' ')

  return (
    <Tag className={className}>
      {/* One accessible string; the animated pieces are hidden from readers. */}
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden="true"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
        className="inline"
      >
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
            <motion.span
              variants={{
                hidden: { y: '110%' },
                show: { y: '0%', transition: { duration: DUR.entrance, ease: EASE_OUT } },
              }}
              className="inline-block"
            >
              {word}
              {i < words.length - 1 && ' '}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}
