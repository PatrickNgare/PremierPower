import { site, isPending, value } from '../config/site'

/**
 * A credibility strip right after the hero — the one SpaceInfra pattern that
 * doesn't fight this site's own ruled, no-card-grid vocabulary: numerals and
 * a caption, divided by rules, not boxes. Only real figures render; a field
 * still pending in site.js is dropped rather than shown as a fabricated stat.
 */
const FIELDS = [
  ['yearsLicensed', (v) => `${v}+`, 'Years licensed'],
  ['installsCompleted', (v) => `${v}+`, 'Installations completed'],
  ['responseTime', (v) => v, 'Typical response'],
  ['warranty', (v) => v, 'Workmanship warranty'],
]

export default function StatsBar() {
  const stats = FIELDS
    .filter(([key]) => !isPending(site[key]))
    .map(([key, format, label]) => ({ figure: format(value(site[key])), label }))

  if (stats.length === 0) {
    return (
      <div className="border-y border-ink-900/10 bg-ink-900 on-dark">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <p className="font-mono text-[0.7rem] uppercase tracking-wider text-paper-300">
            Numbers pending
          </p>
          <p className="secondary mt-2 max-w-[60ch] leading-relaxed">
            Years licensed, installations completed, and response time render here once
            confirmed — not before, so nothing on this line is invented.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-y border-ink-900/10 bg-ink-900 on-dark">
      <div
        className="mx-auto grid max-w-6xl divide-x divide-paper-100/15 px-5 sm:px-8"
        style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0,1fr))` }}
      >
        {stats.map((s) => (
          <div key={s.label} className="px-4 py-8 text-center first:pl-0 last:pr-0 sm:py-10">
            <div className="tabular text-3xl text-paper-50 sm:text-4xl">{s.figure}</div>
            <div className="secondary mt-2 text-xs uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
