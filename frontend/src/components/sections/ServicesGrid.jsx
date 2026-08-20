import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiAlertTriangle } from 'react-icons/fi'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { useApi } from '@/hooks/useApi'
import { services as fallback } from '@/data/services'

export default function ServicesGrid({ limit }) {
  const { data } = useApi('/services', fallback)
  const shown = limit ? data.slice(0, limit) : data

  return (
    <motion.div variants={stagger(0.07)} {...inView} className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {shown.map((s) => (
        <motion.article key={s.slug} variants={fadeUp} className="card group flex flex-col p-7">
          <h3 className="font-heading text-xl font-semibold text-primary">{s.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">{s.lede}</p>

          {s.signs?.length > 0 && (
            <div className="mt-5 rounded-lg bg-neutral-50 p-4">
              <p className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-secondary-accent">
                <FiAlertTriangle size={13} aria-hidden="true" /> Signs you need this
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {s.signs.slice(0, 3).map((sign) => (
                  <li key={sign} className="flex gap-2.5 text-sm text-neutral-700">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-secondary" />
                    {sign}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link to="/contact" className="link-arrow mt-6 self-start">
            Book an assessment
            <FiArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </motion.article>
      ))}
    </motion.div>
  )
}
