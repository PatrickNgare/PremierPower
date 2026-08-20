import { site, isPending, value } from '../config/site'

/**
 * The proof numbers, set as the circuit schedule that lives inside a
 * distribution board door — ruled rows, tabular figures, a rating per way.
 * Deliberately not the big-number metric template.
 */
const rows = [
  { way: '01', label: 'Installations completed', field: 'installsCompleted' },
  { way: '02', label: 'Years licensed', field: 'yearsLicensed' },
  { way: '03', label: 'Typical response', field: 'responseTime' },
  { way: '04', label: 'Workmanship warranty', field: 'warranty' },
]

export default function Schedule({ tone = 'light' }) {
  const dark = tone === 'dark'
  return (
    <table className={`w-full border-collapse text-left ${dark ? 'on-dark' : ''}`}>
      <caption className={`pb-4 text-left font-mono text-xs uppercase tracking-wider ${dark ? 'text-buried-300' : 'text-graphite-400'}`}>
        Schedule
      </caption>
      <tbody>
        {rows.map((r) => {
          const v = site[r.field]
          const unconfirmed = isPending(v)
          return (
            <tr key={r.way} className={`border-t ${dark ? 'border-plaster-100/15' : 'border-graphite-900/12'}`}>
              <th scope="row" className="py-4 pr-4 align-baseline font-normal">
                <span className={`font-mono tabular text-xs ${dark ? 'text-buried-300' : 'text-graphite-400'}`}>
                  {r.way}
                </span>
                <span className={`ml-4 ${dark ? 'text-plaster-100' : 'text-graphite-800'}`}>{r.label}</span>
              </th>
              <td className={`py-4 text-right align-baseline font-mono tabular text-lg ${
                unconfirmed
                  ? (dark ? 'text-buried-300/60' : 'text-graphite-400')
                  : (dark ? 'text-plaster-50' : 'text-graphite-900')
              }`}>
                {unconfirmed ? '—' : value(v)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
