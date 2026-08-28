import PageHero from '@/components/ui/PageHero'
import ProjectsShowcase from '@/components/sections/ProjectsShowcase'
import CTABanner from '@/components/sections/CTABanner'
import { photo } from '@/utils/photo'
import Seo from '@/components/Seo'

export default function Portfolio() {
  return (
    <>
      <Seo
        title={"Installations — Photographed before the plaster | Premier Power"}
        description={"Residential rewiring and consumer unit installations in Nairobi, photographed open before plastering — the stage that determines whether an installation is safe."}
        canonical={"https://premierpower.co.ke/portfolio"}
      />

      <PageHero
        image={photo('/projects/resort-dusk.jpg')} imageAlt="Completed resort development at dusk"
        crumb="Installations" eyebrow="Our work"
        title="Installations, photographed at the stage that matters."
        lede="Finished rooms prove nothing — anyone can plaster over bad work. Every job here is shown open: the board, the chase, the conductors, and only then the finished wall."
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
