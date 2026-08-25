import { Helmet } from 'react-helmet-async'
import PageHero from '@/components/ui/PageHero'
import TestimonialsStrip from '@/components/sections/TestimonialsStrip'
import CTABanner from '@/components/sections/CTABanner'

export default function Testimonials() {
  return (
    <>
      <Helmet>
        <title>Reviews — What customers say | Premier Power</title>
        <meta name="description" content="Reviews from homeowners and landlords across Nairobi, weighted toward the ones that speak to safety and reliability." />
        <link rel="canonical" href="https://premierpower.co.ke/testimonials" />
      </Helmet>

      <PageHero
        image={'/projects/dining.jpg'} imageAlt="Completed hospitality interior"
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
