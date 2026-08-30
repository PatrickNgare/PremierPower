import { useRef } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { DUR, EASE_OUT } from '@/utils/motion'
import { fallbackToLocal } from '@/utils/photo'

/**
 * Uncovers a photograph on scroll: a mask lifts while the image itself settles
 * back from a slight overscale, so the picture appears to be revealed rather
 * than to fade in. Optional scroll-linked drift keeps it alive as it passes.
 *
 * The element that is watched is deliberately not the element that is
 * clipped. IntersectionObserver measures visible area after clipping, so a
 * mask of inset(0 0 100% 0) makes its own element report a ratio of zero — the
 * observer that would lift the mask can never fire, and the photograph stays
 * invisible forever. It read as an image that had failed to load. Watching an
 * unclipped outer wrapper and clipping an inner one breaks the deadlock.
 *
 * Under reduced motion it is a plain image.
 */
export default function ImageReveal({
  src, alt = '', className = '', imgClassName = '', drift = 0, priority = false, sizes,
}) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const shown = useInView(ref, { once: true, amount: 0.25 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], drift ? [`${drift}%`, `${-drift}%`] : ['0%', '0%'])

  if (reduce) {
    return (
      <div ref={ref} className={`overflow-hidden ${className}`}>
        <img src={src} alt={alt} sizes={sizes} loading={priority ? 'eager' : 'lazy'} decoding="async"
          onError={fallbackToLocal}
          className={`h-full w-full object-cover ${imgClassName}`} />
      </div>
    )
  }

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
        animate={{ clipPath: shown ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' }}
        transition={{ duration: DUR.cinematic, ease: EASE_OUT }}
        className="h-full w-full"
      >
        <motion.img
          src={src} alt={alt} sizes={sizes}
          loading={priority ? 'eager' : 'lazy'} decoding="async"
          onError={fallbackToLocal}
          style={drift ? { y } : undefined}
          initial={{ scale: 1.14 }}
          animate={{ scale: shown ? 1 : 1.14 }}
          transition={{ duration: DUR.sweep, ease: EASE_OUT }}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      </motion.div>
    </div>
  )
}
