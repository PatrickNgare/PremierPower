import { motion } from 'framer-motion'
import { FaQuoteLeft } from 'react-icons/fa'
import Avatar from '@/components/ui/Avatar'
import StarRating from '@/components/ui/StarRating'
import { useApi } from '@/hooks/useApi'
import { SkeletonCard, LoadingRegion } from '@/components/ui/Skeleton'
import { testimonials as fallback } from '@/data/testimonials'
import { Link } from 'react-router-dom'
import { EASE_OUT } from '@/utils/motion'

// What arrives after the skeleton fades in over it instead of replacing it in
// one frame. Opacity only, so the marquee's own transform is left alone.
const settle = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.25, ease: EASE_OUT } }

function Card({ t }) {
  return (
    <li className="w-[min(22rem,85vw)] shrink-0">
      <figure className="flex h-full flex-col rounded-xl border border-neutral-200 bg-surface p-6">
        <FaQuoteLeft size={17} className="text-secondary-accent" aria-hidden="true" />
        <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-neutral-700">{t.quote}</blockquote>
        <figcaption className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
          <Avatar name={t.name} size={40} />
          <div>
            <p className="font-heading text-sm font-semibold text-body">{t.name}</p>
            <p className="text-xs text-neutral-500">{t.location || t.job}</p>
          </div>
          <StarRating className="ml-auto" />
        </figcaption>
      </figure>
    </li>
  )
}

/** Marquee-style strip, wired into the homepage from day one. */
export default function TestimonialsStrip({ hideWhenEmpty = false }) {
  const { data, loading } = useApi('/testimonials', fallback)

  if (loading) {
    return (
      <LoadingRegion label="Loading reviews">
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      </LoadingRegion>
    )
  }

  // Nothing to show yet. The old empty state printed the brief — "three or
  // more real reviews, favouring the ones that mention safety" — which is a
  // note to whoever is building the site, not something a visitor should ever
  // read. `hideWhenEmpty` lets the home page drop the band entirely rather
  // than carry a heading with an apology under it; the reviews page, whose
  // whole purpose is reviews, says something a visitor can act on.
  if (!data.length) {
    if (hideWhenEmpty) return null
    return (
      <motion.div {...settle} className="mt-10 rounded-[var(--radius-card)] border border-line bg-surface-2 p-8 text-center sm:p-10">
        <p className="font-display text-lg font-bold tracking-tight text-body sm:text-xl">
          References available on request.
        </p>
        <p className="mx-auto mt-2.5 max-w-xl text-sm leading-relaxed text-muted">
          We would rather put you in touch with the contractors and architects we have
          worked with than publish a wall of quotes. Ask and we will arrange it.
        </p>
        <Link to="/contact" className="btn-onlight mt-6 px-6 py-3 text-sm">
          Request references
        </Link>
      </motion.div>
    )
  }

  const loop = [...data, ...data]
  return (
    <motion.div {...settle} className="group relative mt-10 overflow-hidden" aria-label="Customer reviews">
      <ul className="flex w-max gap-6 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:w-full">
        {loop.map((t, i) => <Card key={`${t.name}-${i}`} t={t} />)}
      </ul>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
    </motion.div>
  )
}
