import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import { fadeUp, stagger } from '@/utils/motion'
import TextReveal from './TextReveal'
import { fallbackToLocal } from '@/utils/photo'

/** The banner every interior page opens with, matching one rhythm. */
export default function PageHero({ eyebrow, title, lede, crumb, image, imageAlt = '' }) {
  return (
    <section className="on-dark relative overflow-hidden bg-primary-dark">
      {image && (
        <>
          <img onError={fallbackToLocal}
            src={image} alt={imageAlt} aria-hidden={imageAlt ? undefined : 'true'}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager" fetchPriority="high" decoding="async"
          />
          {/* Same scrim discipline as the main hero: the text column has to
              stay legible whatever the photograph underneath is doing. */}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/70 to-black/40" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 z-[2] w-1.5 bg-secondary"
      />
      <motion.div
        variants={stagger()} initial="hidden" animate="show"
        className="container-x relative z-[2] py-16 md:py-24"
      >
        {crumb && (
          <motion.nav variants={fadeUp} aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs text-white/55">
            <Link to="/" className="hover:text-white">Home</Link>
            <FiChevronRight size={12} aria-hidden="true" />
            <span className="text-white/80">{crumb}</span>
          </motion.nav>
        )}
        {eyebrow && <motion.span variants={fadeUp} className="eyebrow">{eyebrow}</motion.span>}
        <TextReveal
          as="h1" text={title}
          className="mt-3 block max-w-3xl text-4xl font-bold leading-[1.08] text-white sm:text-5xl"
        />
        {lede && (
          <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            {lede}
          </motion.p>
        )}
      </motion.div>
    </section>
  )
}
