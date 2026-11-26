import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Expand, MapPin } from 'lucide-react'
import Lightbox from '@/components/ui/Lightbox'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { projectShowcase as fallback } from '@/data/projectShowcase'
import { demoPhotos } from '@/config/demo'
import { useApi } from '@/hooks/useApi'
import Photo from '@/components/ui/Photo'

/**
 * The CMS keeps one project row; the showcase wants a tile.
 *
 * `badge` has no column of its own — it was the sector label baked into the
 * hard-coded list. The location's last part reads correctly in its place
 * ("Maiyan, Nanyuki, Laikipia" -> "Laikipia") and, unlike a sector guessed
 * from the title, it is drawn from something the client actually typed.
 */
const fromProject = (p) => ({
  slug: p.slug,
  title: p.title,
  location: p.location,
  badge: p.year || (p.location ? p.location.split(',').pop().trim() : ''),
  summary: p.summary,
  image_open_url: p.image_open_url,
  image_open_alt: p.image_open_alt,
  briefOpen: p.title,
})

/**
 * Masonry-ish showcase: varied tile heights so the grid reads as a composition
 * rather than a row of equal cards. Detail animates in on hover; on touch the
 * caption is always visible, since there is no hover state to reveal it.
 */
// With three columns a single tall lead tile tiles cleanly: it fills column
// one across both rows while the rest fill the remaining four cells. Spanning
// a second tile leaves a hole that dense flow cannot backfill.
const spans = ['lg:row-span-2', '', '', '', '', 'lg:row-span-2', '', '', '']

export default function ProjectsShowcase({ limit }) {
  const { data } = useApi('/projects', null)
  const [open, setOpen] = useState(null)

  // Only projects with a photograph belong in a visual showcase; the rest are
  // listed on the portfolio page where a tile without an image still reads.
  const all = Array.isArray(data) && data.length
    ? data.map(fromProject).filter((p) => p.image_open_url)
    : fallback
  const shown = limit ? all.slice(0, limit) : all

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
      className="mt-10 grid auto-rows-[12rem] grid-flow-dense grid-cols-1 gap-3 sm:mt-14 sm:auto-rows-[15rem] sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
    >
      {shown.map((p, i) => (
        <motion.li
          key={p.title}
          variants={fadeUp}
          className={`group relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-ink-900 ${spans[i] ?? ''} ${
            i > 2 ? 'hidden sm:block' : ''
          }`}
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
            {/* Always visible. This was hover-only on pointer devices, which
                made the one line describing the job invisible at a glance and
                unreachable without a mouse. It lifts slightly on hover
                instead, so the tile still responds without hiding content. */}
            {p.summary && (
              <p className="mt-3 max-w-sm text-sm leading-snug text-ink-300 transition-transform duration-500 md:group-hover:-translate-y-0.5">
                {p.summary}
              </p>
            )}
          </div>

          {/* The tile opens the project's own page; the corner button opens
              the photograph full screen, as the whole tile used to. Fallback
              tiles (no CMS data, so no page) keep the viewer on the tile. */}
          {p.slug && (
            <Link
              to={`/portfolio/${p.slug}`}
              className="absolute inset-0"
              aria-label={`${p.title}, ${p.location}: view project`}
            />
          )}
          {(() => {
            const pos = viewable.findIndex((v) => v.i === i)
            if (pos === -1) return null
            return p.slug ? (
              <button
                type="button"
                onClick={() => setOpen(pos)}
                aria-label={`View ${p.title}, ${p.location}, larger`}
                className="absolute right-5 top-5 z-[1] flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-all duration-500 hover:border-lumen-500 hover:bg-lumen-500 hover:text-ink-950 group-hover:border-lumen-500"
              >
                <Expand size={13} aria-hidden="true" />
                View
              </button>
            ) : (
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
