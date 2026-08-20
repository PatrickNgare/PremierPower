import { Helmet } from 'react-helmet-async'
import PageHero from '@/components/ui/PageHero'
import ProjectsGrid from '@/components/sections/ProjectsGrid'
import CTABanner from '@/components/sections/CTABanner'

export default function Portfolio() {
  return (
    <>
      <Helmet>
        <title>Installations — Photographed before the plaster | Premier Power</title>
        <meta name="description" content="Residential rewiring and consumer unit installations in Nairobi, photographed open before plastering — the stage that determines whether an installation is safe." />
        <link rel="canonical" href="https://premierpower.co.ke/portfolio" />
      </Helmet>

      <PageHero
        crumb="Installations" eyebrow="Our work"
        title="Installations, photographed at the stage that matters."
        lede="Finished rooms prove nothing — anyone can plaster over bad work. Every job here is shown open: the board, the chase, the conductors, and only then the finished wall."
      />

      <section className="section">
        <div className="container-x">
          <ProjectsGrid />
        </div>
      </section>

      <CTABanner />
    </>
  )
}
