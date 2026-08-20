import { Helmet } from 'react-helmet-async'
import SectionHeader from '../components/SectionHeader'
import Schedule from '../components/Schedule'
import LicenseBadge from '../components/LicenseBadge'
import CTABanner from '../components/CTABanner'
import { site, isPending, value } from '../config/site'

const tests = [
  ['Continuity of protective conductors', 'Confirms every earth path is unbroken from the board to the furthest accessory.'],
  ['Insulation resistance', 'Confirms the insulation between conductors has not degraded — the test that catches perished rubber and cloth.'],
  ['Polarity', 'Confirms live and neutral are the right way round at every point, including switch drops.'],
  ['Earth fault loop impedance', 'Confirms a fault will draw enough current to trip protection fast enough to matter.'],
  ['RCD operation', 'Confirms residual-current devices actually disconnect within their rated time.'],
]

export default function Safety() {
  return (
    <>
      <Helmet>
        <title>Safety &amp; compliance — EPRA licensed, tested and certified | PremierPower</title>
        <meta name="description" content="Our EPRA licence, the five tests every installation receives before certification, and our workmanship warranty terms — stated plainly." />
        <link rel="canonical" href="https://premierpower.co.ke/safety" />
      </Helmet>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <SectionHeader
          title="Verify us before you call us."
          lede="Our licence number is below and on every page of this site. You can check it against the Energy and Petroleum Regulatory Authority's register without speaking to us first — and you should do the same with anyone else you are considering."
        />
        <LicenseBadge className="mt-8" />

        <div className="mt-16 grid gap-14 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
          <div>
            <h2 className="text-2xl text-ink-900">What we test before certifying</h2>
            <p className="mt-3 max-w-[62ch] leading-relaxed text-ink-500">
              Every installation gets the full sequence, once before the plaster closes and
              again at handover. The recorded results go to you with the certificate.
            </p>
            <dl className="mt-10 border-t border-ink-900/12">
              {tests.map(([name, why]) => (
                <div key={name} className="border-b border-ink-900/12 py-5">
                  <dt className="text-lg text-ink-900">{name}</dt>
                  <dd className="mt-1.5 max-w-[64ch] leading-relaxed text-ink-500">{why}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-16 text-2xl text-ink-900">Our warranty, in plain terms</h2>
            <p className="mt-4 max-w-[64ch] text-lg leading-relaxed text-ink-700">
              {isPending(site.warranty) ? (
                <span className="text-ink-400">
                  [Warranty term pending — the client must supply this. It belongs here, stated
                  plainly, not buried in a contract.]
                </span>
              ) : (
                <>
                  Workmanship is warranted for {value(site.warranty)} from handover. If a fault
                  traces back to our installation within that period, we return and correct it at
                  our cost — labour included, not just parts.
                </>
              )}
            </p>
          </div>

          <div className="lg:pt-4">
            <Schedule />
          </div>
        </div>
      </div>
      <CTABanner />
    </>
  )
}
