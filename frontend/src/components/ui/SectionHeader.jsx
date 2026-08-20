import { motion } from 'framer-motion'
import { fadeUp } from '@/utils/motion'

export default function SectionHeader({ eyebrow, title, lede, align = 'left', tone = 'light', className = '' }) {
  const centered = align === 'center'
  return (
    <motion.header
      variants={fadeUp}
      className={`${centered ? 'mx-auto text-center' : ''} max-w-2xl ${className}`}
    >
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className={`mt-3 text-3xl font-bold leading-[1.15] sm:text-4xl ${tone === 'dark' ? 'text-white' : 'text-primary'}`}>
        {title}
      </h2>
      {lede && (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${tone === 'dark' ? 'text-white/70' : 'text-neutral-600'}`}>
          {lede}
        </p>
      )}
    </motion.header>
  )
}
