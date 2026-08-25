import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { solutions } from '@/data/solutions'

/**
 * Each card should feel like looking into a different environment. Cards with
 * a photograph are full-bleed and lit from below; the rest are typographic
 * rather than borrowing an unrelated image. The first card spans two columns
 * so the grid is composed rather than uniform.
 */
export default function Solutions() {
  return (
    <motion.ul
      variants={stagger(0.07)}
      {...inView}
      className="mt-14 grid auto-rows-[16rem] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {solutions.map((s, i) => {
        const wide = i === 0
        return (
          <motion.li
            key={s.slug}
            variants={fadeUp}
            className={`group relative overflow-hidden rounded-[var(--radius-card)] ${
              wide ? 'sm:col-span-2 sm:row-span-1' : ''
            } ${s.image ? 'border border-white/10' : 'border border-ink-900/10 bg-white'}`}
          >
            {s.image ? (
              <>
                <img
                  src={s.image} alt={s.alt ?? ''} loading="lazy" decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-[1.06]"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-transparent" />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                  style={{ background: 'radial-gradient(24rem 18rem at 70% 20%, rgb(245 201 123 / 0.28), transparent 65%)' }}
                />
              </>
            ) : (
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                style={{ background: 'radial-gradient(20rem 14rem at 80% 0%, rgb(245 201 123 / 0.16), transparent 70%)' }}
              />
            )}

            {/* Photographic cards anchor to the bottom edge, under the
                gradient. Text-only cards centre instead, so the copy is not
                stranded at the foot of an empty box. */}
            <div className={`relative flex h-full flex-col p-7 ${s.image ? 'justify-end' : 'justify-center'}`}>
              <h3 className={`font-display text-xl font-bold ${s.image ? 'text-white' : 'text-ink-900'} ${wide ? 'sm:text-2xl' : ''}`}>
                {s.title}
              </h3>
              <p className={`mt-2 max-w-sm text-sm leading-relaxed ${s.image ? 'text-ink-300' : 'text-ink-600'}`}>
                {s.line}
              </p>
              <Link
                to="/services"
                className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${
                  s.image ? 'text-lumen-500' : 'text-[rgb(var(--accent-rgb))]'
                }`}
              >
                Explore solution
                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}
