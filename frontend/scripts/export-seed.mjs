/**
 * Exports the bundled content to JSON for the backend to seed from.
 *
 * The site's real content — the client's own projects, their NCA service
 * lines, their sectors — was written into src/data as ES modules. Now that the
 * CMS owns content, those modules become the seed and the offline fallback,
 * and this script is the one place the two are kept in step. Run it whenever
 * src/data changes; the JSON is committed.
 *
 *   node scripts/export-seed.mjs
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const data = (f) => resolve(here, '../src/data', f)

const { heroSlides } = await import(data('heroSlides.js'))
const { services } = await import(data('services.js'))
const { projects } = await import(data('projects.js'))
const { projectShowcase } = await import(data('projectShowcase.js'))
const { faqs } = await import(data('faqs.js'))
const { solutions } = await import(data('solutions.js'))
const { sectors } = await import(data('sectors.js'))
// testimonials.js is skipped on purpose: it imports through the '@' alias,
// which only Vite resolves, and its real list is empty anyway. The client has
// supplied no reviews, and the CMS is where the first one will be typed.

const demoPhotos = {
  hospitality: '/projects/hospitality.jpg',
  lodge: '/projects/lodge.jpg',
  technical: '/projects/technical.jpg',
  residential: '/projects/residential.jpg',
  villas: '/projects/villas.jpg',
  apartments: '/projects/apartments.jpg',
  clubhouse: '/projects/clubhouse.jpg',
  houseExterior: '/projects/house-exterior.jpg',
  interior: '/projects/interior.jpg',
  stairDetail: '/projects/stair-detail.jpg',
}

const slug = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-')

// Photography lives on the showcase entries, keyed by title.
const shot = new Map(projectShowcase.map((p) => [p.title, p]))

const seed = {
  banners: heroSlides.map((s, i) => ({
    eyebrow: s.eyebrow,
    headline: s.caption,
    body: s.line,
    image_url: s.image,
    image_alt: s.alt,
    card_label: s.card?.label ?? '',
    card_title: s.card?.title ?? '',
    card_line: s.card?.line ?? '',
    position: i,
    published: true,
  })),

  services: services.map((s, i) => ({
    slug: s.slug,
    title: s.title,
    lede: s.lede ?? '',
    body: s.body ?? '',
    signs: (s.signs ?? []).join('\n'),
    position: i,
    published: true,
  })),

  projects: projects.map((p, i) => {
    const s = shot.get(p.title)
    const image = s ? (s.image_open_url || demoPhotos[s.demoKey] || '') : ''
    return {
      slug: p.slug,
      title: p.title,
      location: p.location ?? '',
      year: p.status ?? '',
      // The architect is the credit the profile gives; keeping it in the
      // summary means it survives into the CMS instead of being dropped.
      summary: [s?.summary, p.architect && `Architect: ${p.architect}.`]
        .filter(Boolean).join(' '),
      image_open_url: image,
      image_open_alt: s?.image_open_alt ?? '',
      position: i,
      published: true,
    }
  }),

  faqs: faqs.map((f, i) => ({
    question: f.q, answer: f.a, category: 'general', position: i, published: true,
  })),

  // solutions and sectors are the same seven markets written twice. Merged on
  // title so the CMS holds one row each, with both wordings on it.
  //
  // Six of the seven titles match exactly. The seventh does not: the solutions
  // strip calls it "Residential developments" and the sectors grid calls it
  // "Residential housing". Merging on title alone leaves the client editing
  // two rows that render as one market, so the pair is aliased. Keep the
  // solutions wording — the hero copy already says "residential developments".
  sectors: (() => {
    const alias = { 'Residential housing': 'Residential developments' }
    const rows = new Map()
    solutions.forEach((s, i) => rows.set(s.title, {
      slug: s.slug ?? slug(s.title), title: s.title, line: s.line ?? '', body: '',
      image_url: s.image ?? '', image_alt: s.alt ?? '', position: i, published: true,
    }))
    sectors.forEach((s, i) => {
      const title = alias[s.title] ?? s.title
      const row = rows.get(title)
      if (row) {
        row.body = s.body ?? ''
        row.image_url ||= s.image ?? ''
        row.image_alt ||= s.alt ?? ''
      } else {
        rows.set(title, {
          slug: slug(title), title, line: '', body: s.body ?? '',
          image_url: s.image ?? '', image_alt: s.alt ?? '',
          position: solutions.length + i, published: true,
        })
      }
    })
    return [...rows.values()]
  })(),
}

const out = resolve(here, '../../backend/app/seed_content.json')
writeFileSync(out, JSON.stringify(seed, null, 2) + '\n')
for (const [k, v] of Object.entries(seed)) console.log(`${k.padEnd(10)} ${v.length}`)
console.log('->', out)
