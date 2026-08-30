import { isPending, value } from '@/config/site'
import { useSite } from '@/hooks/useSite'

/**
 * Both credentials, in one mark.
 *
 * They are not the same claim and neither substitutes for the other: EPRA
 * licences the electrical work itself, NCA registers the company as a
 * contractor. For a main contractor or an architect choosing an electrical
 * subcontractor, EPRA is the specifically-electrical one — which is why it
 * leads here.
 *
 * Each number renders only once supplied. Until then the badge still makes the
 * claim it can honestly make — licensed, registered — and never invents a
 * number to sit beside it.
 *
 * The brand green appears here and nowhere else, as the earth mark beside the
 * licence: the one place a conductor colour carries meaning.
 */
export default function LicenseBadge({ tone = 'light', className = '' }) {
  const site = useSite()
  const dark = tone === 'dark'

  const marks = [
    {
      label: 'EPRA',
      full: isPending(site.epraNumber) ? 'EPRA licensed' : `EPRA ${value(site.epraNumber)}`,
      pending: isPending(site.epraNumber),
      title: 'EPRA Electrical Contractor Licence number not yet confirmed',
    },
    {
      label: 'NCA',
      full: isPending(site.ncaNumber) ? 'NCA registered' : `NCA ${value(site.ncaNumber)}`,
      pending: isPending(site.ncaNumber),
      title: 'NCA registration number not yet confirmed',
    },
  ]

  return (
    <p className={`inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border px-3 py-2 text-xs ${
      dark ? 'border-white/20 bg-white/5 text-white/70' : 'border-neutral-200 bg-white text-muted'
    } ${className}`}>
      <span aria-hidden="true" className="h-3.5 w-1 shrink-0 rounded-full bg-earth" />
      <span className={`font-semibold ${dark ? 'text-white' : 'text-primary'}`}>
        Licensed&nbsp;&amp;&nbsp;registered
      </span>
      {marks.map((m) => (
        <span key={m.label} className="flex items-center gap-2.5">
          <span aria-hidden="true" className={dark ? 'text-white/25' : 'text-neutral-300'}>|</span>
          <span className="tracking-wide whitespace-nowrap" title={m.pending ? m.title : undefined}>
            {m.full}
          </span>
        </span>
      ))}
    </p>
  )
}
