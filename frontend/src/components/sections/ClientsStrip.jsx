import { motion } from 'framer-motion'
import { useSectionItems } from '@/hooks/useSection'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { cdnWidth } from '@/utils/photo'

/**
 * Clients and partners, as a quiet row of logos — the proof a developer or
 * main contractor looks for before reading anything else.
 *
 * Filled in the CMS (Website pages → Home page → Client logos). Renders
 * nothing at all until there is a logo: an empty "trusted by" band would be
 * worse than none. Logos sit in grey and take their colour on hover, so a
 * mixed set of brand colours does not shout over the page.
 */
export default function ClientsStrip({ section }) {
  const items = useSectionItems('clients', []).filter((c) => c.image_url)
  if (!items.length) return null

  return (
    <section className="border-b border-line bg-surface py-10 sm:py-12">
      <div className="container-x">
        {section?.eyebrow && (
          <p className="text-center text-[0.7rem] font-bold uppercase tracking-[0.18em] text-muted">
            {section.eyebrow}
          </p>
        )}
        <motion.ul
          variants={stagger(0.05)} {...inView} viewport={{ once: true, amount: 'some' }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14"
        >
          {items.map((c) => {
            const logo = (
              <img
                src={cdnWidth(c.image_url, 320)} alt={c.title} loading="lazy" decoding="async"
                className="h-9 w-auto max-w-[9rem] object-contain opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 sm:h-11"
              />
            )
            return (
              <motion.li key={c.id ?? c.title} variants={fadeUp}>
                {/^https?:\/\//.test(c.href || '')
                  ? <a href={c.href} target="_blank" rel="noopener noreferrer" title={c.title}>{logo}</a>
                  : logo}
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
