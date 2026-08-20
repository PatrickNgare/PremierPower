import { FaWhatsapp } from 'react-icons/fa'
import { FiPhone } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import LicenseBadge from '@/components/ui/LicenseBadge'
import { site, isPending, whatsappLink, telLink } from '@/config/site'

export default function CTABanner() {
  const wa = whatsappLink()
  const tel = telLink()
  return (
    <section className="on-dark relative overflow-hidden bg-primary-dark">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-secondary" />
      <div className="container-x grid gap-10 py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-20">
        <div>
          <span className="eyebrow">No obligation</span>
          <h2 className="mt-3 max-w-[18ch] font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
            Find out what is behind your walls. It costs nothing.
          </h2>
          <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-white/70">
            We test the existing installation, photograph what we find, and put the findings
            in writing — including the parts that are fine. No obligation, and no salesperson.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button to="/contact" variant="primaryLg" className="w-full">Book a free site assessment</Button>
          <div className="flex flex-col gap-3 sm:flex-row">
            {wa && (
              <Button href={wa} variant="ghostDark" className="flex-1" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp size={17} aria-hidden="true" /> WhatsApp
              </Button>
            )}
            {tel && (
              <Button href={tel} variant="ghostDark" className="flex-1">
                <FiPhone size={16} aria-hidden="true" /> {String(site.phone)}
              </Button>
            )}
            {isPending(site.phone) && (
              <p className="flex-1 rounded-lg border border-dashed border-white/25 px-4 py-3 text-center text-sm text-white/45">
                Phone number pending
              </p>
            )}
          </div>
          <LicenseBadge tone="dark" className="mt-2 self-start" />
        </div>
      </div>
    </section>
  )
}
