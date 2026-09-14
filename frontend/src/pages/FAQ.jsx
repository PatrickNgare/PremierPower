import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, PhoneCall } from 'lucide-react'
import PageHero from '@/components/ui/PageHero'
import SectionHeader from '@/components/ui/SectionHeader'
import CTABanner from '@/components/sections/CTABanner'
import Seo from '@/components/Seo'
import { useApi } from '@/hooks/useApi'
import { faqs as fallbackFaqs } from '@/data/faqs'
import { photo } from '@/utils/photo'
import { usePageSections } from '@/hooks/usePage'
import { useSite } from '@/hooks/useSite'
import { telLink, whatsappLink } from '@/config/site'
import { fadeUp, stagger, inView } from '@/utils/motion'

/**
 * One question.
 *
 * Closed, it is a quiet surface. Open, it takes the warm light the rest of the
 * site uses to mark the live thing — the same lumen wash as the hero and the
 * lighting section, not a new highlight colour invented for this page.
 */
function Item({ q, a, open, onToggle, id }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`overflow-hidden rounded-[var(--radius-card)] border transition-colors duration-300 ${
        open ? 'border-lumen-700/35 bg-lumen-100' : 'border-line bg-surface hover:border-line'
      }`}
    >
      <h3>
        <button
          type="button" onClick={onToggle} aria-expanded={open} aria-controls={`faq-${id}`}
          className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left sm:px-6"
        >
          <span className={`font-display text-base font-bold leading-snug sm:text-lg ${
            open ? 'text-body' : 'text-body-strong'
          }`}>
            {q}
          </span>
          <span
            aria-hidden="true"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
              open
                ? 'bg-[rgb(var(--accent-rgb))] text-white'
                : 'bg-page-warm text-[rgb(var(--accent-rgb))]'
            }`}
          >
            {/* One plus sign whose upright folds away as the answer opens,
                rather than two icons swapped in a frame: the mark changes in
                step with the panel it describes. */}
            <span className="relative block h-2.5 w-2.5">
              <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-current" />
              <span
                className={`absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-current transition-transform duration-200 ease-out motion-reduce:transition-none ${
                  open ? 'scale-y-0' : 'scale-y-100'
                }`}
              />
            </span>
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-6 text-[0.95rem] leading-relaxed text-body-soft sm:px-6 sm:pr-16">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQ() {
  const sections = usePageSections('/faq')
  const hero = sections.hero
  const site = useSite()
  const [open, setOpen] = useState(0)
  const { data } = useApi('/faqs', fallbackFaqs)
  // The API returns question/answer; the bundled fallback uses q/a.
  const faqs = data.map((f) => ({ q: f.q ?? f.question, a: f.a ?? f.answer }))
  const tel = telLink(site)
  const wa = whatsappLink(undefined, site)

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
      <Seo
        title="Questions — registration, sectors and how we work | Premier Power Limited"
        description="Are you registered? Which sectors do you work in? Do you work with main contractors and architects? Straight answers about electrical installation across Kenya."
        canonical="https://premierpower.co.ke/faq"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        crumb={hero?.config?.crumb || 'FAQ'}
        eyebrow={hero?.eyebrow || 'Straight answers'}
        title={hero?.title || 'The questions people actually ask.'}
        lede={hero?.subtitle || 'Mostly about licensing. Almost never about price first — which is the right instinct.'}
        image={hero?.image_url || photo('/projects/lodge-dusk.jpg')}
        imageAlt={hero?.image_alt || 'Completed development at dusk'}
      />

      <section className="section-tight">
        {/* Two columns rather than one narrow centred stack. The list was
            768px wide in a 1440px viewport with roughly 450px of dead space
            each side, which read as an unfinished page. The left column now
            holds the frame and the way out, and tracks the list on scroll. */}
        <motion.div
          variants={stagger(0.05)} {...inView}
          className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"
        >
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeader
              eyebrow="Before you ask"
              title="Straight answers, in plain words."
              lede="If the answer you need is not here, the quickest route is to ask a person."
            />

            <motion.div
              variants={fadeUp}
              className="mt-8 rounded-[var(--radius-card)] border border-line bg-page-warm p-6"
            >
              <p className="font-display text-base font-bold text-body">Still not answered?</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Send drawings or a short description and we will come back with scope and next
                steps. Site visits are free.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {tel && (
                  <a href={tel} className="btn-onlight !px-4 !py-2.5 text-sm">
                    <PhoneCall size={15} aria-hidden="true" />
                    Call us
                  </a>
                )}
                {wa && (
                  <a href={wa} target="_blank" rel="noopener" className="btn-onlight !px-4 !py-2.5 text-sm">
                    <MessageCircle size={15} aria-hidden="true" />
                    WhatsApp
                  </a>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <Item
                key={f.q} id={i} q={f.q} a={f.a}
                open={open === i}
                onToggle={() => setOpen(open === i ? -1 : i)}
              />
            ))}
          </div>
        </motion.div>
      </section>

      <CTABanner />
    </>
  )
}
