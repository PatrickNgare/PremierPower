import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { site, isPending, value } from '@/config/site'

const stats = [
  { field: 'installsCompleted', label: 'Installations completed' },
  { field: 'yearsLicensed', label: 'Years licensed' },
  { field: 'responseTime', label: 'Typical response' },
  { field: 'warranty', label: 'Workmanship warranty' },
]

function parseStat(str) {
  const m = String(str).match(/^(\d+)(.*)$/)
  return m ? { value: parseInt(m[1], 10), suffix: m[2].trim() } : null
}

/** Counts up once, when it comes into view. */
function CountUp({ target, suffix, duration = 1800 }) {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true
    const start = performance.now()
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
      else setDone(true)
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])

  return (
    <motion.span
      ref={ref}
      animate={done ? { scale: [1, 1.14, 1] } : {}}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="inline-block font-heading text-2xl font-bold leading-none tabular-nums text-secondary-accent sm:text-3xl md:text-4xl"
    >
      {count}{suffix}
    </motion.span>
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

export default function StatsBar() {
  const anyPending = stats.some((s) => isPending(site[s.field]))

  return (
    <section className="on-dark relative overflow-hidden bg-primary-dark py-16">
      <div aria-hidden="true" className="dot-overlay pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-secondary/15 blur-[100px]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-primary-light/40 blur-[80px]" />

      <div className="container-x relative">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {stats.map((s, i) => {
            const raw = site[s.field]
            const pending = isPending(raw)
            const numeric = pending ? null : parseStat(value(raw))
            return (
              <motion.div
                key={s.field}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-stat cursor-default rounded-2xl px-4 py-6 text-center md:px-6 md:py-8"
              >
                {pending ? (
                  <span className="inline-block font-heading text-2xl font-bold leading-none text-white/25 sm:text-3xl md:text-4xl">—</span>
                ) : numeric ? (
                  <CountUp target={numeric.value} suffix={numeric.suffix} />
                ) : (
                  <span className="inline-block font-heading text-xl font-bold leading-none text-secondary-accent sm:text-2xl">
                    {value(raw)}
                  </span>
                )}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 + 0.3 }}
                  className="mx-auto my-3 h-0.5 w-8 origin-left bg-gradient-to-r from-transparent via-secondary/60 to-transparent"
                />
                <p className="text-xs uppercase tracking-widest text-white/50">{s.label}</p>
              </motion.div>
            )
          })}
        </div>
        {anyPending && (
          <p className="mt-6 text-center text-xs text-white/30">
            Figures render once the client supplies them — nothing here is invented.
          </p>
        )}
      </div>
    </section>
  )
}
