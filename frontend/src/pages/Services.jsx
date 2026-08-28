import PageHero from '@/components/ui/PageHero'
import ServicesSection from '@/components/sections/Services'
import ProcessSteps from '@/components/sections/ProcessSteps'
import SectionHeader from '@/components/ui/SectionHeader'
import CTABanner from '@/components/sections/CTABanner'
import { photo } from '@/utils/photo'
import Seo from '@/components/Seo'

export default function Services() {
  return (
    <>
      <Seo
        title={"Services — Electrical, security, solar & power systems | Premier Power"}
        description={"Electrical installation, CCTV and access control, solar photovoltaics, UPS and surge protection, lifts and escalators, transmission and distribution, energy retrofitting and gas installation. NCA-registered, nationwide."}
        canonical={"https://premierpower.co.ke/services"}
      />

      <PageHero
        image={photo('/projects/stairwell.jpg')} imageAlt="Feature lighting installation in a completed stairwell"
        crumb="Services" eyebrow="What we do"
        title="Eight service lines, one registered contractor."
        lede="Our NCA registration covers electrical installation and the specialist systems that sit alongside it — security, solar, power continuity, vertical transport, transmission and gas. One contractor, coordinated on one programme."
      />

      <section className="section-tight">
        <div className="container-x">
          <ServicesSection />
        </div>
      </section>

      <section className="section-tight bg-paper-warm">
        <div className="container-x">
          <SectionHeader
            align="center" eyebrow="How it works"
            title="Four stages, and you sign off before each one closes."
            lede="Nothing gets covered until you have seen it."
          />
          <ProcessSteps />
        </div>
      </section>

      <CTABanner />
    </>
  )
}
