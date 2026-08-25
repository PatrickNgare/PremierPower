import { motion } from 'framer-motion'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { sectors } from '@/data/sectors'

/**
 * The sectors listed in the company profile. Cards carrying a photograph show
 * work of that kind from the profile; the rest stay typographic rather than
 * borrow an unrelated image.
 */
export default function SectorsGrid() {
  return (
    <motion.ul variants={stagger(0.06)} {...inView} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sectors.map((s) => (
        <motion.li
          key={s.title}
          variants={fadeUp}
          className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 ${
            s.image ? 'min-h-[15rem] border-transparent' : 'border-neutral-200 bg-white p-7 hover:shadow-xl'
          }`}
        >
          {s.image && (
            <>
              <img
                src={s.image} alt={s.alt ?? ''} loading="lazy" decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
            </>
          )}
          <div className={s.image ? 'relative flex h-full min-h-[15rem] flex-col justify-end p-7' : ''}>
            <h3 className={`font-heading text-lg font-semibold ${s.image ? 'text-white' : 'text-primary'}`}>
              {s.title}
            </h3>
            <p className={`mt-2 text-sm leading-relaxed ${s.image ? 'text-white/80' : 'text-neutral-600'}`}>
              {s.body}
            </p>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  )
}
