import { site, isPending, value } from '../config/site'

/**
 * The brand green, used once and only here — as the earth mark beside the
 * licence, which is the one place a conductor colour means something.
 */
export default function LicenseBadge({ tone = 'light', className = '' }) {
  const unconfirmed = isPending(site.epraNumber)
  const dark = tone === 'dark'
  return (
    <p
      className={`inline-flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-xs ${
        dark
          ? 'border-paper-100/25 text-paper-300'
          : 'border-ink-900/15 text-ink-500'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className="h-3.5 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: 'var(--color-brand-green)' }}
      />
      <span className={dark ? 'text-paper-100' : 'text-ink-800'}>
        Licensed&nbsp;&amp;&nbsp;insured
      </span>
      <span aria-hidden="true" className={dark ? 'text-paper-100/30' : 'text-ink-900/20'}>·</span>
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
