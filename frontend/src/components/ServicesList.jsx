import { Link } from 'react-router-dom'
import { services } from '../data/services'
import { ArrowIcon } from './Icons'

/**
 * A ruled list, not a grid of equal cards. Each service earns its own line and
 * the ones with warning signs carry them, because that is what a worried
 * homeowner is actually scanning for.
 */
export default function ServicesList({ limit }) {
  const shown = limit ? services.slice(0, limit) : services
  return (
    <div className="mt-12 border-t border-graphite-900/12">
      {shown.map((s) => (
        <article key={s.slug} className="grid gap-x-10 gap-y-3 border-b border-graphite-900/12 py-9 md:grid-cols-[minmax(0,20rem)_1fr]">
          <h3 className="text-2xl leading-tight text-graphite-900">{s.title}</h3>
          <div>
            <p className="max-w-[62ch] text-lg leading-relaxed text-graphite-700">{s.lede}</p>
            <p className="mt-3 max-w-[68ch] leading-relaxed text-graphite-500">{s.body}</p>
            {s.signs.length > 0 && (
              <>
                <p className="mt-6 font-mono text-xs uppercase tracking-wider text-graphite-400">
                  Signs you need this
                </p>
                <ul className="mt-3 space-y-1.5">
                  {s.signs.map((sign) => (
                    <li key={sign} className="flex gap-3 text-graphite-700">
                      <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-graphite-400" />
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </article>
      ))}
      {limit && services.length > limit && (
        <Link to="/services" className="mt-8 inline-flex items-center gap-2 font-medium text-graphite-800 underline decoration-graphite-400 underline-offset-4 hover:decoration-graphite-800">
          All services <ArrowIcon width="18" height="18" />
        </Link>
      )}
    </div>
  )
}
