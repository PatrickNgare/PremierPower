import { Helmet } from 'react-helmet-async'
import SectionHeader from '../components/SectionHeader'
import ServicesList from '../components/ServicesList'
import CTABanner from '../components/CTABanner'

export default function Services() {
  return (
    <>
      <Helmet>
        <title>Services — Residential wiring, rewiring &amp; consumer units | PremierPower</title>
        <meta name="description" content="Full rewiring, new installations, consumer unit upgrades, fault finding, and inspection with certification for homes across Nairobi. EPRA licensed." />
        <link rel="canonical" href="https://premierpower.co.ke/services" />
      </Helmet>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <SectionHeader
          title="Residential wiring, and nothing we would be mediocre at."
          lede="Five service lines, all of them domestic. If you need a commercial fit-out or solar tie-in we will tell you plainly and point you to someone who does it properly."
        />
        <ServicesList />
      </div>
      <CTABanner />
    </>
  )
}
