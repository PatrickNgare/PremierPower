import { FaWhatsapp } from 'react-icons/fa'
import { FiPhone, FiMapPin, FiClock, FiStar } from 'react-icons/fi'
import PageHero from '@/components/ui/PageHero'
import ContactForm from '@/components/sections/ContactForm'
import LicenseBadge from '@/components/ui/LicenseBadge'
import { isPending, value, whatsappLink, telLink } from '@/config/site'
import { photo } from '@/utils/photo'
import { useSite } from '@/hooks/useSite'
import Seo from '@/components/Seo'
import { usePageSections } from '@/hooks/usePage'

export default function Contact() {
  const sections = usePageSections('/contact')
  const hero = sections.hero
  const site = useSite()
  const wa = whatsappLink(site)
  const tel = telLink(site)

  return (
    <>
      <Seo />
      <PageHero
        crumb={hero?.config?.crumb || "Contact"}
        eyebrow={hero?.eyebrow || "Project enquiries"}
        title={hero?.title || "Tell us about the project."}
        lede={hero?.subtitle || "Send drawings, a tender document or a short description and we will come back with scope and next steps. Site visits and assessments are free, with no obligation."}
        image={hero?.image_url || photo('/projects/technician.jpg')}
        imageAlt={hero?.image_alt || "Electrician in a hard hat working on a wall-mounted supply"}
      />

      <section className="section">
        <div className="container-x grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="font-display text-2xl font-bold text-body">Reach us directly</h2>
            <p className="mt-3 max-w-sm leading-relaxed text-body-soft">
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

            <ul className="mt-10 space-y-5 border-t border-line pt-8 text-sm">
              <li className="flex gap-3">
                <FiMapPin size={16} className="mt-0.5 shrink-0 text-[rgb(var(--accent-rgb))]" aria-hidden="true" />
                <address className="not-italic text-body-soft">
                  {isPending(site.street) ? 'Address pending' : `${value(site.street)}, ${value(site.locality)}`}<br />
                  {isPending(site.serviceArea) ? '' : value(site.serviceArea)}
                  {!isPending(site.street) && (
                    <>
                      <br />
                      {/* The Google Business Profile rather than an embedded map:
                          no heavy iframe, it opens the visitor's own maps app on
                          the real listing, and directions are one tap from there. */}
                      <a
                        href={site.googleProfile || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${value(site.street)}, ${value(site.locality)}, Kenya`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="mt-1 inline-block font-semibold text-accent underline-offset-2 hover:underline"
                      >
                        Get directions
                      </a>
                    </>
                  )}
                </address>
              </li>
              <li className="flex gap-3">
                <FiClock size={16} className="mt-0.5 shrink-0 text-[rgb(var(--accent-rgb))]" aria-hidden="true" />
                <span className="text-body-soft">Monday to Friday, 8am – 5pm<br />Saturday by arrangement</span>
              </li>
              {site.googleReview && (
                <li className="flex gap-3">
                  <FiStar size={16} className="mt-0.5 shrink-0 text-[rgb(var(--accent-rgb))]" aria-hidden="true" />
                  <span className="text-body-soft">
                    Worked with us?{' '}
                    <a href={site.googleReview} target="_blank" rel="noopener noreferrer"
                      className="font-semibold text-accent underline-offset-2 hover:underline">
                      Leave a review on Google
                    </a>
                  </span>
                </li>
              )}
            </ul>

            <LicenseBadge className="mt-8" />
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  )
}
