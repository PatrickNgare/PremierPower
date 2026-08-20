import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import PageHero from '@/components/ui/PageHero'
import SectionHeader from '@/components/ui/SectionHeader'
import LicenseBadge from '@/components/ui/LicenseBadge'
import Photo from '@/components/ui/Photo'
import CTABanner from '@/components/sections/CTABanner'
import SafetyBar from '@/components/sections/SafetyBar'
import { inView } from '@/utils/motion'
import { demoPhotos } from '@/config/demo'
import { site, isPending, value } from '@/config/site'

export default function About() {
  return (
    <>
      <Helmet>
        <title>About — EPRA-licensed electricians in Nairobi | Premier Power</title>
        <meta name="description" content="Who we are licensed by, what we will and will not take on, and why we photograph every circuit before the plaster closes." />
        <link rel="canonical" href="https://premierpower.co.ke/about" />
      </Helmet>

      <PageHero
        crumb="About" eyebrow="Licensed and insured"
        title="The credential comes first, because it is what separates safe from merely finished."
        lede="We wire and rewire homes in Nairobi. That is the whole business."
      />

      <section className="section">
        <div className="container-x grid gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <div>
            <SectionHeader eyebrow="Who we are" title="Residential electricians, and nothing else." />
            <motion.div {...inView} className="mt-8 space-y-5 text-base leading-relaxed text-neutral-600">
              <p>
                We are not a general contractor with an electrician on staff, and we do not take
                on commercial fit-outs, solar tie-ins, or appliance repair.
              </p>
              <p>
                The reason we photograph every circuit before plastering is not marketing. It is
                that a homeowner has no way to audit the work afterwards, and the only honest
                response to that is to document it while it can still be seen. The set of
                photographs is yours whether or not you ever need it.
              </p>
              <p className="font-semibold text-primary">
                If we think a job is outside what we do well, we will say so and lose the work.
              </p>
            </motion.div>

            <LicenseBadge className="mt-8" />

            <dl className="mt-8 max-w-md rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm">
              {[
                ['Registered name', site.legalName],
                ['EPRA licence', site.epraNumber],
                ['Licence class', site.epraClass],
                ['Insured by', site.insured],
                ['Service area', site.serviceArea],
              ].map(([label, v]) => (
                <div key={label} className="flex justify-between gap-6 border-b border-neutral-200 py-2.5 last:border-0">
                  <dt className="text-neutral-500">{label}</dt>
                  <dd className={isPending(v) ? 'text-neutral-400' : 'font-semibold text-primary'}>
                    {isPending(v) ? '—' : value(v)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:pt-10">
            <Photo
              ratio="4 / 5" demoSrc={demoPhotos.team}
              sizes="(max-width: 1024px) 90vw, 40vw"
              brief="The team on site, in work clothes, mid-job — not posed against a van. One clear face-on shot the customer will recognise at the door."
              alt="The Premier Power team on site during an installation"
              className="w-full shadow-xl"
            />
          </div>
        </div>
      </section>

      <SafetyBar />
      <CTABanner />
    </>
  )
}
