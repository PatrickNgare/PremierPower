import { motion } from 'framer-motion'
import PageHero from '@/components/ui/PageHero'
import SectionHeader from '@/components/ui/SectionHeader'
import LicenseBadge from '@/components/ui/LicenseBadge'
import Photo from '@/components/ui/Photo'
import CTABanner from '@/components/sections/CTABanner'
import SafetyBar from '@/components/sections/SafetyBar'
import AboutBento from '@/components/sections/AboutBento'
import { inView } from '@/utils/motion'
import { demoPhotos } from '@/config/demo'
import { isPending, value } from '@/config/site'
import { photo } from '@/utils/photo'
import { useSite } from '@/hooks/useSite'
import Seo from '@/components/Seo'
import { usePageSections } from '@/hooks/usePage'

export default function About() {
  const sections = usePageSections('/about')
  const hero = sections.hero
  const s1 = sections.section1
  const s2 = sections.section2
  const site = useSite()
  return (
    <>
      <Seo
        title={"About — Electrical engineering contractor in Kenya | Premier Power"}
        description={"Premier Power Limited is a leading electrical engineering company in the corporate market, working on installation projects across Kenya. Our mission, vision and registration."}
        canonical={"https://premierpower.co.ke/about"}
      />
      <PageHero
        crumb={hero?.config?.crumb || "About"}
        eyebrow={hero?.eyebrow || "About us"}
        title={hero?.title || "A leading electrical engineering company in the corporate market."}
        lede={hero?.subtitle || "Premier Power Limited works on electrical installation projects all over the country, and is expanding \u2014 diversifying geographical risk, with further offices planned in Kenya and across the border."}
        image={hero?.image_url || photo('/projects/villa-modern.jpg')}
        imageAlt={hero?.image_alt || "Completed residential development"}
      />

      <section className="section-tight">
        <div className="container-x grid gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <div>
            <SectionHeader
              eyebrow={s1?.eyebrow || "Mission & vision"}
              title={s1?.title || "Our mission and values"}
            />
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
                  <dd className={isPending(v) ? 'text-muted' : 'font-semibold text-primary'}>
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

      <section className="section-tight bg-paper-warm">
        <div className="container-x">
          <SectionHeader
            eyebrow={s2?.eyebrow || "At a glance"}
            title={s2?.title || "The work, the registration and the reach."}
          />
          <AboutBento />
        </div>
      </section>

      <SafetyBar />
      <CTABanner />
    </>
  )
}
