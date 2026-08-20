import { stages } from '../data/process'

/**
 * Ordered stages, not four icon cards. The numbering is earned because the
 * sequence carries the information: each stage is a gate on the one before it.
 * State is a drawn mark, never hue alone.
 */
export default function ProcessStages() {
  return (
    <ol className="relative mt-14 border-l border-graphite-900/15 pl-0">
      {stages.map((s) => (
        <li key={s.n} className="relative grid gap-x-8 gap-y-2 pb-12 pl-8 last:pb-0 sm:grid-cols-[auto_1fr]">
          <span
            aria-hidden="true"
            className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border border-graphite-700 bg-plaster-100"
          />
          <span className="font-mono tabular text-sm text-graphite-400 sm:pt-1">
            {String(s.n).padStart(2, '0')}
          </span>
          <div>
            <h3 className="text-xl text-graphite-900">{s.title}</h3>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-graphite-400">{s.when}</p>
            <p className="mt-3 max-w-[62ch] leading-relaxed text-graphite-500">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
