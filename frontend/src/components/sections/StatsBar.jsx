import { motion } from 'framer-motion'
import { FiCheckCircle, FiAward, FiClock, FiShield } from 'react-icons/fi'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { site, isPending, value } from '@/config/site'

const stats = [
  { field: 'installsCompleted', label: 'Installations completed', icon: FiCheckCircle },
  { field: 'yearsLicensed', label: 'Years licensed', icon: FiAward },
  { field: 'responseTime', label: 'Typical response', icon: FiClock },
  { field: 'warranty', label: 'Workmanship warranty', icon: FiShield },
]

export default function StatsBar() {
  const anyMissing = stats.some((s) => isPending(site[s.field]))
  return (
    <section className="on-dark bg-primary">
      <motion.div variants={stagger(0.07)} {...inView} className="container-x grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ field, label, icon: Icon }) => {
          const v = site[field]
          const unconfirmed = isPending(v)
          return (
            <motion.div key={field} variants={fadeUp} className="flex items-center gap-4">
              <Icon size={26} className="shrink-0 text-secondary-accent" aria-hidden="true" />
              <div>
                <p className={`font-heading text-2xl font-bold ${unconfirmed ? 'text-white/30' : 'text-white'}`}>
                  {unconfirmed ? '—' : value(v)}
                </p>
                <p className="text-xs uppercase tracking-wider text-white/55">{label}</p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
      {anyMissing && (
        <p className="container-x pb-6 text-xs text-white/35">
          Figures render once the client supplies them — nothing here is invented.
        </p>
      )}
    </section>
  )
}
