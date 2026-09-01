import PageHero from '@/components/ui/PageHero'
import ServicesSection from '@/components/sections/Services'
import ProcessSteps from '@/components/sections/ProcessSteps'
import SectionHeader from '@/components/ui/SectionHeader'
import CTABanner from '@/components/sections/CTABanner'
import { photo } from '@/utils/photo'
import Seo from '@/components/Seo'
import { usePageSections } from '@/hooks/usePage'

export default function Services() {
  const sections = usePageSections('/services')
  const hero = sections.hero
  const s1 = sections.section1
  return (
    <>
      <Seo
        title={"Services — Electrical, security, solar & power systems | Premier Power"}
        description={"Electrical installation, CCTV and access control, solar photovoltaics, UPS and surge protection, lifts and escalators, transmission and distribution, energy retrofitting and gas installation. NCA-registered, nationwide."}
        canonical={"https://premierpower.co.ke/services"}
      />
      <PageHero
        crumb={hero?.config?.crumb || "Services"}
        eyebrow={hero?.eyebrow || "What we do"}
        title={hero?.title || "Eight service lines, one registered contractor."}
        lede={hero?.subtitle || "Our NCA registration covers electrical installation and the specialist systems that sit alongside it \u2014 security, solar, power continuity, vertical transport, transmission and gas. One contractor, coordinated on one programme."}
        image={hero?.image_url || photo('/projects/stairwell.jpg')}
        imageAlt={hero?.image_alt || "Feature lighting installation in a completed stairwell"}
      />

      <section className="section-tight">
        <div className="container-x">
          <ServicesSection />
        </div>
      </section>

      <section className="section-tight bg-page-warm">
        <div className="container-x">
          <SectionHeader
            eyebrow={s1?.eyebrow || "How it works"}
            title={s1?.title || "Four stages, and you sign off before each one closes."}
            lede={s1?.subtitle || "Nothing gets covered until you have seen it."}
            align="center"
          />
          <ProcessSteps />
        </div>
      </section>

      <CTABanner />
    </>
  )
}
