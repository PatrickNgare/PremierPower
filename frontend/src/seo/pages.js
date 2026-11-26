/*
 * Search titles, descriptions and sharing images for every public page.
 *
 * One file, read twice: by the <Seo> component in the browser, and by
 * scripts/seo-html.mjs at build time, which writes these tags into each page's
 * HTML so crawlers that do not run JavaScript (Bing, WhatsApp, LinkedIn,
 * Facebook) see the right title instead of the same one on every URL.
 * Plain ES module, no imports, so Node can read it without the Vite aliases.
 *
 * Anything the CMS holds for a path (Settings → SEO) still wins over these.
 *
 * Titles lead with what someone searches for and end with the company name;
 * under about 60 characters so Google does not cut them. Descriptions say
 * what the page offers in under about 155. Every claim here is one the site
 * already makes: NCA registration, the eight service lines, Nairobi and
 * nationwide.
 */

export const SITE_URL = 'https://premierpower.co.ke'
export const SITE_NAME = 'Premier Power Limited'

// A 1200x630 crop of a completed installation, the size every network uses
// for link previews. Cloudinary makes the crop on request.
export const DEFAULT_IMAGE =
  'https://res.cloudinary.com/diduc97on/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1/premierpower/projects/resort-dusk-5e4e7628.jpg'

// `banner` is each page's default banner photograph (the one its PageHero
// falls back to); the build preloads it unless the CMS has set another.
export const PAGES = {
  '/': {
    title: 'Electrical Contractors Kenya | Premier Power Limited',
    description:
      'Premier Power Limited provides electrical engineering, electrical installation and power solutions across Kenya. Contact our team for project enquiries and quotations.',
    crumb: 'Home',
  },
  '/services': {
    banner: '/projects/panel-contactors.jpg',
    title: 'Electrical Engineering Services in Kenya | Premier Power',
    description:
      'Electrical installation, security systems, solar PV, UPS and surge protection, lifts, power distribution, energy retrofits and gas — one NCA-registered contractor.',
    crumb: 'Services',
  },
  '/products': {
    banner: '/projects/stairwell.jpg',
    title: 'Lighting Supply & Installation Kenya | Premier Power',
    description:
      'Chandeliers, pendants and linear lighting supplied and installed across Kenya for hotels, commercial interiors and residential developments.',
    crumb: 'Lighting & fittings',
  },
  '/portfolio': {
    banner: '/projects/resort-dusk.jpg',
    title: 'Electrical Installation Projects in Kenya | Premier Power',
    description:
      'Completed electrical and lighting installations at hotels, lodges, commercial interiors and residential developments across Kenya, with photographs.',
    crumb: 'Installations',
  },
  '/safety': {
    banner: '/projects/testing.jpg',
    title: 'Electrical Testing, Certification & Safety | Premier Power',
    description:
      'How Premier Power tests and certifies every electrical installation before handover, and the registrations it works under in Kenya.',
    crumb: 'Safety',
  },
  '/about': {
    banner: '/projects/villa-modern.jpg',
    title: 'About Premier Power | Electrical Engineering Company, Kenya',
    description:
      'An NCA-registered electrical engineering contractor based in Nairobi, working with contractors and architects on projects across Kenya.',
    crumb: 'About',
  },
  '/testimonials': {
    banner: '/projects/dining.jpg',
    title: 'Client Reviews | Premier Power Limited',
    description: 'What clients say about working with Premier Power on electrical installation projects in Kenya.',
    crumb: 'Reviews',
  },
  '/faq': {
    banner: '/projects/lodge-dusk.jpg',
    title: 'Electrical Contractor FAQs | Premier Power Limited',
    description:
      'Answers on registration, the areas we cover, working with main contractors and architects, and what a site assessment involves.',
    crumb: 'FAQ',
  },
  '/contact': {
    banner: '/projects/technician.jpg',
    title: 'Contact an Electrical Contractor in Nairobi | Premier Power',
    description:
      'Request a quotation or a site visit from Premier Power Limited, Forest Court, Forest Road, Nairobi. Call, WhatsApp or send the project details.',
    crumb: 'Contact',
  },
  '/insights': {
    banner: '/projects/board-terminations.jpg',
    title: 'Electrical Engineering Insights | Premier Power Limited',
    description:
      'Practical guides on planning, installing, testing and maintaining electrical systems in Kenyan buildings, from an NCA-registered contractor.',
    crumb: 'Insights',
  },
  '/privacy': {
    title: 'Privacy Policy | Premier Power Limited',
    description:
      'What personal information the Premier Power website collects, why, who handles it, and your rights under the Kenya Data Protection Act, 2019.',
    crumb: 'Privacy',
  },
}

/**
 * A service gets its own indexable page only once it has enough words to be
 * worth one. Thinner entries still open for visitors but are kept out of
 * search results and the sitemap, so the site is never judged on a dozen
 * two-sentence pages. The backend sitemap applies the same number.
 */
export const SERVICE_PAGE_MIN_CHARS = 600

export const serviceIsIndexable = (s) =>
  `${s?.lede ?? ''} ${s?.body ?? ''}`.trim().length >= SERVICE_PAGE_MIN_CHARS

export const serviceMeta = (s) => ({
  title: `${s.title} in Kenya | Premier Power Limited`.slice(0, 70),
  description: (s.lede || s.body || '').replace(/\s+/g, ' ').trim().slice(0, 158),
})

/** Same bar for a project's own page, plus at least one photograph. */
export const projectIsIndexable = (p) =>
  `${p?.summary ?? ''} ${p?.body ?? ''}`.trim().length >= SERVICE_PAGE_MIN_CHARS
  && Boolean(p?.image_open_url || p?.gallery?.length)

export const projectMeta = (p) => ({
  title: `${p.title}${p.location ? `, ${p.location.split(',')[0]}` : ''} | Premier Power Projects`.slice(0, 70),
  description: (p.summary || `Electrical installation by Premier Power Limited${p.location ? ` at ${p.location}` : ''}.`)
    .replace(/\s+/g, ' ').trim().slice(0, 158),
})

export const productMeta = (p) => ({
  title: `${p.name} | Lighting by Premier Power, Kenya`.slice(0, 70),
  description: (p.summary || `${p.name}, supplied and installed by Premier Power Limited across Kenya.`)
    .replace(/\s+/g, ' ').trim().slice(0, 158),
})

export const postMeta = (a) => ({
  title: `${a.title} | Premier Power`.slice(0, 70),
  description: (a.excerpt || a.body || '').replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 158),
})

/** The company, as structured data. Only facts the site already states. */
export const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'ElectricalContractor',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  legalName: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/brand/logo.svg`,
  image: DEFAULT_IMAGE,
  description:
    'NCA-registered electrical engineering service contractor working across Kenya: electrical installation, security systems, solar photovoltaics, power continuity, vertical transport, power distribution and energy efficiency.',
  telephone: '+254719509574',
  email: 'premierpower.ltd@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Forest Court, Forest Road',
    addressLocality: 'Nairobi',
    addressRegion: 'Nairobi County',
    addressCountry: 'KE',
  },
  areaServed: { '@type': 'Country', name: 'Kenya' },
  // The Google Business Profile, so search engines tie the site and the
  // listing together as one company.
  hasMap: 'https://g.page/r/Ce4hbCGre_4GEBI',
  sameAs: ['https://g.page/r/Ce4hbCGre_4GEBI'],
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '17:00',
  }],
  knowsAbout: [
    'Electrical installation',
    'Electronic security and surveillance systems',
    'Solar photovoltaic systems',
    'UPS, voltage regulation and surge protection',
    'Lifts, escalators and conveyors',
    'Power transmission and distribution',
    'Energy efficiency retrofitting',
  ],
}

export const WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  inLanguage: 'en-KE',
  publisher: { '@id': `${SITE_URL}/#organization` },
}

/** Home > Section > Page, as structured data. `trail` is [[name, path], ...]. */
export const breadcrumbs = (trail) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, path], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item: `${SITE_URL}${path}`,
  })),
})

export const serviceSchema = (s) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: s.title,
  serviceType: s.title,
  description: (s.lede || s.body || '').trim(),
  url: `${SITE_URL}/services/${s.slug}`,
  provider: { '@id': `${SITE_URL}/#organization` },
  areaServed: { '@type': 'Country', name: 'Kenya' },
})

export const articleSchema = (a) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: a.title,
  description: postMeta(a).description,
  url: `${SITE_URL}/insights/${a.slug}`,
  mainEntityOfPage: `${SITE_URL}/insights/${a.slug}`,
  ...(a.cover_url ? { image: a.cover_url } : {}),
  ...(a.published_at ? { datePublished: a.published_at } : {}),
  author: a.author ? { '@type': 'Person', name: a.author } : { '@id': `${SITE_URL}/#organization` },
  publisher: { '@id': `${SITE_URL}/#organization` },
})
