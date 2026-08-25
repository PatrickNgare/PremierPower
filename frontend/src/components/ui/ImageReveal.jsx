import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { DUR, EASE_OUT } from '@/utils/motion'

/**
 * Uncovers a photograph on scroll: a mask lifts while the image itself settles
 * back from a slight overscale, so the picture appears to be revealed rather
 * than to fade in. Optional scroll-linked drift keeps it alive as it passes.
 *
 * Under reduced motion it is a plain image.
 */
export default function ImageReveal({
  src, alt = '', className = '', imgClassName = '', drift = 0, priority = false, sizes,
}) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], drift ? [`${drift}%`, `${-drift}%`] : ['0%', '0%'])

  if (reduce) {
    return (
      <div ref={ref} className={`overflow-hidden ${className}`}>
        <img src={src} alt={alt} sizes={sizes} loading={priority ? 'eager' : 'lazy'} decoding="async"
          className={`h-full w-full object-cover ${imgClassName}`} />
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={{
        // The mask itself: full cover to nothing.
        hidden: { clipPath: 'inset(0% 0% 100% 0%)' },
        show: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: DUR.cinematic, ease: EASE_OUT } },
      }}
      className={`overflow-hidden ${className}`}
    >
      <motion.img
        src={src} alt={alt} sizes={sizes}
        loading={priority ? 'eager' : 'lazy'} decoding="async"
        style={drift ? { y } : undefined}
        variants={{
          hidden: { scale: 1.14 },
          show: { scale: 1, transition: { duration: DUR.sweep, ease: EASE_OUT } },
        }}
        className={`h-full w-full object-cover ${imgClassName}`}
      />
    </motion.div>
  )
}
