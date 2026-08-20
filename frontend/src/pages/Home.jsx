import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'
import Hero from '@/components/sections/Hero'
import StatsBar from '@/components/sections/StatsBar'
import SafetyBar from '@/components/sections/SafetyBar'
import ServicesGrid from '@/components/sections/ServicesGrid'
import ProjectsGrid from '@/components/sections/ProjectsGrid'
import ProcessSteps from '@/components/sections/ProcessSteps'
import TestimonialsStrip from '@/components/sections/TestimonialsStrip'
import CTABanner from '@/components/sections/CTABanner'
import SectionHeader from '@/components/ui/SectionHeader'
import Button from '@/components/ui/Button'
import { inView } from '@/utils/motion'

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Premier Power Limited — Licensed residential wiring &amp; rewiring in Nairobi</title>
        <meta name="description" content="EPRA-licensed residential wiring and rewiring in Nairobi. Every chase marked out before cutting, every circuit photographed before plaster, test certificate at handover. Free site assessment." />
        <link rel="canonical" href="https://premierpower.co.ke/" />
        <meta property="og:title" content="Premier Power Limited — Licensed residential wiring in Nairobi" />
        <meta property="og:description" content="We mark out every chase, photograph every circuit before the plaster closes, and hand you the test certificate. Free site assessment." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Hero />
      <StatsBar />

      <section className="section">
        <div className="container-x">
          <motion.div {...inView} className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader
              eyebrow="Recent installations"
              title="Shown at the stage that actually proves the work."
              lede="Finished rooms prove nothing — anyone can plaster over bad wiring. Every job here is photographed while the board and the chase are still open."
            />
            <Link to="/portfolio" className="link-arrow">
              View all installations <FiArrowRight size={13} aria-hidden="true" />
            </Link>
          </motion.div>
          <ProjectsGrid limit={3} />
        </div>
      </section>

      <SafetyBar />

      <section className="section">
        <div className="container-x">
          <motion.div {...inView} className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader
              eyebrow="What we do"
              title="Residential wiring, and nothing we would be mediocre at."
              lede="We wire and rewire homes. We do not take on commercial fit-outs, solar tie-ins, or appliance repair — and we will say so rather than take the work."
            />
            <Link to="/services" className="link-arrow">
              All services <FiArrowRight size={13} aria-hidden="true" />
            </Link>
          </motion.div>
          <ServicesGrid limit={3} />
        </div>
      </section>

      {/* The differentiator, stated as the problem it solves. */}
      <section className="on-dark bg-primary">
        <div className="container-x section">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <SectionHeader
              tone="dark"
              eyebrow="Why people call us"
              title="Most of the dangerous work we find was done by someone who was cheaper."
              lede="Junction boxes buried in plaster with no access. Undersized conductors feeding a whole floor. Earth conductors connected to nothing at all. None of it is visible once the wall is closed, and none of it announces itself until something burns."
            />
            <motion.div {...inView} className="space-y-5 text-base leading-relaxed text-white/70 lg:pt-16">
              <p>
                An unlicensed electrician can produce a wall that looks identical to ours on
                handover day. The difference is entirely in what you cannot see — and in
                whether anyone tested it before covering it up.
              </p>
              <p>
                So we work the other way round. Every chase is drawn on the bare wall before it
                is cut and walked with you. Every circuit is photographed while it is still
                open. Every installation is tested, recorded, and certified, and you keep the
                paperwork.
              </p>
              <p className="font-semibold text-white">
                If you already suspect the work in your home was done badly, that is the
                assessment we do most often.
              </p>
              <Button to="/safety" variant="ghostDark" className="mt-2">How we test and certify</Button>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section bg-neutral-50">
        <div className="container-x">
          <SectionHeader
            align="center"
            eyebrow="How it works"
            title="Four stages, and you sign off before each one closes."
            lede="Nothing gets covered until you have seen it. The order matters — each stage is a gate on the one before it."
          />
          <ProcessSteps />
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHeader
            align="center"
            eyebrow="Reviews"
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
