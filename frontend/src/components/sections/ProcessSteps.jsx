import { motion } from 'framer-motion'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { stages } from '@/data/process'

/**
 * Four stages. The numbering is earned: each stage is a gate on the one
 * before it, so the sequence itself carries the information.
 */
export default function ProcessSteps({ tone = 'light' }) {
  const dark = tone === 'dark'
  return (
    <motion.ol variants={stagger(0.08)} {...inView} className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {stages.map((s) => (
        <motion.li key={s.n} variants={fadeUp} className="relative">
          <span className={`font-heading text-5xl font-bold ${dark ? 'text-white/15' : 'text-neutral-200'}`}>
            {String(s.n).padStart(2, '0')}
          </span>
          <span aria-hidden="true" className="mt-3 block h-0.5 w-10 rounded bg-secondary" />
          <h3 className={`mt-4 font-heading text-lg font-semibold ${dark ? 'text-white' : 'text-primary'}`}>{s.title}</h3>
          <p className={`mt-1 text-[0.7rem] font-bold uppercase tracking-[0.14em] ${dark ? 'text-white/45' : 'text-neutral-400'}`}>
            {s.when}
          </p>
          <p className={`mt-3 text-sm leading-relaxed ${dark ? 'text-white/65' : 'text-neutral-600'}`}>{s.body}</p>
        </motion.li>
      ))}
    </motion.ol>
  )
}
