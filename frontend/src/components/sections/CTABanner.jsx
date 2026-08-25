import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaArrowRight, FaWhatsapp } from 'react-icons/fa'
import { FiPhone } from 'react-icons/fi'
import LicenseBadge from '@/components/ui/LicenseBadge'
import { site, isPending, whatsappLink, telLink } from '@/config/site'

export default function CTABanner() {
  const wa = whatsappLink()
  const tel = telLink()

  return (
    <section className="on-dark noise relative overflow-hidden bg-primary-dark">
      <div aria-hidden="true" className="grid-overlay pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-secondary/20 blur-[100px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-0 h-96 w-96 rounded-full bg-primary-light/40 blur-[120px]" />
      {/* Ghost numeral, the way SpaceInfra anchors its closing banner. */}
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-6 select-none font-heading text-[160px] font-bold leading-none text-white/[0.03]">
        240V
      </span>
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-secondary to-transparent" />

      <div className="container-x relative py-20">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="mb-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary-accent">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-secondary" />
                No obligation
              </span>
            </div>
            <h2 className="mb-5 font-heading text-2xl font-bold leading-[1.06] tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
              Find out what is behind{' '}
              <span className="text-gradient-accent">your walls</span>.
            </h2>
            <p className="mb-10 max-w-md text-base leading-relaxed text-white/50">
              We test the existing installation, photograph what we find, and put the findings
              in writing — including the parts that are fine. No obligation, and no salesperson.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/contact" className="btn-primary-lg group active:scale-[0.97]">
                Book a Free Site Assessment
                <FaArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              {tel ? (
                <a href={tel} className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/20 px-8 py-4 text-base font-medium text-white transition-colors hover:border-white/50 hover:bg-white/[0.08]">
                  <FiPhone size={14} className="text-secondary-accent" aria-hidden="true" />
                  {String(site.phone)}
                </a>
              ) : (
                <span className="inline-flex items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 px-8 py-4 text-base text-white/40">
                  Phone number pending
                </span>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:justify-self-end"
          >
            <div className="glass-stat max-w-sm rounded-2xl p-8">
              <p className="font-heading text-lg font-semibold text-white">What the visit covers</p>
              <ul className="mt-5 space-y-3">
                {[
                  'The consumer unit opened and tested',
                  'Every finding photographed',
                  'Written report, including what is fine',
                  'A dated schedule if work is needed',
                ].map((line) => (
                  <li key={line} className="flex gap-3 text-sm text-white/70">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                    {line}
                  </li>
                ))}
              </ul>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-secondary-accent hover:gap-3 transition-all">
                  <FaWhatsapp size={16} aria-hidden="true" /> Ask on WhatsApp
                </a>
              )}
              <LicenseBadge tone="dark" className="mt-6 w-full" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
