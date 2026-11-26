import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Prose from '@/components/ui/Prose'
import CTABanner from '@/components/sections/CTABanner'
import { Skeleton } from '@/components/ui/Skeleton'
import NotFound from '@/pages/NotFound'
import Seo from '@/components/Seo'
import { useApi } from '@/hooks/useApi'
import { cdnWidth, cdnSrcSet } from '@/utils/photo'
import { articleSchema, postMeta } from '@/seo/pages'
import { formatDate } from '@/pages/Insights'

/** One article, at /insights/<slug>. */
export default function InsightDetail() {
  const { slug } = useParams()
  const { data: post, loading } = useApi(`/blog/${slug}`, null)
  const { data: all } = useApi('/blog', [])

  if (loading) {
    return (
      <div className="container-x py-28">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-6 h-10 w-2/3 max-w-lg" />
        <Skeleton className="mt-10 h-64 w-full max-w-3xl" />
      </div>
    )
  }
  if (!post) return <NotFound />

  const more = all.filter((a) => a.slug !== post.slug).slice(0, 3)

  return (
    <>
      <Seo
        {...postMeta(post)}
        type="article"
        image={post.cover_url || undefined}
        trail={[['Insights', '/insights'], [post.title, `/insights/${post.slug}`]]}
        jsonLd={[articleSchema(post)]}
      />

      <article className="container-x pb-16 pt-28 sm:pt-32">
        <div className="mx-auto max-w-3xl">
          <Link to="/insights" className="inline-flex items-center gap-2 text-sm font-semibold text-body-soft transition-colors hover:text-accent">
            <ArrowLeft size={15} aria-hidden="true" /> All insights
          </Link>
          <p className="mt-8 text-sm font-semibold text-muted">
            {[formatDate(post.published_at), post.author, post.read_minutes ? `${post.read_minutes} min read` : ''].filter(Boolean).join(' · ')}
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4.4vw,3.2rem)] font-extrabold text-body">{post.title}</h1>
          {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-body-soft">{post.excerpt}</p>}
        </div>

        {post.cover_url && (
          <figure className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-[var(--radius-card)] bg-page-warm">
            <img
              src={cdnWidth(post.cover_url, 1280)} srcSet={cdnSrcSet(post.cover_url, [640, 960, 1280, 1600])}
              sizes="(min-width: 1024px) 64rem, 100vw" alt={post.cover_alt || ''}
              width="1280" height="720" decoding="async" fetchPriority="high"
              className="h-auto w-full object-cover"
            />
          </figure>
        )}

        <div className="mx-auto mt-10 max-w-3xl">
          <Prose text={post.body} />

          <div className="mt-12 rounded-[var(--radius-card)] border border-line bg-page-warm p-6 sm:p-7">
            <h2 className="font-display text-xl font-bold text-body">Planning a project?</h2>
            <p className="mt-2 text-body-soft">
              Send drawings or a short description and we will come back with scope and next steps.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/contact" className="btn-primary">Request a quote</Link>
              <Link to="/services" className="btn-outline">Explore our services</Link>
            </div>
          </div>

          {more.length > 0 && (
            <nav aria-labelledby="more-insights" className="mt-12">
              <h2 id="more-insights" className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">More insights</h2>
              <ul className="mt-3 space-y-2">
                {more.map((a) => (
                  <li key={a.slug}>
                    <Link to={`/insights/${a.slug}`} className="font-semibold text-body hover:text-accent">{a.title}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </article>

      <CTABanner />
    </>
  )
}
