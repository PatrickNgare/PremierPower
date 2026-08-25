import { motion } from 'framer-motion'
import {
  Zap, ShieldCheck, Sun, BatteryCharging, MoveVertical,
  Network, Gauge, Flame,
} from 'lucide-react'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { services } from '@/data/services'

/** One icon per NCA service line, all from a single set at one stroke weight. */
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

export default function Services({ limit }) {
  const shown = limit ? services.slice(0, limit) : services

  return (
    <motion.ul variants={stagger(0.06)} {...inView} className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-ink-900/10 bg-ink-900/10 sm:grid-cols-2 lg:grid-cols-4">
      {shown.map((s) => {
        const Icon = icons[s.slug] ?? Zap
        return (
          <motion.li key={s.slug} variants={fadeUp} className="group relative bg-paper p-7 transition-colors duration-500 hover:bg-white">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: 'radial-gradient(16rem 10rem at 50% 0%, rgb(245 201 123 / 0.20), transparent 70%)' }}
            />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-ink-900/10 bg-white transition-all duration-500 group-hover:-translate-y-1 group-hover:border-lumen-500/60">
              <Icon size={19} strokeWidth={1.6} className="text-[rgb(var(--accent-rgb))]" aria-hidden="true" />
            </span>
            <h3 className="relative mt-5 font-display text-base font-bold text-ink-900">{s.title}</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-ink-600">{s.lede}</p>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}
