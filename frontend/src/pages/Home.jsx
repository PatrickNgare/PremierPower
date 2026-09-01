import { Fragment } from 'react'
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
import { useApi } from '@/hooks/useApi'
import Seo from '@/components/Seo'

/**
 * The home page is composed here and configured in the CMS.
 *
 * `key` maps to a block below. The CMS can reorder, retitle and hide these,
 * but it cannot name a block that does not exist in this file — a section list
 * that can invent a component renders a blank space nobody can diagnose.
 *
 * The bundled defaults are the copy the page shipped with, so a first paint or
 * an unreachable API renders the page as written rather than empty.
 */
const DEFAULTS = [
  { key: 'hero' }, { key: 'stats' },
  { key: 'about', eyebrow: 'Who we are',
    title: 'A leading electrical engineering company in the corporate market.',
    subtitle: 'Premier Power Limited works on installation projects all over the country, expanding across Kenya and beyond the border.' },
  { key: 'projects', eyebrow: 'Selected projects',
    title: 'Delivered with the contractors and architects who designed them.',
    subtitle: 'Hospitality developments, commercial interiors and residential clusters across Kenya — from Nashulai Mara Safari Lodge and Hotel Meru to the Maiyan villas at Nanyuki and town houses in Lavington.',
    cta_label: 'View all installations', cta_href: '/portfolio', config: { limit: 5 } },
  { key: 'solutions', eyebrow: 'Solutions',
    title: 'Lighting and electrical solutions designed around you.',
    subtitle: 'Works undertaken by Premier Power span the corporate, commercial and residential markets — delivered with leading contractors in both the private and public sectors.',
    config: { align: 'center' } },
  { key: 'lighting' }, { key: 'safety' },
  { key: 'services', eyebrow: 'What we do',
    title: 'Electrical installation, and the systems that run alongside it.',
    subtitle: 'Our NCA registration covers eight service lines — installation, security and access control, solar photovoltaics, power continuity, vertical transport, transmission and distribution, energy retrofitting and gas.',
    cta_label: 'All services', cta_href: '/services' },
  { key: 'why', eyebrow: 'Why contractors work with us',
    title: 'One registered contractor, coordinated on one programme.',
    subtitle: 'Electrical, security, solar, power continuity and vertical transport usually arrive as four or five separate subcontractors, each coordinating with the others through the main contractor. Our NCA registration covers all of them.' },
  { key: 'process', eyebrow: 'How it works',
    title: 'Four stages, documented at each gate.',
    subtitle: 'From drawings to commissioning, each stage is signed off before the next begins — and the test results and certification come with the handover.',
    config: { align: 'center' } },
  { key: 'testimonials', eyebrow: 'References', title: 'What clients say',
    subtitle: 'Weighted toward the ones that speak to delivery and reliability on programme.',
    config: { align: 'center' } },
  { key: 'cta' },
]

/** Each block, keyed by the name the CMS stores. `s` is the section row. */
const BLOCKS = {
  hero: (s) => <Hero section={s} />,
  stats: (s) => <Stats section={s} />,
  lighting: (s) => <LightingShowcase section={s} />,
  safety: (s) => <SafetyBar section={s} />,
  cta: (s) => <CTABanner section={s} />,

  about: (s) => (
    <section className="section-tight">
      <div className="container-x">
        <SectionHeader eyebrow={s.eyebrow} title={s.title} lede={s.subtitle} />
        <AboutBento />
      </div>
    </section>
  ),

  projects: (s) => (
    <section className="section-loose">
      <div className="container-x">
        <motion.div {...inView} className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader eyebrow={s.eyebrow} title={s.title} lede={s.subtitle} />
          {s.cta_label && (
            <Link to={s.cta_href || '/portfolio'} className="link-arrow">
              {s.cta_label} <FiArrowRight size={13} aria-hidden="true" />
            </Link>
          )}
        </motion.div>
        <ProjectsShowcase limit={s.config?.limit ?? 5} />
      </div>
    </section>
  ),

  solutions: (s) => (
    <section className="section bg-page-warm">
      <div className="container-x">
        <SectionHeader align={s.config?.align ?? 'center'} eyebrow={s.eyebrow} title={s.title} lede={s.subtitle} />
        <Solutions />
      </div>
    </section>
  ),

  services: (s) => (
    <section className="section">
      <div className="container-x">
        <motion.div {...inView} className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader eyebrow={s.eyebrow} title={s.title} lede={s.subtitle} />
          {s.cta_label && (
            <Link to={s.cta_href || '/services'} className="link-arrow">
              {s.cta_label} <FiArrowRight size={13} aria-hidden="true" />
            </Link>
          )}
        </motion.div>
        <Services />
      </div>
    </section>
  ),

  /* The differentiator, stated as the problem it solves. */
  why: (s) => (
    <section className="on-dark bg-primary">
      <div className="container-x section">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeader tone="dark" eyebrow={s.eyebrow} title={s.title} lede={s.subtitle} />
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
  ),

  process: (s) => (
    <section className="section-tight bg-page-warm">
      <div className="container-x">
        <SectionHeader align={s.config?.align ?? 'center'} eyebrow={s.eyebrow} title={s.title} lede={s.subtitle} />
        <ProcessSteps />
      </div>
    </section>
  ),

  testimonials: (s) => (
    <section className="section-tight">
      <div className="container-x">
        <SectionHeader align={s.config?.align ?? 'center'} eyebrow={s.eyebrow} title={s.title} lede={s.subtitle} />
        <TestimonialsStrip />
      </div>
    </section>
  ),
}

export default function Home() {
  const { data } = useApi('/page-sections/filter?page=/', null)
  // Only sections this file can actually draw. A key the CMS holds but the
  // code does not know is skipped rather than rendered as a gap.
  const sections = (Array.isArray(data) && data.length ? data : DEFAULTS)
    .filter((s) => BLOCKS[s.key])

  return (
    <>
      <Seo
        title={"Premier Power Limited — Electrical engineering & installation contractor, Kenya"}
        description={"Premier Power Limited is an NCA-registered electrical engineering contractor working across Kenya — banks and commercial interiors, offices, hotels and lodges, institutions, healthcare, industrial and residential developments."}
        canonical={"https://premierpower.co.ke/"}
      />

      {sections.map((s) => <Fragment key={s.key}>{BLOCKS[s.key](s)}</Fragment>)}
    </>
  )
}
