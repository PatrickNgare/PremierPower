import { testimonials } from '../data/testimonials'

export default function TestimonialsStrip() {
  if (testimonials.length === 0) {
    return (
      <div className="mt-12 rounded-xl border border-dashed border-graphite-900/25 p-8">
        <p className="font-mono text-[0.7rem] uppercase tracking-wider text-graphite-500">
          Testimonials required
        </p>
        <p className="mt-2 max-w-[60ch] leading-relaxed text-graphite-700">
          Three or more real reviews, favouring the ones that mention safety and
          reliability over how it looked when finished. This section stays empty
          until they arrive rather than carrying invented praise.
        </p>
      </div>
    )
  }

  return (
    <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((t, i) => (
        <li key={i} className="border-t border-graphite-900/15 pt-6">
          <blockquote className="text-lg leading-relaxed text-graphite-800">“{t.quote}”</blockquote>
          <figcaption className="mt-4 text-sm text-graphite-500">
            <span className="text-graphite-800">{t.name}</span>
            {t.location && <> · {t.location}</>}
            {t.job && <div className="mt-0.5 font-mono text-xs uppercase tracking-wider text-graphite-400">{t.job}</div>}
          </figcaption>
        </li>
      ))}
    </ul>
  )
}
