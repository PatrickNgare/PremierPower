import { motion } from 'framer-motion'
import {
  Zap, ShieldCheck, Sun, BatteryCharging, MoveVertical,
  Network, Gauge, Flame, ArrowUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp, stagger, inView } from '@/utils/motion'

// Reveal as soon as any part is on screen. On the services page this grid
// starts right at the fold of a 1366x768 laptop: the feature card is ~700px
// tall, so the shared 20% threshold left a blank strip there until the
// visitor scrolled.
const EDGE = { once: true, amount: 'some' }
import { services as fallback } from '@/data/services'
import { useApi } from '@/hooks/useApi'
import { photo, fallbackToLocal } from '@/utils/photo'

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
  const { data: services } = useApi('/services', fallback)
  // The composition needs a lead card; nothing to lead with means nothing to
  // draw, and an empty section is better than a broken one.
  if (!services.length) return null

  const [lead, ...rest] = services
  const medium = rest.slice(0, 2)
  const list = rest.slice(2)
  const LeadIcon = icons[lead.slug] ?? Zap

  return (
    <div className="mt-10 grid gap-3 sm:mt-14 sm:gap-4 lg:grid-cols-3">
      {/* Feature — the work everything else attaches to. */}
      <motion.article
        variants={fadeUp} {...inView} viewport={EDGE}
        className="group relative isolate overflow-hidden rounded-[var(--radius-card)] border border-white/10 lg:col-span-2 lg:row-span-2"
      >
        <img onError={fallbackToLocal}
          src={photo('/projects/board-terminations.jpg')} alt="Ferrule-terminated conductors in a distribution board"
          loading="lazy" decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[1.3s] ease-out group-hover:scale-105"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-tr from-ink-950 via-ink-950/85 to-ink-950/45" />
        <div className="flex h-full min-h-[17rem] flex-col justify-end p-7 sm:min-h-[22rem] sm:p-8 lg:p-10">
          <LeadIcon size={24} className="text-lumen-500" aria-hidden="true" />
          <h3 className="mt-5 font-display text-2xl font-bold text-white lg:text-3xl">{lead.title}</h3>
          <p className="mt-3 max-w-lg leading-relaxed text-ink-300">{lead.lede}</p>
          <Link to={`/services/${lead.slug}`} className="link-arrow mt-5 !text-lumen-500">
            More on {lead.title.toLowerCase()}
            <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </Link>
        </div>
      </motion.article>

      {/* Two supporting lines, each with room to breathe. */}
      {medium.map((s) => {
        const Icon = icons[s.slug] ?? Zap
        return (
          <motion.article
            key={s.slug} variants={fadeUp} {...inView} viewport={EDGE}
            // lit-card: was a bespoke hover-only glow span here, visible to a
            // mouse and invisible to the touch majority — same gap as the
            // Solutions cards. One shared utility now carries both a hover
            // glow and a quieter always-on version under (hover: none).
            className="lit-card group relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-6 transition-all duration-500 hover:-translate-y-1 sm:p-7"
          >
            <Icon size={20} strokeWidth={1.6} className="relative text-[rgb(var(--accent-rgb))]" aria-hidden="true" />
            <h3 className="relative mt-4 font-display text-lg font-bold text-body">
              {/* The whole card is the link (the ::after stretches over it),
                  so the heading reads as the link text. */}
              <Link to={`/services/${s.slug}`} className="after:absolute after:inset-0 focus-visible:underline">
                {s.title}
              </Link>
            </h3>
            <p className="relative mt-2 text-sm leading-relaxed text-body-soft">{s.lede}</p>
          </motion.article>
        )
      })}

      {/* The remainder as a ruled list — dense, scannable, not five more cards. */}
      <motion.ul
        variants={stagger(0.05)} {...inView} viewport={EDGE}
        className="divide-y divide-ink-900/10 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface lg:col-span-3"
      >
        {list.map((s) => {
          const Icon = icons[s.slug] ?? Zap
          return (
            <motion.li key={s.slug} variants={fadeUp}>
              <div className="group relative flex flex-wrap items-center gap-x-6 gap-y-1.5 px-6 py-4 transition-colors duration-300 hover:bg-page-warm sm:px-7 sm:py-5">
                <Icon size={18} strokeWidth={1.6} className="shrink-0 text-[rgb(var(--accent-rgb))] transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
                <h3 className="w-full font-display text-base font-bold text-body sm:w-[15.5rem] sm:shrink-0">
                  <Link to={`/services/${s.slug}`} className="after:absolute after:inset-0 hover:text-accent focus-visible:underline">
                    {s.title}
                  </Link>
                </h3>
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-body-soft sm:border-l sm:border-line sm:pl-6">{s.lede}</p>
              </div>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
}
