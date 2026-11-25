import { motion } from 'framer-motion'
import { CalendarClock, Building2, Layers, HeartHandshake } from 'lucide-react'
import Counter from '@/components/ui/Counter'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { isPending, value } from '@/config/site'
import { DEMO } from '@/config/demo'
import { useSite } from '@/hooks/useSite'
import { useSectionItems } from '@/hooks/useSection'
import { useApi } from '@/hooks/useApi'

/** Icons the CMS may name for a stat. */
const ICONS = { calendar: CalendarClock, building: Building2, layers: Layers, handshake: HeartHandshake }

/** Company-detail key -> the field name the site config uses. */
const FIELD = {
  years_trading: 'yearsLicensed',
  projects_completed: 'installsCompleted',
  response_time: 'responseTime',
}

/**
 * Figures the client has to supply. Nothing here is invented: an unconfirmed
 * figure is left off the bar, never filled with a plausible number.
 */
const rows = [
  { field: 'years_trading', label: 'Years trading', icon: CalendarClock },
  { field: 'projects_completed', label: 'Projects delivered', icon: Building2 },
  { field: 'sectors', label: 'Sectors served', icon: Layers, literal: '7' },
  { field: 'response_time', label: 'Typical response', icon: HeartHandshake },
]

export default function Stats() {
  const site = useSite()
  const items = useSectionItems('stats', rows)
  // Projects the client has actually entered. Not a substitute for the figure
  // they eventually confirm — a company has usually delivered more than it
  // lists — but it is a true, checkable number, and three em dashes across the
  // band read as a site nobody finished. The label changes with it so the
  // number never claims more than it can support.
  const { data: projects } = useApi('/projects', null)
  const listed = Array.isArray(projects) ? projects.length : 0

  /**
   * A stat's figure comes from the company detail it names, so the number is
   * typed once under Company details rather than again here. `value` on the
   * row is a literal for facts that are not a changing figure — "7 sectors"
   * is a property of the NCA registration, not something to keep updating.
   */
  const resolve = (r) => {
    const literal = r.value ?? r.literal
    if (literal) return literal
    const field = FIELD[r.href] ?? FIELD[r.field] ?? r.field
    const v = site[field]
    if (!isPending(v)) return value(v)
    if ((r.field === 'projects_completed' || r.href === 'projects_completed') && listed) return String(listed)
    return null
  }
  /** True only where the figure is the client's own, not one we counted. */
  const derived = (r) =>
    (r.field === 'projects_completed' || r.href === 'projects_completed') &&
    isPending(site.installsCompleted) && listed > 0
  // A figure nobody has supplied is left off, not shown as a dash with an
  // apology under it; the row closes up around the ones that are filled in.
  const shown = items.map((r) => ({ r, v: resolve(r) })).filter(({ v }) => v)
  if (!shown.length) return null
  const cols = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' }[shown.length] ?? 'lg:grid-cols-4'

  return (
    <section className="on-dark relative isolate overflow-hidden bg-ink-950">
      <div aria-hidden="true" className="ambient-warm absolute inset-0 -z-10" />
      <div aria-hidden="true" className="grain absolute inset-0 -z-10" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px rule-fade text-white/20" />

      <motion.div variants={stagger(0.08)} {...inView} className={`container-x grid gap-8 py-14 sm:gap-10 sm:py-20 ${shown.length > 1 ? 'sm:grid-cols-2' : ''} ${cols}`}>
        {shown.map(({ r, v }) => {
          const Icon = ICONS[r.icon] ?? r.icon ?? Layers
          return (
            <motion.div key={r.title ?? r.label} variants={fadeUp} className="group relative">
              <Icon size={22} className="text-lumen-500 transition-transform duration-500 group-hover:-translate-y-0.5" aria-hidden="true" />
              <p className="mt-4 font-display text-[2.25rem] font-extrabold leading-none text-white sm:mt-5 sm:text-[2.75rem]">
                <Counter value={v} />
                {DEMO && !(r.value ?? r.literal) && (
                  <span
                    className="ml-1 align-super text-base font-bold text-lumen-500"
                    title="Placeholder figure, awaiting confirmation"
                  >
                    *
                  </span>
                )}
              </p>
              <p className="mt-3 text-sm text-ink-300">
                {derived(r) ? 'Projects listed' : (r.title ?? r.label)}
              </p>
              <span aria-hidden="true" className="mt-5 block h-px w-12 bg-lumen-500/50 transition-all duration-500 group-hover:w-20" />
            </motion.div>
          )
        })}
      </motion.div>

      {DEMO && (
        <p className="container-x pb-10 text-xs text-white/30">
          Figures marked * are placeholders awaiting confirmation from the client.
        </p>
      )}
    </section>
  )
}
