import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { useSeoFor } from '@/hooks/useSeo'

const SITE_NAME = 'Premier Power Limited'

/**
 * A page's search and sharing tags.
 *
 * Props are what the page ships with; anything the CMS holds for this route
 * wins. The fallback is not a placeholder — it is the copy the page was
 * written with, so an unreachable API costs nothing.
 *
 * `noindex` is honoured here as well as in the sitemap. Removing a page from
 * the sitemap only stops it being suggested; the meta tag is what stops it
 * being indexed when something else links to it.
 */
export default function Seo({ title, description, image, canonical, type = 'website' }) {
  const { pathname } = useLocation()
  const cms = useSeoFor(pathname)

  const finalTitle = cms?.title?.trim() || title
  const finalDescription = cms?.description?.trim() || description
  const finalImage = cms?.og_image_url?.trim() || image
  const finalCanonical = cms?.canonical?.trim() || canonical
  const noindex = Boolean(cms?.noindex)

  return (
    <Helmet>
      {finalTitle && <title>{finalTitle}</title>}
      {finalDescription && <meta name="description" content={finalDescription} />}
      {finalCanonical && <link rel="canonical" href={finalCanonical} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {finalTitle && <meta property="og:title" content={finalTitle} />}
      {finalDescription && <meta property="og:description" content={finalDescription} />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      {finalImage && <meta property="og:image" content={finalImage} />}
      {finalCanonical && <meta property="og:url" content={finalCanonical} />}

      {/* A share card with no image is a grey box, so the card type follows
          whether there is actually an image to show. */}
      <meta name="twitter:card" content={finalImage ? 'summary_large_image' : 'summary'} />
      {finalTitle && <meta name="twitter:title" content={finalTitle} />}
      {finalDescription && <meta name="twitter:description" content={finalDescription} />}
      {finalImage && <meta name="twitter:image" content={finalImage} />}
    </Helmet>
  )
}
