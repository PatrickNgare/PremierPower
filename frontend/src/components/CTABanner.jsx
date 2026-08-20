import Button from './Button'
import LicenseBadge from './LicenseBadge'
import { whatsappLink, telLink, site, isPending } from '../config/site'
import { PhoneIcon, WhatsAppIcon } from './Icons'

/**
 * The terminal. The chase run ends here, at the board — so this is where the
 * page's action lives.
 */
export default function CTABanner() {
  const wa = whatsappLink()
  const tel = telLink()
  return (
    <section className="bg-ink-900 on-dark">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <h2 className="max-w-[18ch] text-3xl leading-[1.05] sm:text-4xl">
              Find out what is behind your walls. It costs nothing.
            </h2>
            <p className="secondary mt-5 max-w-[54ch] text-lg leading-relaxed">
              We test the existing installation, photograph what we find, and put the
              findings in writing — including the parts that are fine. No obligation,
              and no salesperson.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button to="/contact" size="lg" className="w-full">Book a free site assessment</Button>
            <div className="flex flex-col gap-3 sm:flex-row">
              {wa && (
                <Button href={wa} variant="onDark" size="lg" className="flex-1" target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon width="20" height="20" /> WhatsApp
                </Button>
              )}
              {tel && (
                <Button href={tel} variant="onDark" size="lg" className="flex-1">
                  <PhoneIcon width="20" height="20" /> {String(site.phone)}
                </Button>
              )}
              {isPending(site.phone) && (
                <p className="flex-1 rounded-xl border border-dashed border-paper-100/30 px-4 py-3 text-sm text-paper-300">
                  Phone number pending
                </p>
              )}
            </div>
            <LicenseBadge tone="dark" className="mt-2 self-start" />
          </div>
        </div>
      </div>
    </section>
  )
}
