import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, Expand, MapPin, MessageCircle, PhoneCall } from 'lucide-react'
import Prose from '@/components/ui/Prose'
import Lightbox from '@/components/ui/Lightbox'
import CTABanner from '@/components/sections/CTABanner'
import { Skeleton } from '@/components/ui/Skeleton'
import NotFound from '@/pages/NotFound'
import Seo from '@/components/Seo'
import { useApi } from '@/hooks/useApi'
import { useSite } from '@/hooks/useSite'
import { telLink, whatsappLink } from '@/config/site'
import { cdnSrcSet, cdnWidth, fallbackToLocal } from '@/utils/photo'
import { fadeUp, stagger, inView } from '@/utils/motion'
import { projectIsIndexable, projectMeta } from '@/seo/pages'

/**
 * One project, at /portfolio/<slug>: the case study a main contractor or
 * developer reads before shortlisting.
 *
 * Everything comes from the project's CMS entry (Projects): title, location,
 * status, summary, the full write-up, the main and second photographs and the
 * gallery. Nothing here is written for the company. A project without a
 * write-up and a photograph still opens, but stays out of search results
 * (projectIsIndexable) until it has them.
 */
export default function ProjectDetail() {
  const { slug } = useParams()
  const { data: project, loading } = useApi(`/projects/${slug}`, null)
  const { data: all } = useApi('/projects', [])
  const site = useSite()
  const [open, setOpen] = useState(null)

  const photos = useMemo(() => {
    if (!project) return []
    return [
      project.image_open_url && { src: project.image_open_url, alt: project.image_open_alt },
      project.image_finished_url && { src: project.image_finished_url, alt: project.image_finished_alt },
      ...(project.gallery ?? []).map((g) => ({ src: g.url, alt: g.alt })),
    ].filter(Boolean).map((p) => ({ ...p, title: project.title, caption: project.location }))
  }, [project])

  if (loading) {
    return (
      <div className="container-x py-28">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-6 h-10 w-2/3 max-w-lg" />
        <Skeleton className="mt-10 h-[24rem] w-full rounded-[var(--radius-card)]" />
      </div>
    )
  }
  if (!project) return <NotFound />

  const [lead, ...rest] = photos
  const more = all.filter((p) => p.slug !== project.slug && p.image_open_url).slice(0, 3)
  const tel = telLink(site)
  const wa = whatsappLink(`Hello, I saw the ${project.title} project and would like to talk about a similar job.`, site)
  const facts = [['Location', project.location], ['Status', project.year]].filter(([, v]) => v)

  return (
    <>
      <Seo
        {...projectMeta(project)}
        image={project.image_open_url || undefined}
        noindex={!projectIsIndexable(project)}
        trail={[['Installations', '/portfolio'], [project.title, `/portfolio/${project.slug}`]]}
      />

      <article className="container-x pb-16 pt-28 sm:pt-32">
        <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm font-semibold text-body-soft transition-colors hover:text-accent">
          <ArrowLeft size={15} aria-hidden="true" /> All installations
        </Link>

        <header className="mt-8 max-w-3xl">
          <p className="eyebrow">Project</p>
          <h1 className="mt-3 text-[clamp(2rem,4.4vw,3.2rem)] font-extrabold text-body">{project.title}</h1>
          {project.location && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-body-soft">
              <MapPin size={16} aria-hidden="true" className="text-[rgb(var(--accent-rgb))]" /> {project.location}
            </p>
          )}
        </header>

        {lead && (
          <figure className="relative mt-10 overflow-hidden rounded-[var(--radius-card)] bg-page-warm">
            <img
              onError={fallbackToLocal}
              src={cdnWidth(lead.src, 1600)} srcSet={cdnSrcSet(lead.src, [640, 960, 1280, 1600, 1920])}
              sizes="(min-width: 1280px) 76rem, 100vw" alt={lead.alt || project.title}
              width="1600" height="900" fetchPriority="high" decoding="async"
              className="aspect-[16/9] h-auto w-full object-cover"
            />
            <button
              type="button" onClick={() => setOpen(0)}
              aria-label={`View ${project.title} photographs larger`}
              className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-ink-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-colors hover:bg-ink-950/75"
            >
              <Expand size={13} aria-hidden="true" /> {photos.length > 1 ? `${photos.length} photos` : 'Enlarge'}
            </button>
          </figure>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="max-w-3xl">
            {project.summary && <p className="text-lg leading-relaxed text-body">{project.summary}</p>}
            <Prose text={project.body} className={project.summary ? 'mt-6' : ''} />

            {rest.length > 0 && (
              <section aria-labelledby="gallery" className="mt-12">
                <h2 id="gallery" className="font-display text-2xl font-bold text-body">Photographs</h2>
                <motion.ul variants={stagger(0.05)} {...inView} viewport={{ once: true, amount: 'some' }}
                  className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {rest.map((p, i) => (
                    <motion.li key={p.src} variants={fadeUp}>
                      <button
                        type="button" onClick={() => setOpen(i + 1)}
                        aria-label={`View photograph ${i + 2} of ${photos.length} larger`}
                        className="group block aspect-[4/3] w-full overflow-hidden rounded-xl bg-page-warm"
                      >
                        <img
                          onError={fallbackToLocal} src={cdnWidth(p.src, 640)} alt={p.alt || ''}
                          loading="lazy" decoding="async" width="640" height="480"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </button>
                    </motion.li>
                  ))}
                </motion.ul>
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            {facts.length > 0 && (
              <dl className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
                {facts.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-5 py-3.5 text-sm">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right font-semibold text-body">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="rounded-[var(--radius-card)] border border-line bg-page-warm p-6">
              <h2 className="font-display text-lg font-bold text-body">Planning something similar?</h2>
              <p className="mt-2 text-sm leading-relaxed text-body-soft">
                Send drawings or a short description and we will come back with scope and next steps.
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                <Link to="/contact" className="btn-primary justify-center">Request a quote</Link>
                {tel && (
                  <a href={tel} className="btn-outline inline-flex items-center justify-center gap-2">
                    <PhoneCall size={15} aria-hidden="true" /> Call us
                  </a>
                )}
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline inline-flex items-center justify-center gap-2">
                    <MessageCircle size={15} aria-hidden="true" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>

        {more.length > 0 && (
          <nav aria-labelledby="more-projects" className="mt-20 border-t border-line pt-10">
            <h2 id="more-projects" className="font-display text-2xl font-bold text-body">More projects</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {more.map((p) => (
                <li key={p.slug}>
                  <Link to={`/portfolio/${p.slug}`} className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-shadow hover:shadow-raise">
                    <div className="aspect-[4/3] overflow-hidden bg-page-warm">
                      <img onError={fallbackToLocal} src={cdnWidth(p.image_open_url, 640)} alt="" loading="lazy" decoding="async"
                        width="640" height="480" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-body">{p.title}</h3>
                        {p.location && <p className="mt-0.5 text-sm text-muted">{p.location}</p>}
                      </div>
                      <ArrowUpRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </article>

      <Lightbox items={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
      <CTABanner />
    </>
  )
}
