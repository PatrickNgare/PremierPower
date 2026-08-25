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
        <title>About — Electrical engineering contractor in Kenya | Premier Power</title>
        <meta name="description" content="Premier Power Limited is a leading electrical engineering company in the corporate market, working on installation projects across Kenya. Our mission, vision and registration." />
        <link rel="canonical" href="https://premierpower.co.ke/about" />
      </Helmet>

      <PageHero
        image={'/projects/villa-modern.jpg'} imageAlt="Completed residential development"
        crumb="About" eyebrow="About us"
        title="A leading electrical engineering company in the corporate market."
        lede="Premier Power Limited works on electrical installation projects all over the country, and is expanding — diversifying geographical risk, with further offices planned in Kenya and across the border."
      />

      <section className="section">
        <div className="container-x grid gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <div>
            <SectionHeader eyebrow="Mission &amp; vision" title="Our mission and values" />
            <motion.div {...inView} className="mt-8 space-y-5 text-base leading-relaxed text-neutral-600">
              <p>
                To provide the best enhanced quality, innovative, safe and flexible electrical
                services.
              </p>
              <p>
                We strongly believe in the principles of corporate responsibility, and in
                attaining our goals in ways that honour ethical values and respect for our
                clients, our communities and the natural environment — and in the safety of our
                employees.
              </p>
              <p className="font-semibold text-primary">
                Our vision is to lead our field of specialisation in electrical and ICT
                installation, through total quality management, skills, and maintenance that
                keeps customer satisfaction high long after handover.
              </p>
            </motion.div>

            <LicenseBadge className="mt-8" />

            <dl className="mt-8 max-w-md rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm">
              {[
                ['Registered name', site.legalName],
                ['NCA registration', site.ncaNumber],
                ['Category', site.ncaCategory],
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
