import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { AnimatePresence, motion } from 'framer-motion'
import { FiPlus, FiMinus } from 'react-icons/fi'
import PageHero from '@/components/ui/PageHero'
import CTABanner from '@/components/sections/CTABanner'
import { useApi } from '@/hooks/useApi'
import { faqs as fallbackFaqs } from '@/data/faqs'

function Item({ q, a, open, onToggle, id }) {
  return (
    <div className="border-b border-neutral-200">
      <h3>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`faq-${id}`}
          className="flex w-full items-center justify-between gap-6 py-5 text-left">
          <span className="font-heading text-base font-semibold text-primary sm:text-lg">{q}</span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-secondary-accent">
            {open ? <FiMinus size={15} aria-hidden="true" /> : <FiPlus size={15} aria-hidden="true" />}
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={`faq-${id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden">
            <p className="pb-5 pr-14 text-sm leading-relaxed text-neutral-600">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const [open, setOpen] = useState(0)
  const { data } = useApi('/faqs', fallbackFaqs)
  // The API returns question/answer; the bundled fallback uses q/a.
  const faqs = data.map((f) => ({ q: f.q ?? f.question, a: f.a ?? f.answer }))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <Helmet>
        <title>Questions — Licensing, cost, and what a rewire involves | Premier Power</title>
        <meta name="description" content="Are you licensed? What does an assessment cost? Do we move out during a rewire? Straight answers about residential rewiring in Nairobi." />
        <link rel="canonical" href="https://premierpower.co.ke/faq" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <PageHero
        image={'/projects/lodge-dusk.jpg'} imageAlt="Completed development at dusk"
        crumb="FAQ" eyebrow="Straight answers"
        title="The questions people actually ask."
        lede="Mostly about licensing. Almost never about price first — which is the right instinct."
      />

      <section className="section-tight">
        <div className="container-x max-w-3xl">
          {faqs.map((f, i) => (
            <Item key={f.q} id={i} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </section>

      <CTABanner />
    </>
  )
}
