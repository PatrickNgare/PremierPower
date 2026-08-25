import { useState } from 'react'
import { motion } from 'framer-motion'
import { Expand, MapPin } from 'lucide-react'
import Lightbox from '@/components/ui/Lightbox'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { projectShowcase } from '@/data/projectShowcase'
import { demoPhotos } from '@/config/demo'
import Photo from '@/components/ui/Photo'

/**
 * Masonry-ish showcase: varied tile heights so the grid reads as a composition
 * rather than a row of equal cards. Detail animates in on hover; on touch the
 * caption is always visible, since there is no hover state to reveal it.
 */
const spans = ['lg:row-span-2', '', '', '', 'lg:row-span-2', '', '', '', '']

export default function ProjectsShowcase({ limit }) {
  const shown = limit ? projectShowcase.slice(0, limit) : projectShowcase
  const [open, setOpen] = useState(null)

  // Only tiles with a real image are viewable; a placeholder has nothing to
  // enlarge, so it stays a plain tile rather than a dead button.
  const viewable = shown
    .map((p, i) => ({ ...p, i, src: p.image_open_url || demoPhotos[p.demoKey] }))
    .filter((p) => p.src)
  const items = viewable.map((p) => ({
    src: p.src, alt: p.image_open_alt, title: p.title, caption: `${p.badge} · ${p.location}`,
  }))

  return (
    <motion.ul
      variants={stagger(0.07)}
      {...inView}
      // grid-flow-dense backfills the holes the row-spans would otherwise leave.
      className="mt-14 grid auto-rows-[15rem] grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {shown.map((p, i) => (
        <motion.li
          key={p.title}
          variants={fadeUp}
          className={`group relative overflow-hidden rounded-[var(--radius-card)] border border-ink-900/10 bg-ink-900 ${spans[i] ?? ''}`}
        >
          <Photo
            src={p.image_open_url || undefined}
            demoSrc={demoPhotos[p.demoKey]}
            alt={p.image_open_alt}
            brief={p.briefOpen}
            className="absolute inset-0 h-full w-full rounded-none object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-[1.07]"
          />

          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/35 to-transparent" />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            style={{ background: 'radial-gradient(22rem 16rem at 60% 30%, rgb(245 201 123 / 0.24), transparent 68%)' }}
          />

          <div className="absolute inset-x-0 bottom-0 p-6">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              {p.badge}
            </span>
            <h3 className="mt-3 font-display text-lg font-bold leading-tight text-white">{p.title}</h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-300">
              <MapPin size={12} className="text-lumen-500" aria-hidden="true" />
              {p.location}
            </p>
            {/* Always visible on touch; slides in on pointer devices. */}
            <p className="mt-3 max-w-sm text-sm leading-snug text-ink-300 transition-all duration-500 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
              {p.summary}
            </p>
          </div>

          <span
            aria-hidden="true"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-all duration-500 group-hover:border-lumen-500 group-hover:bg-lumen-500 group-hover:text-ink-950"
          >
            <Expand size={15} className="transition-transform duration-500 group-hover:scale-110" />
          </span>

          {(() => {
            const pos = viewable.findIndex((v) => v.i === i)
            return pos === -1 ? null : (
              <button
                type="button"
                onClick={() => setOpen(pos)}
                className="absolute inset-0 cursor-zoom-in"
                aria-label={`View ${p.title}, ${p.location}, larger`}
              />
            )
          })()}
        </motion.li>
      ))}
      <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </motion.ul>
  )
}
