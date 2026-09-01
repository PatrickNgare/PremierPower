import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Expand } from 'lucide-react'
import Lightbox from '@/components/ui/Lightbox'
import CTABanner from '@/components/sections/CTABanner'
import Button from '@/components/ui/Button'
import Seo from '@/components/Seo'
import NotFound from '@/pages/NotFound'
import { Skeleton } from '@/components/ui/Skeleton'
import { useApi } from '@/hooks/useApi'
import { fadeUp, inView } from '@/utils/motion'
import { fallbackToLocal } from '@/utils/photo'

/**
 * One fitting.
 *
 * Every optional field is rendered only when it holds something: an empty
 * "Specifications" heading, or a blank price line, tells a visitor the page is
 * unfinished rather than that the detail does not apply.
 */
export default function ProductDetail() {
  const { slug } = useParams()
  const { data: product, loading } = useApi(`/products/${slug}`, null)
  const { data: categories } = useApi('/product-categories', [])
  const { data: all } = useApi('/products', [])
  const [open, setOpen] = useState(null)

  const category = categories.find((c) => c.id === product?.category_id)

  const related = useMemo(() => {
    if (!product) return []
    return all
      .filter((p) => p.id !== product.id && p.category_id === product.category_id && p.image_url)
      .slice(0, 3)
  }, [all, product])

  if (loading) {
    return (
      <div className="container-x py-24">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-6 h-10 w-2/3 max-w-lg" />
        <Skeleton className="mt-10 h-[26rem] w-full rounded-[var(--radius-card)]" />
      </div>
    )
  }

  // An unknown slug is a missing page, not an empty one.
  if (!product) return <NotFound />

  const lightbox = product.image_url
    ? [{ src: product.image_url, alt: product.image_alt || product.name, title: product.name,
         caption: category?.name ?? '' }]
    : []

  return (
    <>
      <Seo
        title={`${product.name} — Lighting & fittings | Premier Power Limited`}
        description={product.summary || `${product.name}, supplied and installed by Premier Power Limited.`}
        canonical={`https://premierpower.co.ke/products/${product.slug}`}
        image={product.image_url}
        type="product"
      />

      <div className="container-x pt-28 sm:pt-32">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-body-soft transition-colors hover:text-accent"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          All lighting &amp; fittings
        </Link>
      </div>

      <section className="section-tight">
        <div className="container-x grid gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div variants={fadeUp} {...inView} className="relative">
            {product.image_url ? (
              <button
                type="button"
                onClick={() => setOpen(0)}
                aria-label={`View ${product.name} larger`}
                className="group relative block w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-page-warm"
              >
                <img onError={fallbackToLocal}
                  src={product.image_url}
                  alt={product.image_alt || product.name}
                  className="mx-auto max-h-[34rem] w-full object-contain p-6 transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
                />
                <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink-800 opacity-0 shadow-lift transition-opacity duration-300 group-hover:opacity-100">
                  <Expand size={16} aria-hidden="true" />
                </span>
              </button>
            ) : (
              <div className="grid h-80 place-items-center rounded-[var(--radius-card)] border border-dashed border-line bg-page-warm text-sm text-muted">
                Photograph required
              </div>
            )}
          </motion.div>

          <motion.div variants={fadeUp} {...inView}>
            {category && <p className="eyebrow">{category.name}</p>}
            <h1 className="mt-4 font-display text-[clamp(1.9rem,3.4vw,2.9rem)] font-extrabold leading-[1.08] text-body">
              {product.name}
            </h1>
            {product.summary && (
              <p className="mt-5 text-lg leading-relaxed text-body-soft">{product.summary}</p>
            )}
            {product.body && (
              <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-body-soft">
                {product.body}
              </p>
            )}

            {product.brand && (
              <p className="mt-6 text-sm text-muted">
                Brand <span className="font-semibold text-body-mid">{product.brand}</span>
              </p>
            )}

            {product.specs?.length > 0 && (
              <dl className="mt-8 divide-y divide-ink-900/8 border-y border-line">
                {product.specs.map((line) => {
                  // Stored as "Label: value" per line; a line without a colon
                  // is shown whole rather than split into a blank label.
                  const at = line.indexOf(':')
                  const [label, value] = at > 0
                    ? [line.slice(0, at).trim(), line.slice(at + 1).trim()]
                    : ['', line]
                  return (
                    <div key={line} className="flex gap-6 py-3 text-sm">
                      {label && <dt className="w-40 shrink-0 text-muted">{label}</dt>}
                      <dd className="font-medium text-body-strong">{value}</dd>
                    </div>
                  )
                })}
              </dl>
            )}

            {product.price_note && (
              <p className="mt-6 text-sm font-semibold text-body-strong">{product.price_note}</p>
            )}

            <div className="mt-9 flex flex-wrap gap-3">
              <Button to="/contact">Enquire about this fitting</Button>
              <Button to="/portfolio" variant="outline">See it installed</Button>
            </div>
          </motion.div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section-tight bg-page-warm">
          <div className="container-x">
            <h2 className="font-display text-xl font-bold text-body">
              More {category ? category.name.toLowerCase() : 'fittings'}
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/products/${p.slug}`}
                    className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-shadow duration-300 hover:shadow-lift"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-page-warm p-3">
                      <img onError={fallbackToLocal}
                        src={p.image_url} alt={p.image_alt || p.name} loading="lazy"
                        className="h-full w-full object-contain transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <p className="p-4 font-display font-bold text-body">{p.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CTABanner />

      <Lightbox
        items={lightbox} index={open}
        onClose={() => setOpen(null)} onIndex={setOpen}
      />
    </>
  )
}
