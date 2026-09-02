import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { useApi } from '@/hooks/useApi'

/**
 * The projects the showcase cannot use.
 *
 * The grid above is a visual composition and needs a photograph per tile, so
 * it filters out anything without one. That left every un-photographed job
 * invisible on the site — nine of sixteen at the time of writing — even though
 * each was entered in the CMS and published. A named, located, described row
 * is worth considerably more to a main contractor weighing a tender than
 * silence, and far more than a "photograph required" placeholder would be.
 *
 * It renders nothing at all when every project already has a picture, so this
 * disappears on its own as photography arrives.
 */
export default function ProjectsList() {
  const { data } = useApi('/projects', null)
  const rows = Array.isArray(data) ? data.filter((p) => !p.image_open_url) : []
  if (!rows.length) return null

  return (
    <section className="section-tight border-t border-line">
      <div className="container-x">
        <p className="eyebrow">Also delivered</p>
        <h2 className="mt-3 max-w-2xl font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Further installations, awaiting photography.
        </h2>

        <motion.ul variants={stagger(0.05)} {...inView} className="mt-8 border-t border-line">
          {rows.map((p) => (
            <motion.li
              key={p.slug || p.title}
              variants={fadeUp}
              className="grid gap-x-6 gap-y-1.5 border-b border-line py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:py-6"
            >
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold tracking-tight sm:text-lg">{p.title}</h3>
                {p.summary && (
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{p.summary}</p>
                )}
              </div>
              <div className="flex flex-wrap items-start gap-x-4 gap-y-1 text-xs text-muted sm:justify-end sm:text-right">
                {p.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={12} className="text-lumen-700" aria-hidden="true" />
                    {p.location}
                  </span>
                )}
                {p.year && (
                  <span className="rounded-full border border-line px-2.5 py-0.5 font-semibold tracking-wide">
                    {p.year}
                  </span>
                )}
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
