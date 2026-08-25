import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'
import Hero from '@/components/sections/Hero'
import Stats from '@/components/sections/Stats'
import SafetyBar from '@/components/sections/SafetyBar'
import Solutions from '@/components/sections/Solutions'
import AboutBento from '@/components/sections/AboutBento'
import LightingShowcase from '@/components/sections/LightingShowcase'
import Services from '@/components/sections/Services'
import ProjectsShowcase from '@/components/sections/ProjectsShowcase'
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
        <title>Premier Power Limited — Electrical engineering &amp; installation contractor, Kenya</title>
        <meta name="description" content="Premier Power Limited is an NCA-registered electrical engineering contractor working across Kenya — banks and commercial interiors, offices, hotels and lodges, institutions, healthcare, industrial and residential developments." />
        <link rel="canonical" href="https://premierpower.co.ke/" />
        <meta property="og:title" content="Premier Power Limited — Electrical engineering contractor, Kenya" />
        <meta property="og:description" content="Electrical installation for the corporate market across Kenya, with leading contractors in the private and public sectors." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Hero />
      <Stats />

      <section className="section-tight">
        <div className="container-x">
          <SectionHeader
            eyebrow="Who we are"
            title="A leading electrical engineering company in the corporate market."
            lede="Premier Power Limited works on installation projects all over the country, expanding across Kenya and beyond the border."
          />
          <AboutBento />
        </div>
      </section>

      <section className="section-loose">
        <div className="container-x">
          <motion.div {...inView} className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader
              eyebrow="Selected projects"
              title="Delivered with the contractors and architects who designed them."
              lede="Hospitality developments, commercial interiors and residential clusters across Kenya — from Nashulai Mara Safari Lodge and Hotel Meru to the Maiyan villas at Nanyuki and town houses in Lavington."
            />
            <Link to="/portfolio" className="link-arrow">
              View all installations <FiArrowRight size={13} aria-hidden="true" />
            </Link>
          </motion.div>
          <ProjectsShowcase limit={5} />
        </div>
      </section>

      <section className="section bg-paper-warm">
        <div className="container-x">
          <SectionHeader
            align="center"
            eyebrow="Solutions"
            title="Lighting and electrical solutions designed around you."
            lede="Works undertaken by Premier Power span the corporate, commercial and residential markets — delivered with leading contractors in both the private and public sectors."
          />
          <Solutions />
        </div>
      </section>

      <LightingShowcase />

      <SafetyBar />

      <section className="section">
        <div className="container-x">
          <motion.div {...inView} className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader
              eyebrow="What we do"
              title="Electrical installation, and the systems that run alongside it."
              lede="Our NCA registration covers eight service lines — installation, security and access control, solar photovoltaics, power continuity, vertical transport, transmission and distribution, energy retrofitting and gas."
            />
            <Link to="/services" className="link-arrow">
              All services <FiArrowRight size={13} aria-hidden="true" />
            </Link>
          </motion.div>
          <Services />
        </div>
      </section>

      {/* The differentiator, stated as the problem it solves. */}
      <section className="on-dark bg-primary">
        <div className="container-x section">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <SectionHeader
              tone="dark"
              eyebrow="Why contractors work with us"
              title="One registered contractor, coordinated on one programme."
              lede="Electrical, security, solar, power continuity and vertical transport usually arrive as four or five separate subcontractors, each coordinating with the others through the main contractor. Our NCA registration covers all of them."
            />
            <motion.div {...inView} className="space-y-5 text-base leading-relaxed text-white/70 lg:pt-16">
              <p>
                We undertake electrical installation with a number of leading contractors in
                both the private and public sectors, working directly with the project
                architect from drawings through to commissioning.
              </p>
              <p>
                That means one programme, one set of site attendances, and one point of
                responsibility when the security cabling has to share a route with the power,
                or the solar has to tie into distribution that is already energised.
              </p>
              <p className="font-semibold text-white">
                Every installation is tested and certified before handover, whatever its size.
              </p>
              <Button to="/safety" variant="ghostDark" className="mt-2">How we test and certify</Button>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-tight bg-paper-warm">
        <div className="container-x">
          <SectionHeader
            align="center"
            eyebrow="How it works"
            title="Four stages, documented at each gate."
            lede="From drawings to commissioning, each stage is signed off before the next begins — and the test results and certification come with the handover."
          />
          <ProcessSteps />
        </div>
      </section>

      <section className="section-tight">
        <div className="container-x">
          <SectionHeader
            align="center"
            eyebrow="References"
            title="What clients say"
            lede="Weighted toward the ones that speak to delivery and reliability on programme."
          />
          <TestimonialsStrip />
        </div>
      </section>

      <CTABanner />
    </>
  )
}
