import PageHero from '@/components/ui/PageHero'
import TestimonialsStrip from '@/components/sections/TestimonialsStrip'
import CTABanner from '@/components/sections/CTABanner'
import { photo } from '@/utils/photo'
import Seo from '@/components/Seo'

export default function Testimonials() {
  return (
    <>
      <Seo
        title={"Reviews — What customers say | Premier Power"}
        description={"Reviews from homeowners and landlords across Nairobi, weighted toward the ones that speak to safety and reliability."}
        canonical={"https://premierpower.co.ke/testimonials"}
      />

      <PageHero
        image={photo('/projects/dining.jpg')} imageAlt="Completed hospitality interior"
        crumb="Reviews" eyebrow="Social proof"
        title="What customers say."
        lede="Weighted toward the reviews that mention safety and reliability, because that is what you are actually buying."
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
