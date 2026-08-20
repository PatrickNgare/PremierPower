import { site, isPending, value } from '../config/site'

/**
 * The only place green-yellow appears on the site — the earth mark, used once,
 * as a real conductor identification rather than decoration.
 */
export default function LicenseBadge({ tone = 'light', className = '' }) {
  const unconfirmed = isPending(site.epraNumber)
  const dark = tone === 'dark'
  return (
    <p
      className={`inline-flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-xs ${
        dark
          ? 'border-plaster-100/25 text-buried-300'
          : 'border-graphite-900/15 text-graphite-500'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className="h-3.5 w-1 shrink-0 rounded-full"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, var(--color-earth-500) 0 3px, #2E7D32 3px 6px)',
        }}
      />
      <span className={dark ? 'text-plaster-100' : 'text-graphite-800'}>
        Licensed&nbsp;&amp;&nbsp;insured
      </span>
      <span aria-hidden="true" className={dark ? 'text-plaster-100/30' : 'text-graphite-900/20'}>·</span>
      <span className="font-mono tabular">
        {unconfirmed ? (
          <span title="Client has not supplied this yet — launch blocker">
            EPRA&nbsp;[pending]
          </span>
        ) : (
          <>EPRA&nbsp;{value(site.epraNumber)}</>
        )}
      </span>
    </p>
  )
}
