import { Helmet } from 'react-helmet-async'
import PageHero from '@/components/ui/PageHero'
import ServicesGrid from '@/components/sections/ServicesGrid'
import ProcessSteps from '@/components/sections/ProcessSteps'
import SectionHeader from '@/components/ui/SectionHeader'
import CTABanner from '@/components/sections/CTABanner'

export default function Services() {
  return (
    <>
      <Helmet>
        <title>Services — Residential wiring, rewiring &amp; consumer units | Premier Power</title>
        <meta name="description" content="Full rewiring, new installations, consumer unit upgrades, fault finding, and inspection with certification for homes across Nairobi. EPRA licensed." />
        <link rel="canonical" href="https://premierpower.co.ke/services" />
      </Helmet>

      <PageHero
        crumb="Services" eyebrow="Residential only"
        title="Wiring, rewiring, and the boards that protect them."
        lede="Five service lines, all of them domestic. If you need a commercial fit-out or a solar tie-in we will tell you plainly and point you to someone who does it properly."
      />

      <section className="section">
        <div className="container-x">
          <ServicesGrid />
        </div>
      </section>

      <section className="section bg-neutral-50">
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
