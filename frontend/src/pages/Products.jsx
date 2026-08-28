import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import PageHero from '@/components/ui/PageHero'
import CTABanner from '@/components/sections/CTABanner'
import SectionHeader from '@/components/ui/SectionHeader'
import Seo from '@/components/Seo'
import VideoTile from '@/components/ui/VideoTile'
import { useApi } from '@/hooks/useApi'
import { usePageSections } from '@/hooks/usePage'
import { useSectionItems } from '@/hooks/useSection'
import { photo } from '@/utils/photo'
import { fadeUp, stagger, inView } from '@/utils/motion'

/**
 * The fittings showcase.
 *
 * A uniform grid, unlike the composed ones elsewhere on the site. These are
 * catalogue shots of single objects at a consistent scale, and varying the
 * tile size makes one fitting look bigger than another rather than more
 * important. Every tile links to its own page.
 *
 * Below it, a rail of showroom clips — deliberately separate from the grid,
 * because the clips show stock hanging in the showroom rather than any of the
 * catalogued fittings.
 */
export default function Products() {
  const sections = usePageSections('/products')
  const hero = sections.hero
  const reel = sections.reel
  const clips = useSectionItems('reel', []).filter((c) => c.video_url)

  const { data: products, loading } = useApi('/products', [])
  const { data: categories } = useApi('/product-categories', [])
  const [active, setActive] = useState('')

  const shown = useMemo(
    () => (active ? products.filter((p) => p.category_id === active) : products),
    [products, active],
  )

  // Only offer a filter for categories that actually hold something. A chip
  // that always returns an empty grid is worse than no chip.
  const used = useMemo(() => {
    const ids = new Set(products.map((p) => p.category_id))
    return categories.filter((c) => ids.has(c.id))
  }, [categories, products])

  const nameOf = (id) => categories.find((c) => c.id === id)?.name ?? ''

  return (
    <>
      <Seo
        title="Lighting &amp; fittings — Premier Power Limited"
        description="Chandeliers, pendants and linear lighting supplied and installed across Kenya for hospitality, commercial interiors and residential developments."
        canonical="https://premierpower.co.ke/products"
      />
      <PageHero
        crumb={hero?.config?.crumb || 'Lighting & fittings'}
        eyebrow={hero?.eyebrow || 'Lighting & fittings'}
        title={hero?.title || 'The fittings we supply and install.'}
        lede={hero?.subtitle || 'Chandeliers, pendants and linear lighting for hospitality, commercial interiors and residential developments — specified with the interior, then wired, hung and commissioned by the same contractor.'}
        image={hero?.image_url || photo('/projects/stairwell.jpg')}
        imageAlt={hero?.image_alt || 'Feature lighting installation in a completed stairwell'}
      />

      <section className="section-tight">
        <div className="container-x">
          {used.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <FilterChip on={active === ''} onClick={() => setActive('')}>
                Everything
              </FilterChip>
              {used.map((c) => (
                <FilterChip key={c.id} on={active === c.id} onClick={() => setActive(c.id)}>
                  {c.name}
                </FilterChip>
              ))}
            </div>
          )}

          {loading ? null : shown.length === 0 ? (
            <p className="mt-12 text-base text-ink-400">
              Nothing to show here yet.
            </p>
          ) : (
            <motion.ul
              variants={stagger(0.06)}
              {...inView}
              className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
            >
              {shown.map((p, i) => (
                <motion.li key={p.id} variants={fadeUp}>
                  <Link
                    to={`/products/${p.slug}`}
                    className="group block h-full overflow-hidden rounded-[var(--radius-card)] border border-ink-900/10 bg-white transition-shadow duration-300 hover:shadow-raise"
                  >
                    {/* contain, not cover, on a uniform portrait tile. These
                        are catalogue shots of a single object, most of them
                        portrait: cropping to fill lops the top off a
                        chandelier, which is the part someone is looking at. */}
                    <div className="aspect-[4/5] overflow-hidden bg-paper-warm p-4">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.image_alt || p.name}
                          loading={i < 3 ? 'eager' : 'lazy'}
                          decoding="async"
                          className="h-full w-full object-contain transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-sm text-ink-400">
                          Photograph required
                        </span>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-3 p-5">
                      <div className="min-w-0">
                        {p.category_id && (
                          <p className="eyebrow !mb-1.5">{nameOf(p.category_id)}</p>
                        )}
                        <h2 className="font-display text-lg font-bold text-ink-900">{p.name}</h2>
                        {p.summary && (
                          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-600">
                            {p.summary}
                          </p>
                        )}
                      </div>
                      <ArrowUpRight
                        size={17} aria-hidden="true"
                        className="mt-1 shrink-0 text-ink-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-deep"
                      />
                    </div>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </section>

      {reel && clips.length > 0 && (
        <section className="section-tight bg-paper-warm">
          <div className="container-x">
            <SectionHeader
              eyebrow={reel.eyebrow || 'In the showroom'}
              title={reel.title || 'Seen in the showroom.'}
              lede={reel.subtitle}
            />
            {/* A rail rather than a grid. The clips are 9:16, and a row of
                phone-shaped tiles is the one layout where that reads as
                deliberate instead of as a mistake. */}
            <ul
              className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
              aria-label="Showroom clips"
            >
              {clips.map((c) => (
                <li key={c.id} className="w-[15rem] shrink-0 snap-start sm:w-[17rem]">
                  <VideoTile
                    src={c.video_url}
                    poster={c.image_url}
                    alt={c.image_alt}
                    label={c.value}
                    className="aspect-[9/16]"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CTABanner />
    </>
  )
}

function FilterChip({ on, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
        on ? 'bg-ink-900 text-white' : 'bg-paper-warm text-ink-600 hover:bg-paper-edge hover:text-ink-900'
      }`}
    >
      {children}
    </button>
  )
}
