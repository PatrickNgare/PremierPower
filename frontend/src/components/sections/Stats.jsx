import { motion } from 'framer-motion'
import { CalendarClock, Building2, Layers, HeartHandshake } from 'lucide-react'
import Counter from '@/components/ui/Counter'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { site, isPending, value } from '@/config/site'

/**
 * Figures the client has to supply. Nothing here is invented: an unconfirmed
 * figure renders as an em dash with a note, never as a plausible number.
 */
const rows = [
  { field: 'years_trading', label: 'Years trading', icon: CalendarClock },
  { field: 'projects_completed', label: 'Projects delivered', icon: Building2 },
  { field: 'sectors', label: 'Sectors served', icon: Layers, literal: '7' },
  { field: 'response_time', label: 'Typical response', icon: HeartHandshake },
]

export default function Stats() {
  const resolve = (r) => {
    if (r.literal) return r.literal
    const v = site[r.field === 'years_trading' ? 'yearsLicensed' : r.field === 'projects_completed' ? 'installsCompleted' : 'responseTime']
    return isPending(v) ? null : value(v)
  }
  const anyPending = rows.some((r) => resolve(r) === null)

  return (
    <section className="on-dark relative isolate overflow-hidden bg-ink-950">
      <div aria-hidden="true" className="ambient-warm absolute inset-0 -z-10" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px rule-fade text-white/20" />

      <motion.div variants={stagger(0.08)} {...inView} className="container-x grid gap-10 py-20 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => {
          const v = resolve(r)
          const Icon = r.icon
          return (
            <motion.div key={r.label} variants={fadeUp} className="group relative">
              <Icon size={22} className="text-lumen-500 transition-transform duration-500 group-hover:-translate-y-0.5" aria-hidden="true" />
              <p className={`mt-5 font-display text-[2.75rem] font-extrabold leading-none ${v ? 'text-white' : 'text-white/25'}`}>
                {v ? <Counter value={v} /> : '—'}
              </p>
              <p className="mt-3 text-sm text-ink-300">{r.label}</p>
              <span aria-hidden="true" className="mt-5 block h-px w-12 bg-lumen-500/50 transition-all duration-500 group-hover:w-20" />
            </motion.div>
          )
        })}
      </motion.div>

      {anyPending && (
        <p className="container-x pb-10 text-xs text-white/30">
          Figures marked — are awaiting confirmation from the client. Values shown as
          dummy are placeholders, not real figures.
        </p>
      )}
    </section>
  )
}
