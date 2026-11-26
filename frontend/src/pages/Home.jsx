import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
import PowerOnRule from '@/components/ui/PowerOnRule'
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
    // relative isolate: every other .on-dark section already carries this;
    // this was the one exception, which meant an absolutely-positioned
    // sibling here (the grain texture below) would have escaped to the
    // nearest positioned ancestor instead of this section.
    <section className="on-dark relative isolate bg-primary">
      <div aria-hidden="true" className="grain absolute inset-0 -z-10" />
      <div className="container-x section">
        {/* The signature, on the one dark band where light reads as current:
            a conductor closes across the section as it arrives. One place on
            the site — restraint is what keeps it from reading as a toy. */}
        <PowerOnRule className="mb-12 w-full" />
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

  // Renders nothing at all while there are no reviews. A heading reading
  // "What clients say" above an empty box is worse than no band: it draws the
  // eye to the one thing the site cannot yet show.
  testimonials: (s) => <TestimonialsBand section={s} />,
}

function TestimonialsBand({ section }) {
  const { data, loading } = useApi('/testimonials', [])
  // Nothing until we know. Rendering the heading while the request is in
  // flight made "What clients say" appear and then vanish once the answer came
  // back empty, which is a visible flash and a jump in everything below it. A
  // band that arrives a moment late is much easier to live with than one that
  // disappears while being read.
  if (loading || !data.length) return null
  return (
    <section className="section-tight">
      <div className="container-x">
        <SectionHeader
          align={section.config?.align ?? 'center'}
          eyebrow={section.eyebrow}
          title={section.title}
          lede={section.subtitle}
        />
        <TestimonialsStrip hideWhenEmpty />
      </div>
    </section>
  )
}

export default function Home() {
  const { data } = useApi('/page-sections/filter?page=/', null)
  // Only sections this file can actually draw. A key the CMS holds but the
  // code does not know is skipped rather than rendered as a gap.
  const sections = (Array.isArray(data) && data.length ? data : DEFAULTS)
    .filter((s) => BLOCKS[s.key])
  const { hash } = useLocation()
  useSpotlight(hash, Array.isArray(data))

  return (
    <>
      <Seo />

      {/* Each block carries an id so the CMS's "See it" button can land on
          it: /#section-stats scrolls to the figures bar and outlines it. */}
      {sections.map((s) => (
        <div key={s.key} id={`section-${s.key}`} className="scroll-mt-24">
          {BLOCKS[s.key](s)}
        </div>
      ))}
    </>
  )
}

/**
 * Arriving from the CMS at /#section-<key>: scroll to that block and outline
 * it for a few seconds with its name, so someone editing "Figures bar" can see
 * which band of the page that is. Waits for the CMS's section list, since the
 * blocks — and their order — come from it.
 */
const SPOT_NAMES = {
  hero: 'Slideshow & headline', stats: 'Figures bar', about: 'About us', projects: 'Projects',
  solutions: 'Sectors', lighting: 'Lighting showcase', safety: 'Trust marks', services: 'Services',
  why: 'Why us', process: 'How it works', testimonials: 'Reviews', cta: 'Closing call to action',
}

function useSpotlight(hash, ready) {
  useEffect(() => {
    if (!ready || !hash.startsWith('#section-')) return
    const key = hash.slice('#section-'.length)
    let el, t1, t2
    // A beat for the blocks to lay out (and the lazy photographs to claim
    // their height) before measuring where to scroll.
    t1 = setTimeout(() => {
      el = document.getElementById(`section-${key}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.dataset.spotName = SPOT_NAMES[key] ?? key
      el.classList.add('section-spotlight')
      t2 = setTimeout(() => el.classList.remove('section-spotlight'), 6000)
    }, 600)
    return () => { clearTimeout(t1); clearTimeout(t2); el?.classList.remove('section-spotlight') }
  }, [hash, ready])
}
