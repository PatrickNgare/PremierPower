import { Helmet } from 'react-helmet-async'
import SectionHeader from '../components/SectionHeader'
import BeforeAfter from '../components/BeforeAfter'
import Photo from '../components/Photo'
import CTABanner from '../components/CTABanner'

/**
 * Framed as installations, in registered views: the marked wall, the open
 * chase, the board, the finished room. Not a gallery of tidy interiors.
 */
const installations = [
  {
    title: 'Two-bedroom apartment, full rewire',
    meta: 'Pending — first completed project with a full photo set',
    views: [
      'The consumer unit before work: open the door and shoot the existing ways, including any hand-written schedule.',
      'The replacement board on completion, every way labelled and the schedule fitted inside the door.',
      'One chase run photographed open, then the same framing finished.',
    ],
  },
]

export default function Work() {
  return (
    <>
      <Helmet>
        <title>Installations — Photographed before the plaster | PremierPower</title>
        <meta name="description" content="Residential rewiring and consumer unit installations in Nairobi, photographed open before plastering — the stage that determines whether an installation is safe." />
        <link rel="canonical" href="https://premierpower.co.ke/work" />
      </Helmet>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <SectionHeader
          title="Installations, photographed at the stage that matters."
          lede="Finished rooms prove nothing — anyone can plaster over bad work. Every job here is shown open: the board, the chase, the conductors, and only then the finished wall."
        />

        <div className="mt-14">
          <BeforeAfter
            ratio="16 / 9"
            beforeBrief="Consumer unit with the cover off — existing ways, conductors, and any previous electrician's work visible."
            afterBrief="The replacement board, cover off, every way labelled, conductors dressed."
            beforeAlt="An old consumer unit with the cover removed showing existing wiring"
            afterAlt="The replacement consumer unit with labelled ways and dressed conductors"
          />
        </div>

        {installations.map((job) => (
          <article key={job.title} className="mt-16 border-t border-graphite-900/12 pt-10">
            <h2 className="text-2xl text-graphite-900">{job.title}</h2>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-graphite-400">{job.meta}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {job.views.map((brief, i) => (
                <Photo key={i} brief={brief} ratio="4 / 3" alt="" sizes="(max-width: 640px) 90vw, 30vw" />
              ))}
            </div>
          </article>
        ))}
      </div>
      <CTABanner />
    </>
  )
}
