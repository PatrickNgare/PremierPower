import PageHero from '@/components/ui/PageHero'
import TestimonialsStrip from '@/components/sections/TestimonialsStrip'
import CTABanner from '@/components/sections/CTABanner'
import { photo } from '@/utils/photo'
import Seo from '@/components/Seo'
import { usePageSections } from '@/hooks/usePage'
import { useApi } from '@/hooks/useApi'

export default function Testimonials() {
  const { data: reviews, loading } = useApi('/testimonials', [])
  const sections = usePageSections('/testimonials')
  const hero = sections.hero
  return (
    <>
      {/* No reviews yet means a page with a heading and nothing under it:
          kept out of search results until there is something to read. */}
      <Seo noindex={!loading && reviews.length === 0} />
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
