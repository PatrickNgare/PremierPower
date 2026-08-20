import { Helmet } from 'react-helmet-async'
import SectionHeader from '../components/SectionHeader'
import LicenseBadge from '../components/LicenseBadge'
import Photo from '../components/Photo'
import CTABanner from '../components/CTABanner'
import { site, isPending, value } from '../config/site'

export default function About() {
  return (
    <>
      <Helmet>
        <title>About — EPRA-licensed electricians in Nairobi | PremierPower</title>
        <meta name="description" content="Who we are licensed by, what we will and will not take on, and why we photograph every circuit before the plaster closes." />
        <link rel="canonical" href="https://premierpower.co.ke/about" />
      </Helmet>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <div>
            {/* Licensing leads, not company history. */}
            <SectionHeader
              title="Licensed, insured, and easy to check."
              lede="The credential comes first here because it is the thing that separates a safe installation from one that merely looks finished."
            />
            <LicenseBadge className="mt-8" />

            <dl className="mt-10 max-w-md border-t border-graphite-900/12 text-sm">
              {[
                ['Registered name', site.legalName],
                ['EPRA licence', site.epraNumber],
                ['Licence class', site.epraClass],
                ['Insured by', site.insured],
                ['Service area', site.serviceArea],
              ].map(([label, v]) => (
                <div key={label} className="flex justify-between gap-6 border-b border-graphite-900/12 py-3">
                  <dt className="text-graphite-500">{label}</dt>
                  <dd className={isPending(v) ? 'text-graphite-400' : 'font-mono tabular text-graphite-900'}>
                    {isPending(v) ? '—' : value(v)}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-14 max-w-[64ch] space-y-5 text-lg leading-relaxed text-graphite-700">
              <p>
                We wire and rewire homes in Nairobi. That is the whole business. We are not
                a general contractor with an electrician on staff, and we do not take on
                commercial fit-outs, solar tie-ins, or appliance repair.
              </p>
              <p>
                The reason we photograph every circuit before plastering is not marketing.
                It is that a homeowner has no way to audit the work afterwards, and the
                only honest response to that is to document it while it can still be seen.
                The set of photographs is yours whether or not you ever need it.
              </p>
              <p className="text-graphite-900">
                If we think a job is outside what we do well, we will say so and lose the work.
              </p>
            </div>
          </div>

          <div className="lg:pt-10">
            <Photo
              ratio="4 / 5"
              sizes="(max-width: 1024px) 90vw, 40vw"
              brief="The team on site, in work clothes, mid-job — not posed against a van. One clear face-on shot the customer will recognise at the door."
              alt="The PremierPower team on site during an installation"
            />
          </div>
        </div>
      </div>
      <CTABanner />
    </>
  )
}
