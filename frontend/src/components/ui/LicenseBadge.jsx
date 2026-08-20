import { site, isPending, value } from '@/config/site'

/**
 * The brand green appears here and nowhere else — as the earth mark beside the
 * licence, the one place a conductor colour carries meaning.
 */
export default function LicenseBadge({ tone = 'light', className = '' }) {
  const unconfirmed = isPending(site.epraNumber)
  const dark = tone === 'dark'
  return (
    <p className={`inline-flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs ${
      dark ? 'border-white/20 bg-white/5 text-white/70' : 'border-neutral-200 bg-white text-neutral-500'
    } ${className}`}>
      <span aria-hidden="true" className="h-3.5 w-1 shrink-0 rounded-full bg-earth" />
      <span className={`font-semibold ${dark ? 'text-white' : 'text-primary'}`}>Licensed&nbsp;&amp;&nbsp;insured</span>
      <span aria-hidden="true" className={dark ? 'text-white/25' : 'text-neutral-300'}>|</span>
      <span className="tracking-wide">
        {unconfirmed
          ? <span title="Client has not supplied this yet — launch blocker">EPRA&nbsp;[pending]</span>
          : <>EPRA&nbsp;{value(site.epraNumber)}</>}
      </span>
    </p>
  )
}
