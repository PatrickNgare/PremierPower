import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import PageHero from '@/components/ui/PageHero'
import CTABanner from '@/components/sections/CTABanner'
import Seo from '@/components/Seo'
import { useApi } from '@/hooks/useApi'
import { photo, cdnWidth } from '@/utils/photo'
import { fadeUp, stagger, inView } from '@/utils/motion'

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

/**
 * Practical articles, written in the CMS under Website pages → Insights.
 *
 * With nothing published the page still opens (a link may point here) but
 * says so and stays out of search results; the navigation only links here
 * once there is something to read.
 */
export default function Insights() {
  const { data: posts, loading } = useApi('/blog', [])

  return (
    <>
      <Seo noindex={!loading && posts.length === 0} />
      <PageHero
        crumb="Insights"
        eyebrow="Insights"
        title="Practical notes on electrical work in Kenyan buildings."
        lede="Planning, installing, testing and maintaining electrical systems — written for developers, property managers and the consultants who brief them."
        image={photo('/projects/board-terminations.jpg')}
        imageAlt=""
      />

      <section className="section-tight">
        <div className="container-x">
          {loading ? null : posts.length === 0 ? (
            <p className="text-base text-muted">Nothing published yet.</p>
          ) : (
            <motion.ul variants={stagger(0.06)} {...inView} viewport={{ once: true, amount: 'some' }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((a) => (
                <motion.li key={a.slug} variants={fadeUp}>
                  <Link
                    to={`/insights/${a.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-shadow duration-300 hover:shadow-raise"
                  >
                    {a.cover_url && (
                      <div className="aspect-[16/9] overflow-hidden bg-page-warm">
                        <img src={cdnWidth(a.cover_url, 800)} alt={a.cover_alt || ''} loading="lazy" decoding="async"
                          width="800" height="450"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-semibold text-muted">
                        {[formatDate(a.published_at), a.read_minutes ? `${a.read_minutes} min read` : ''].filter(Boolean).join(' · ')}
                      </p>
                      <h2 className="mt-2 font-display text-lg font-bold text-body">{a.title}</h2>
                      {a.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-body-soft">{a.excerpt}</p>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-accent">
                        Read <ArrowUpRight size={14} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </section>

      <CTABanner />
    </>
  )
}
