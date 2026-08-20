import { Helmet } from 'react-helmet-async'
import SectionHeader from '../components/SectionHeader'
import CTABanner from '../components/CTABanner'
import { faqs } from '../data/faqs'

export default function FAQ() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <Helmet>
        <title>Questions — Licensing, cost, and what a rewire involves | PremierPower</title>
        <meta name="description" content="Are you licensed? What does an assessment cost? Do we move out during a rewire? Straight answers about residential rewiring in Nairobi." />
        <link rel="canonical" href="https://premierpower.co.ke/faq" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <SectionHeader
          title="The questions people actually ask."
          lede="Mostly about licensing. Almost never about price first — which is the right instinct."
        />
        <dl className="mt-14 max-w-3xl border-t border-graphite-900/12">
          {faqs.map((f) => (
            <div key={f.q} className="grid gap-x-10 gap-y-2 border-b border-graphite-900/12 py-7 md:grid-cols-[minmax(0,18rem)_1fr]">
              <dt className="text-xl leading-snug text-graphite-900">{f.q}</dt>
              <dd className="max-w-[64ch] leading-relaxed text-graphite-500">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
      <CTABanner />
    </>
  )
}
