import { motion } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'
import PageHero from '@/components/ui/PageHero'
import SectionHeader from '@/components/ui/SectionHeader'
import LicenseBadge from '@/components/ui/LicenseBadge'
import CTABanner from '@/components/sections/CTABanner'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { isPending, value } from '@/config/site'
import { photo } from '@/utils/photo'
import { useSite } from '@/hooks/useSite'
import Seo from '@/components/Seo'
import { usePageSections } from '@/hooks/usePage'

const tests = [
  ['Continuity of protective conductors', 'Confirms every earth path is unbroken from the board to the furthest accessory.'],
  ['Insulation resistance', 'Confirms the insulation between conductors has not degraded — the test that catches perished rubber and cloth.'],
  ['Polarity', 'Confirms live and neutral are the right way round at every point, including switch drops.'],
  ['Earth fault loop impedance', 'Confirms a fault will draw enough current to trip protection fast enough to matter.'],
  ['RCD operation', 'Confirms residual-current devices actually disconnect within their rated time.'],
]

export default function Safety() {
  const sections = usePageSections('/safety')
  const hero = sections.hero
  const s1 = sections.section1
  const site = useSite()
  return (
    <>
      <Seo
        title={"Safety & compliance — NCA registered, tested and certified | Premier Power"}
        description={"Our NCA registration, the tests every installation receives before certification, and our workmanship warranty terms — stated plainly."}
        canonical={"https://premierpower.co.ke/safety"}
      />
      <PageHero
        crumb={hero?.config?.crumb || "Safety"}
        eyebrow={hero?.eyebrow || "Compliance"}
        title={hero?.title || "Registered, tested, and documented on every project."}
        lede={hero?.subtitle || "Premier Power Limited is registered with the National Construction Authority as an Electrical Engineering Service Contractor. Every installation is tested and certified before handover, whatever its size."}
        image={hero?.image_url || photo('/projects/technical.jpg')}
        imageAlt={hero?.image_alt || "Terminating conductors during installation"}
      />

      <section className="section-tight">
        <div className="container-x grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <div>
            <SectionHeader
              eyebrow={s1?.eyebrow || "Before certifying"}
              title={s1?.title || "What we test, every time."}
              lede={s1?.subtitle || "Every installation gets the full sequence, once before the plaster closes and again at handover. The recorded results go to you with the certificate."}
            />
            <motion.dl variants={stagger(0.06)} {...inView} className="mt-10 space-y-4">
              {tests.map(([name, why]) => (
                <motion.div key={name} variants={fadeUp} className="flex gap-4 rounded-xl border border-neutral-200 bg-surface p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-earth-ink/10">
                    <FiCheck size={15} className="text-earth-ink" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="font-heading font-semibold text-body">{name}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-neutral-600">{why}</dd>
                  </div>
                </motion.div>
              ))}
            </motion.dl>
          </div>

          <aside className="lg:pt-4">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-7">
              <h2 className="font-heading text-lg font-semibold text-body">Our registration</h2>
              <LicenseBadge className="mt-4 w-full" />
              <dl className="mt-6 space-y-3 text-sm">
                {[['EPRA licence', site.epraNumber], ['EPRA class', site.epraClass],
                  ['NCA registration', site.ncaNumber], ['NCA category', site.ncaCategory],
                  ['Insured by', site.insured]].map(([l, v]) => (
                  <div key={l} className="flex justify-between gap-4 border-b border-neutral-200 pb-3">
                    <dt className="text-neutral-500">{l}</dt>
                    <dd className={isPending(v) ? 'text-muted' : 'font-semibold text-body'}>
                      {isPending(v) ? '—' : value(v)}
                    </dd>
                  </div>
                ))}
              </dl>

              <h2 className="mt-8 font-heading text-lg font-semibold text-body">Warranty, plainly</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                {isPending(site.warranty) ? (
                  <span className="text-muted">
                    [Warranty term pending — the client must supply this. It belongs here, stated
                    plainly, not buried in a contract.]
                  </span>
                ) : (
                  <>Workmanship is warranted for {value(site.warranty)} from handover. If a fault traces
                  back to our installation within that period, we return and correct it at our cost —
                  labour included, not just parts.</>
                )}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
