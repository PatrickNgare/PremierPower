import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { useSeoFor } from '@/hooks/useSeo'
import { DEFAULT_IMAGE, PAGES, SITE_NAME, SITE_URL, breadcrumbs } from '@/seo/pages'

/**
 * A page's search and sharing tags.
 *
 * Order of precedence: what the CMS holds for this path (Settings → SEO),
 * then the props a page passes, then the defaults in src/seo/pages.js.
 *
 * The same tags are written into each page's HTML at build time by
 * scripts/seo-html.mjs, carrying the data-rh attribute Helmet uses for the
 * tags it owns, so Helmet replaces them on load instead of duplicating them.
 *
 * `noindex` is honoured here as well as in the sitemap. Removing a page from
 * the sitemap only stops it being suggested; the meta tag is what stops it
 * being indexed when something else links to it.
 *
 * `trail` adds BreadcrumbList data: [['Services', '/services'], ['Solar', '/services/solar']].
 * Home is prepended. `jsonLd` takes any further structured data objects.
 */
export default function Seo({
  title, description, image, canonical, type = 'website', noindex: forceNoindex = false,
  trail, jsonLd = [],
}) {
  const { pathname } = useLocation()
  const cms = useSeoFor(pathname)
  const page = PAGES[pathname] ?? {}

  const finalTitle = cms?.title?.trim() || title || page.title
  const finalDescription = cms?.description?.trim() || description || page.description
  const finalImage = cms?.og_image_url?.trim() || image || DEFAULT_IMAGE
  // Canonical is always the clean https://premierpower.co.ke address of this
  // page, never whatever the visitor arrived on (tracking parameters, a
  // trailing slash, the vercel.app address).
  const finalCanonical = cms?.canonical?.trim() || canonical || `${SITE_URL}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`
  const noindex = forceNoindex || Boolean(cms?.noindex)

  const crumbs = trail ?? (page.crumb && pathname !== '/' ? [[page.crumb, pathname]] : null)
  const data = [
    ...(crumbs ? [breadcrumbs([['Home', '/'], ...crumbs])] : []),
    ...jsonLd,
  ]

  return (
    <Helmet>
      {finalTitle && <title>{finalTitle}</title>}
      {finalDescription && <meta name="description" content={finalDescription} />}
      {!noindex && <link rel="canonical" href={finalCanonical} />}
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'} />

      {finalTitle && <meta property="og:title" content={finalTitle} />}
      {finalDescription && <meta property="og:description" content={finalDescription} />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_KE" />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:image" content={finalImage} />

      <meta name="twitter:card" content="summary_large_image" />
      {finalTitle && <meta name="twitter:title" content={finalTitle} />}
      {finalDescription && <meta name="twitter:description" content={finalDescription} />}
      <meta name="twitter:image" content={finalImage} />

      {data.map((d, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(d)}</script>
      ))}
    </Helmet>
  )
}
