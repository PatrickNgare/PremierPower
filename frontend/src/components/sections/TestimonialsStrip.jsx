import { FaQuoteLeft } from 'react-icons/fa'
import Avatar from '@/components/ui/Avatar'
import StarRating from '@/components/ui/StarRating'
import { useApi } from '@/hooks/useApi'
import { SkeletonCard, LoadingRegion } from '@/components/ui/Skeleton'
import { testimonials as fallback } from '@/data/testimonials'

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
export default function TestimonialsStrip() {
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

  if (!data.length) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-neutral-500">Testimonials required</p>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
          Three or more real reviews, favouring the ones that mention safety and reliability.
          This section stays empty until they arrive rather than carrying dummy praise.
        </p>
      </div>
    )
  }

  const loop = [...data, ...data]
  return (
    <div className="group relative mt-10 overflow-hidden" aria-label="Customer reviews">
      <ul className="flex w-max gap-6 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:w-full">
        {loop.map((t, i) => <Card key={`${t.name}-${i}`} t={t} />)}
      </ul>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
    </div>
  )
}
