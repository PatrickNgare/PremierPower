import PageHero from '@/components/ui/PageHero'
import TestimonialsStrip from '@/components/sections/TestimonialsStrip'
import CTABanner from '@/components/sections/CTABanner'
import { photo } from '@/utils/photo'
import Seo from '@/components/Seo'
import { usePageSections } from '@/hooks/usePage'

export default function Testimonials() {
  const sections = usePageSections('/testimonials')
  const hero = sections.hero
  return (
    <>
      <Seo
        title={"Reviews — What customers say | Premier Power"}
        description={"Reviews from homeowners and landlords across Nairobi, weighted toward the ones that speak to safety and reliability."}
        canonical={"https://premierpower.co.ke/testimonials"}
      />
      <PageHero
        crumb={hero?.config?.crumb || "Reviews"}
        eyebrow={hero?.eyebrow || "Social proof"}
        title={hero?.title || "What customers say."}
        lede={hero?.subtitle || "Weighted toward the reviews that mention safety and reliability, because that is what you are actually buying."}
        image={hero?.image_url || photo('/projects/dining.jpg')}
        imageAlt={hero?.image_alt || "Completed hospitality interior"}
      />

      <section className="section-tight">
        <div className="container-x">
          <TestimonialsStrip />
        </div>
      </section>

      <CTABanner />
    </>
  )
}
