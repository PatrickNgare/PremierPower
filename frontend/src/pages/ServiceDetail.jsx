import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, MessageCircle, PhoneCall } from 'lucide-react'
import PageHero from '@/components/ui/PageHero'
import Prose from '@/components/ui/Prose'
import CTABanner from '@/components/sections/CTABanner'
import { Skeleton } from '@/components/ui/Skeleton'
import NotFound from '@/pages/NotFound'
import Seo from '@/components/Seo'
import { useApi } from '@/hooks/useApi'
import { useSite } from '@/hooks/useSite'
import { telLink, whatsappLink } from '@/config/site'
import { photo } from '@/utils/photo'
import { fadeUp, inView } from '@/utils/motion'
import { serviceIsIndexable, serviceMeta, serviceSchema } from '@/seo/pages'

/** A photograph per service line until the CMS holds one of its own. */
const PHOTO = {
  'electrical-installation': '/projects/board-terminations.jpg',
  'security-systems': '/projects/technical.jpg',
  'solar-power': '/projects/eco-units.jpg',
  'power-continuity': '/projects/panel-contactors.jpg',
  'vertical-transport': '/projects/stairwell.jpg',
  'power-infrastructure': '/projects/testing.jpg',
  'energy-efficiency': '/projects/interior.jpg',
  'mechanical-gas': '/projects/technician.jpg',
}

/**
 * One service line, at /services/<slug>.
 *
 * Everything on it comes from the service's CMS entry (Settings → Services):
 * its title, short line and description. Nothing is written here that the
 * company has not said itself. A description too short to stand as a page of
 * its own still opens for visitors but is marked noindex until it grows (see
 * SERVICE_PAGE_MIN_CHARS), so search engines never judge the site on it.
 */
export default function ServiceDetail() {
  const { slug } = useParams()
  const { data: service, loading } = useApi(`/services/${slug}`, null)
  const { data: all } = useApi('/services', [])
  const site = useSite()
  const tel = telLink(site)
  const wa = whatsappLink(service ? `Hello, I'd like to talk about ${service.title.toLowerCase()} for a project.` : undefined, site)

  if (loading) {
    return (
      <div className="container-x py-28">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-6 h-10 w-2/3 max-w-lg" />
        <Skeleton className="mt-10 h-48 w-full max-w-3xl" />
      </div>
    )
  }
  if (!service) return <NotFound />

  const others = all.filter((s) => s.slug !== service.slug)
  const indexable = serviceIsIndexable(service)

  return (
    <>
      <Seo
        {...serviceMeta(service)}
        image={service.image_url || undefined}
        noindex={!indexable}
        trail={[['Services', '/services'], [service.title, `/services/${service.slug}`]]}
        jsonLd={indexable ? [serviceSchema(service)] : []}
      />
      <PageHero
        crumb={service.title}
        eyebrow="Service line"
        title={service.title}
        lede={service.lede}
        image={service.image_url || photo(PHOTO[service.slug] ?? '/projects/board-terminations.jpg')}
        imageAlt=""
      />

      <section className="section-tight">
        <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <motion.article variants={fadeUp} {...inView} className="max-w-3xl">
            <Prose text={service.body} />

            <div className="mt-10 rounded-[var(--radius-card)] border border-line bg-page-warm p-6 sm:p-7">
              <h2 className="font-display text-xl font-bold text-body">
                Talk to us about {service.title.toLowerCase()}
              </h2>
              <p className="mt-2 text-body-soft">
                Send drawings, a tender document or a short description and we will come back with
                scope and next steps. Site visits are free.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/contact" className="btn-primary">Request a quote</Link>
                {tel && (
                  <a href={tel} className="btn-outline inline-flex items-center gap-2">
                    <PhoneCall size={16} aria-hidden="true" /> Call us
                  </a>
                )}
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline inline-flex items-center gap-2">
                    <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </motion.article>

          {others.length > 0 && (
            <aside aria-labelledby="other-services">
              <h2 id="other-services" className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">
                Other service lines
              </h2>
              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                {others.map((s) => (
                  <li key={s.slug}>
                    <Link
                      to={`/services/${s.slug}`}
                      className="group flex items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-body transition-colors hover:bg-page-warm"
                    >
                      {s.title}
                      <ArrowUpRight size={15} aria-hidden="true" className="shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/portfolio" className="link-arrow mt-5 inline-flex">
                See completed installations <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </aside>
          )}
        </div>
      </section>

      <CTABanner />
    </>
  )
}
