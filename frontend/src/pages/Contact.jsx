import { Helmet } from 'react-helmet-async'
import { FaWhatsapp } from 'react-icons/fa'
import { FiPhone, FiMapPin, FiClock } from 'react-icons/fi'
import PageHero from '@/components/ui/PageHero'
import ContactForm from '@/components/sections/ContactForm'
import LicenseBadge from '@/components/ui/LicenseBadge'
import { isPending, value, whatsappLink, telLink } from '@/config/site'
import { photo } from '@/utils/photo'
import { useSite } from '@/hooks/useSite'

export default function Contact() {
  const site = useSite()
  const wa = whatsappLink(site)
  const tel = telLink(site)

  return (
    <>
      <Helmet>
        <title>Request a quote — project enquiries | Premier Power</title>
        <meta name="description" content="Send project drawings, tender documents or a description to Premier Power Limited — NCA-registered electrical engineering contractor working across Kenya. Free site visits, no obligation." />
        <link rel="canonical" href="https://premierpower.co.ke/contact" />
      </Helmet>

      <PageHero
        image={photo('/projects/resort-pool.jpg')} imageAlt="Completed resort development"
        crumb="Contact" eyebrow="Project enquiries"
        title="Tell us about the project."
        lede="Send drawings, a tender document or a short description and we will come back with scope and next steps. Site visits and assessments are free, with no obligation."
      />

      <section className="section">
        <div className="container-x grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900">Reach us directly</h2>
            <p className="mt-3 max-w-sm leading-relaxed text-ink-600">
              For tender documents, drawings or a site visit, call or message — we answer
              enquiries the same day wherever we can.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-onlight justify-start">
                  <FaWhatsapp size={18} aria-hidden="true" /> WhatsApp us
                </a>
              )}
              {tel && (
                <a href={tel} className="btn-onlight justify-start">
                  <FiPhone size={16} aria-hidden="true" /> {String(site.phone)}
                </a>
              )}
            </div>

            <ul className="mt-10 space-y-5 border-t border-ink-900/10 pt-8 text-sm">
              <li className="flex gap-3">
                <FiMapPin size={16} className="mt-0.5 shrink-0 text-[rgb(var(--accent-rgb))]" aria-hidden="true" />
                <span className="text-ink-600">
                  {isPending(site.street) ? 'Address pending' : value(site.street)}<br />
                  {isPending(site.serviceArea) ? '' : value(site.serviceArea)}
                </span>
              </li>
              <li className="flex gap-3">
                <FiClock size={16} className="mt-0.5 shrink-0 text-[rgb(var(--accent-rgb))]" aria-hidden="true" />
                <span className="text-ink-600">Monday to Friday, 8am – 5pm<br />Saturday by arrangement</span>
              </li>
            </ul>

            <LicenseBadge className="mt-8" />
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  )
}
