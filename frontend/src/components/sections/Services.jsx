import { motion } from 'framer-motion'
import {
  Zap, ShieldCheck, Sun, BatteryCharging, MoveVertical,
  Network, Gauge, Flame, ArrowUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { services } from '@/data/services'

const icons = {
  'electrical-installation': Zap,
  'security-systems': ShieldCheck,
  'solar-power': Sun,
  'power-continuity': BatteryCharging,
  'vertical-transport': MoveVertical,
  'power-infrastructure': Network,
  'energy-efficiency': Gauge,
  'mechanical-gas': Flame,
}

/**
 * Not eight identical tiles.
 *
 * The core service leads as a full-bleed feature over photography; two
 * supporting lines get medium cards; the remaining five run as a dense ruled
 * list. Three weights of the same idea, so the section reads as a hierarchy
 * rather than a grid.
 */
export default function Services() {
  const [lead, ...rest] = services
  const medium = rest.slice(0, 2)
  const list = rest.slice(2)
  const LeadIcon = icons[lead.slug] ?? Zap

  return (
    <div className="mt-14 grid gap-4 lg:grid-cols-3">
      {/* Feature — the work everything else attaches to. */}
      <motion.article
        variants={fadeUp} {...inView}
        className="group relative isolate overflow-hidden rounded-[var(--radius-card)] border border-white/10 lg:col-span-2 lg:row-span-2"
      >
        <img
          src="/projects/technical.jpg" alt="Terminating conductors during installation"
          loading="lazy" decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[1.3s] ease-out group-hover:scale-105"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-tr from-ink-950 via-ink-950/85 to-ink-950/45" />
        <div className="flex h-full min-h-[22rem] flex-col justify-end p-8 lg:p-10">
          <LeadIcon size={24} className="text-lumen-500" aria-hidden="true" />
          <h3 className="mt-5 font-display text-2xl font-bold text-white lg:text-3xl">{lead.title}</h3>
          <p className="mt-3 max-w-lg leading-relaxed text-ink-300">{lead.lede}</p>
          <Link to="/services" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-lumen-500">
            All service lines
            <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </Link>
        </div>
      </motion.article>

      {/* Two supporting lines, each with room to breathe. */}
      {medium.map((s) => {
        const Icon = icons[s.slug] ?? Zap
        return (
          <motion.article
            key={s.slug} variants={fadeUp} {...inView}
            className="group relative overflow-hidden rounded-[var(--radius-card)] border border-ink-900/10 bg-white p-7 transition-all duration-500 hover:-translate-y-1"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: 'radial-gradient(18rem 12rem at 70% 0%, rgb(245 201 123 / 0.20), transparent 70%)' }}
            />
            <Icon size={20} strokeWidth={1.6} className="relative text-[rgb(var(--accent-rgb))]" aria-hidden="true" />
            <h3 className="relative mt-4 font-display text-lg font-bold text-ink-900">{s.title}</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-ink-600">{s.lede}</p>
          </motion.article>
        )
      })}

      {/* The remainder as a ruled list — dense, scannable, not five more cards. */}
      <motion.ul
        variants={stagger(0.05)} {...inView}
        className="divide-y divide-ink-900/10 overflow-hidden rounded-[var(--radius-card)] border border-ink-900/10 bg-white lg:col-span-3"
      >
        {list.map((s) => {
          const Icon = icons[s.slug] ?? Zap
          return (
            <motion.li key={s.slug} variants={fadeUp}>
              <div className="group flex flex-wrap items-center gap-x-6 gap-y-2 px-7 py-5 transition-colors duration-300 hover:bg-paper-warm">
                <Icon size={18} strokeWidth={1.6} className="shrink-0 text-[rgb(var(--accent-rgb))] transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
                <h3 className="w-full font-display text-base font-bold text-ink-900 sm:w-[15.5rem] sm:shrink-0">{s.title}</h3>
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-600 sm:border-l sm:border-ink-900/8 sm:pl-6">{s.lede}</p>
              </div>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
}
