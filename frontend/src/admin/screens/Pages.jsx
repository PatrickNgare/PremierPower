import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, ExternalLink } from 'lucide-react'
import { api } from '../api'
import { PAGES } from './Homepage'
import { photo, cdnWidth } from '@/utils/photo'

/** The photograph each page falls back to when no banner has been chosen —
 *  the same defaults the public pages use. */
const DEFAULT_PHOTO = {
  '/': '/projects/lodge.jpg',
  '/services': '/projects/panel-contactors.jpg',
  '/products': '/projects/stairwell.jpg',
  '/portfolio': '/projects/resort-dusk.jpg',
  '/safety': '/projects/testing.jpg',
  '/about': '/projects/villa-modern.jpg',
  '/testimonials': '/projects/dining.jpg',
  '/faq': '/projects/lodge-dusk.jpg',
  '/contact': '/projects/technician.jpg',
}

const BLURB = {
  '/': 'Slideshow, headline and every block on the front page',
  '/services': 'The banner and the words around the service lines',
  '/products': 'The banner and the showroom clips',
  '/portfolio': 'The banner above the project gallery',
  '/safety': 'Certification, testing and the safety record',
  '/about': 'Who the company is and how it works',
  '/testimonials': 'The banner above the reviews',
  '/faq': 'The banner above the questions',
  '/contact': 'The banner and the words beside the enquiry form',
}

const editorFor = (page) => (page === '/' ? '/admin/homepage' : `/admin/pages${page}`)

/**
 * Every page of the site as a card. Replaces nine sidebar links: pick the
 * page by its picture, not by remembering what the CMS called it.
 */
export default function Pages() {
  const [sections, setSections] = useState([])

  useEffect(() => {
    api.get('/page-sections/all?limit=300')
      .then((r) => setSections(r.items))
      .catch(() => { /* the cards still work on their defaults */ })
  }, [])

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-body">Website pages</h1>
      <p className="mt-1 text-sm text-muted">Pick a page to change its words and photographs.</p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PAGES.map(([page, name], i) => {
          const own = sections.filter((s) => s.page === page)
          const hero = own.find((s) => s.key === 'hero')
          const img = hero?.image_url || photo(DEFAULT_PHOTO[page])
          const hidden = own.filter((s) => s.enabled === false).length
          return (
            <motion.li
              key={page}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-raise"
            >
              <Link to={editorFor(page)} className="block">
                <div className="aspect-[16/9] overflow-hidden bg-page-warm">
                  <img
                    src={cdnWidth(img, 640)} alt="" loading="lazy" decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <h2 className="font-display font-bold text-body">{name}</h2>
                    <p className="mt-0.5 text-sm text-muted">{BLURB[page]}</p>
                    {hidden > 0 && (
                      <p className="mt-1.5 text-xs font-semibold text-lumen-700">
                        {hidden} hidden {hidden === 1 ? 'block' : 'blocks'}
                      </p>
                    )}
                  </div>
                  <ArrowUpRight
                    size={17} aria-hidden="true"
                    className="mt-1 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </div>
              </Link>
              <a
                href={page} target="_blank" rel="noopener"
                aria-label={`Open ${name} on the website`}
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl bg-ink-950/60 text-white opacity-0 backdrop-blur transition-opacity hover:bg-ink-950/80 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              >
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
