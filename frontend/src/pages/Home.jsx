import { Helmet } from 'react-helmet-async'
import Hero from '../components/Hero'
import SectionHeader from '../components/SectionHeader'
import BeforeAfter from '../components/BeforeAfter'
import ServicesList from '../components/ServicesList'
import ProcessStages from '../components/ProcessStages'
import Schedule from '../components/Schedule'
import TestimonialsStrip from '../components/TestimonialsStrip'
import CTABanner from '../components/CTABanner'
import Button from '../components/Button'
import { demoPhotos } from '../config/demo'

export default function Home() {
  return (
    <>
      <Helmet>
        <title>PremierPower — Licensed residential wiring &amp; rewiring in Nairobi</title>
        <meta name="description" content="EPRA-licensed residential wiring and rewiring in Nairobi. Every chase marked out before cutting, every circuit photographed before plaster, test certificate at handover. Free site assessment." />
        <link rel="canonical" href="https://premierpower.co.ke/" />
        <meta property="og:title" content="PremierPower — Licensed residential wiring in Nairobi" />
        <meta property="og:description" content="We mark out every chase, photograph every circuit before the plaster closes, and hand you the test certificate. Free site assessment." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Hero />

      {/* The differentiator, stated as the problem it solves. */}
      <section className="border-y border-graphite-900/10 bg-plaster-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <SectionHeader
            title="Most of the dangerous work we find was done by someone who was cheaper."
            lede="Junction boxes buried in plaster with no access. Undersized conductors feeding a whole floor. Earth conductors connected to nothing at all. None of it is visible once the wall is closed, and none of it announces itself until something burns."
          />
          <div className="max-w-[60ch] space-y-5 text-lg leading-relaxed text-graphite-700 lg:pt-16">
            <p>
              An unlicensed electrician can produce a wall that looks identical to ours on
              handover day. The difference is entirely in what you cannot see — and in
              whether anyone tested it before covering it up.
            </p>
            <p>
              So we work the other way round. Every chase is drawn on the bare wall before
              it is cut and walked with you. Every circuit is photographed while it is
              still open. Every installation is tested, recorded, and certified, and you
              keep the paperwork.
            </p>
            <p className="text-graphite-900">
              If you already suspect the work in your home was done badly, that is the
              assessment we do most often.
            </p>
          </div>
        </div>
      </section>

      {/* Signature interaction — registered views of one wall. */}
      <section className="plaster">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeader
            title="This is the part you will never see again."
            lede="Drag to take the plaster off. What is underneath is the only thing that determines whether an installation is safe, and it is the one thing a homeowner can never check."
          />
          <div className="mt-12">
            <BeforeAfter
              ratio="16 / 10"
              beforeDemoSrc={demoPhotos.chaseOpen}
              afterDemoSrc={demoPhotos.chaseFinished}
              beforeBrief="The same wall with chases open and conductors run — conduit, cable, back boxes visible. Shoot from a fixed position on a tripod."
              afterBrief="The identical framing after plastering and second fix, accessories on. Same tripod position, same lens, so the two register exactly."
              beforeAlt="A wall with chases cut open and conductors run through conduit before plastering"
              afterAlt="The same wall after plastering, with sockets and switches fitted"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-graphite-900/10">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <SectionHeader
            title="What we do"
            lede="Residential only. We wire and rewire homes, and we do not spread ourselves across trades we would be mediocre at."
          />
          <ServicesList limit={3} />
        </div>
      </section>

      <section className="bg-buried-900 on-dark">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.3fr_1fr] lg:gap-20 lg:py-28">
          <div>
            <SectionHeader
              tone="dark"
              title="Four stages, and you sign off before each one closes."
              lede="Nothing gets covered until you have seen it. The order matters — each stage is a gate on the one before it."
            />
            <div className="[&_h3]:text-plaster-50 [&_li]:text-plaster-100">
              <ol className="relative mt-12 border-l border-plaster-100/20">
                {[
                  ['01', 'Survey', 'Free, about an hour', 'We walk the property, open the board, test what is there, and photograph it. You get the findings in writing whether or not you hire us.'],
                  ['02', 'Marking out', 'Before any cutting', 'Socket heights, switch drops, and every chase route go onto the bare wall in pencil. Nothing is cut until you have walked the marked wall and agreed it.'],
                  ['03', 'Rough-in', 'Walls open', 'Chases cut, conduit and conductors run, board positioned. This is the stage nobody photographs and everybody should — so we do, every circuit, and the set is yours.'],
                  ['04', 'Test and certify', 'Before plaster, and again at handover', 'Continuity, insulation resistance, polarity, and earth loop impedance, recorded. You receive the circuit schedule, the test results, and the certificate.'],
                ].map(([n, title, when, body]) => (
                  <li key={n} className="relative grid gap-x-8 gap-y-2 pb-11 pl-8 last:pb-0 sm:grid-cols-[auto_1fr]">
                    <span aria-hidden="true" className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border border-plaster-100/60 bg-buried-900" />
                    <span className="font-mono tabular text-sm text-buried-300 sm:pt-1">{n}</span>
                    <div>
                      <h3 className="text-xl">{title}</h3>
                      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-buried-300/80">{when}</p>
                      <p className="secondary mt-3 max-w-[58ch] leading-relaxed">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <Button to="/safety" variant="onDark" className="mt-10">How we test and certify</Button>
          </div>

          <div className="lg:pt-24">
            <Schedule tone="dark" />
          </div>
        </div>
      </section>

      <section className="plaster">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <SectionHeader
            title="What customers say"
            lede="Weighted toward the ones who mention safety and reliability, because that is what you are actually buying."
          />
          <TestimonialsStrip />
        </div>
      </section>

      <CTABanner />
    </>
  )
}
