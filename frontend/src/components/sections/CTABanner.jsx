import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, PhoneCall, MessageCircle } from 'lucide-react'
import Magnetic from '@/components/ui/Magnetic'
import LicenseBadge from '@/components/ui/LicenseBadge'
import { whatsappLink, telLink } from '@/config/site'
import { useSite } from '@/hooks/useSite'

const EASE = [0.22, 1, 0.36, 1]

/**
 * Closing call to action. Light behaves as the background material: two warm
 * pools drift slowly behind the type, and a beam crosses the band. All of it
 * stops under prefers-reduced-motion.
 */
export default function CTABanner() {
  const site = useSite()
  const reduce = useReducedMotion()
  const wa = whatsappLink(site)
  const tel = telLink(site)

  return (
    <section className="on-dark relative isolate overflow-hidden bg-ink-950">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        animate={reduce ? {} : { opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(46rem 30rem at 18% 8%, rgb(245 201 123 / 0.24), transparent 62%)' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        animate={reduce ? {} : { opacity: [0.8, 0.4, 0.8] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(34rem 24rem at 86% 92%, rgb(255 59 47 / 0.18), transparent 64%)' }}
      />
      <div aria-hidden="true" className="light-beam animate-beam absolute inset-0 -z-10 motion-reduce:animate-none" />
      <div aria-hidden="true" className="grain absolute inset-0 -z-10" />
      <div aria-hidden="true" className="rule-fade absolute inset-x-0 top-0 h-px text-lumen-500/45" />

      <div className="container-x section">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold text-white">
            Let's illuminate
            <span className="text-glow bg-gradient-to-r from-lumen-300 to-lumen-700 bg-clip-text text-transparent">
              {' '}your next project.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
            From electrical infrastructure to architectural lighting — let's build a safer,
            smarter and better-lit space.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Link to="/contact" className="btn-primary group">
                Request a quote
                <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-1.5 group-active:duration-150" aria-hidden="true" />
              </Link>
            </Magnetic>
            <Magnetic>
              {tel ? (
                <a href={tel} className="btn-ghost">
                  <PhoneCall size={16} aria-hidden="true" />
                  {String(site.phone)}
                </a>
              ) : (
                <Link to="/contact" className="btn-ghost">Contact our team</Link>
              )}
            </Magnetic>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <MessageCircle size={16} aria-hidden="true" />
                WhatsApp
              </a>
            )}
          </div>

          <div className="mt-10 flex justify-center">
            <LicenseBadge tone="dark" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
