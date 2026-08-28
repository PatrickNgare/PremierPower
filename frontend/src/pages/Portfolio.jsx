import PageHero from '@/components/ui/PageHero'
import ProjectsShowcase from '@/components/sections/ProjectsShowcase'
import CTABanner from '@/components/sections/CTABanner'
import { photo } from '@/utils/photo'
import Seo from '@/components/Seo'
import { usePageSections } from '@/hooks/usePage'

export default function Portfolio() {
  const sections = usePageSections('/portfolio')
  const hero = sections.hero
  return (
    <>
      <Seo
        title={"Installations — Photographed before the plaster | Premier Power"}
        description={"Residential rewiring and consumer unit installations in Nairobi, photographed open before plastering — the stage that determines whether an installation is safe."}
        canonical={"https://premierpower.co.ke/portfolio"}
      />
      <PageHero
        crumb={hero?.config?.crumb || "Installations"}
        eyebrow={hero?.eyebrow || "Our work"}
        title={hero?.title || "Installations, photographed at the stage that matters."}
        lede={hero?.subtitle || "Finished rooms prove nothing \u2014 anyone can plaster over bad work. Every job here is shown open: the board, the chase, the conductors, and only then the finished wall."}
        image={hero?.image_url || photo('/projects/resort-dusk.jpg')}
        imageAlt={hero?.image_alt || "Completed resort development at dusk"}
      />

      <section className="section-loose">
        <div className="container-x">
          <ProjectsShowcase />
        </div>
      </section>

      <CTABanner />
    </>
  )
}
