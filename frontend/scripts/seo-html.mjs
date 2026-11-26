/**
 * After `vite build`: give every public page its own HTML file with its own
 * <head>.
 *
 * The site is a single-page app, so without this every address served the
 * same index.html: one title, no description, no canonical. Google renders
 * JavaScript and eventually sees the right tags, but Bing is slower to, and
 * link previews (WhatsApp, LinkedIn, Facebook, X) never run it at all, so a
 * shared link always showed the home page's title.
 *
 * Writes dist/<path>.html for each page (Vercel's cleanUrls serves
 * /services from services.html), dist/_shell.html for app-only routes, and
 * dist/404.html, which Vercel returns with a real 404 status for any address
 * that is not a page.
 *
 * Tags carry data-rh="true". src/main.jsx removes every such tag just before
 * the app renders its own, so a visitor's browser never holds two sets. (With
 * React 19, react-helmet-async renders tags through React itself and leaves
 * existing ones alone, so the removal has to be done explicitly.)
 *
 * Content comes from the live API (SEO_API). If it is asleep or unreachable
 * the static pages are still written from src/seo/pages.js and the build
 * carries on; only the per-service, per-product and per-article files wait
 * for the next build.
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const seo = await import(pathToFileURL(join(root, 'src/seo/pages.js')).href)
const {
  SITE_URL, SITE_NAME, DEFAULT_IMAGE, PAGES, ORGANIZATION, WEBSITE, breadcrumbs,
  serviceIsIndexable, serviceMeta, serviceSchema, productMeta, postMeta, articleSchema,
  projectIsIndexable, projectMeta,
} = seo

const API = (process.env.SEO_API || 'https://premierpower-api.onrender.com/api').replace(/\/$/, '')
const VERIFY = process.env.GOOGLE_SITE_VERIFICATION || ''

async function get(path) {
  try {
    // Generous: Render's free plan can take most of a minute to wake.
    const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(90_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn(`seo-html: ${path} unavailable (${e.message}); continuing without it`)
    return null
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const ld = (obj, owned = true) =>
  `<script type="application/ld+json"${owned ? ' data-rh="true"' : ''}>${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`

function head({ path, title, description, image, type = 'website', noindex = false, jsonLd = [], trail }) {
  const canonical = `${SITE_URL}${path === '/' ? '/' : path}`
  const img = image || DEFAULT_IMAGE
  const crumbs = trail ?? (PAGES[path]?.crumb && path !== '/' ? [[PAGES[path].crumb, path]] : null)
  const data = [...(crumbs ? [breadcrumbs([['Home', '/'], ...crumbs])] : []), ...jsonLd]
  const m = (attr, key, content) => `<meta ${attr}="${key}" content="${esc(content)}" data-rh="true" />`
  return [
    description && m('name', 'description', description),
    !noindex && `<link rel="canonical" href="${esc(canonical)}" data-rh="true" />`,
    m('name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'),
    m('property', 'og:title', title),
    description && m('property', 'og:description', description),
    m('property', 'og:type', type),
    m('property', 'og:site_name', SITE_NAME),
    m('property', 'og:locale', 'en_KE'),
    m('property', 'og:url', canonical),
    m('property', 'og:image', img),
    m('name', 'twitter:card', 'summary_large_image'),
    m('name', 'twitter:title', title),
    description && m('name', 'twitter:description', description),
    m('name', 'twitter:image', img),
    ...data.map((d) => ld(d)),
  ].filter(Boolean).join('\n    ')
}

const template = await readFile(join(dist, 'index.html'), 'utf8')

// ── Performance hints ───────────────────────────────────────────────────
// The two latin font files every page uses, fetched with the HTML instead of
// after the stylesheet asks for them, and an early connection to Cloudinary,
// where every photograph lives.
const fonts = (await readdir(join(dist, 'assets')))
  .filter((f) => /^(inter|manrope)-latin-wght-normal-.*\.woff2$/.test(f))
const hints = [
  '<link rel="preconnect" href="https://res.cloudinary.com" crossorigin />',
  ...fonts.map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`),
].join('\n    ')

// The home page's largest element is the first slideshow photograph, which
// the browser would otherwise only discover after the app and the slide list
// had loaded. Same widths and transform as Hero.jsx (HERO_WIDTHS, cdnSrcSet)
// so the browser picks the identical file and does not fetch it twice.
const mediaMap = JSON.parse(await readFile(join(root, 'src/data/mediaMap.json'), 'utf8'))
const HERO_WIDTHS = [640, 960, 1280, 1600, 1920, 2560]
const cdnAt = (url, w) => {
  const at = url.indexOf('/image/upload/')
  if (at === -1) return url
  const head = url.slice(0, at + '/image/upload/'.length)
  const parts = url.slice(head.length).split('/')
  if (/^[a-z]{1,3}_/.test(parts[0])) parts.shift()
  return `${head}f_auto,q_auto,c_limit,w_${w}/${parts.join('/')}`
}
const BANNER_WIDTHS = [640, 960, 1280, 1600, 1920]   // PageHero.jsx
function imagePreload(src, widths) {
  if (!src) return ''
  const url = mediaMap[src] ?? src
  if (!url.includes('res.cloudinary.com')) return ''
  const set = widths.map((w) => `${cdnAt(url, w)} ${w}w`).join(', ')
  return `<link rel="preload" as="image" imagesrcset="${esc(set)}" imagesizes="100vw" fetchpriority="high" />`
}

function heroPreload(banners) {
  const first = (banners ?? []).find((b) => b.image_url)
  if (!first) return ''
  const url = mediaMap[first.image_url] ?? first.image_url
  if (!url.includes('res.cloudinary.com')) return ''
  const set = HERO_WIDTHS.map((w) => `${cdnAt(url, w)} ${w}w`).join(', ')
  return `<link rel="preload" as="image" imagesrcset="${esc(set)}" imagesizes="100vw" fetchpriority="high" />`
}
// The company and website descriptions go on every page, outside Helmet's
// control (no data-rh), so they are never removed on navigation.
const sitewide = [
  hints,
  ld(ORGANIZATION, false),
  ld(WEBSITE, false),
  VERIFY && `<meta name="google-site-verification" content="${esc(VERIFY)}" />`,
].filter(Boolean).join('\n    ')

function page(tags, title, extra = '') {
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title data-rh="true">${esc(title)}</title>`)
    .replace('</head>', `    ${sitewide}\n    ${extra ? extra + '\n    ' : ''}${tags}\n  </head>`)
}

async function write(path, html) {
  const file = path === '/' ? join(dist, 'index.html') : join(dist, `${path.replace(/^\//, '')}.html`)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, html)
}

const [cms, services, products, posts, faqs, reviews, banners, sections, projects] = await Promise.all([
  get('/seo'), get('/services'), get('/products'), get('/blog'), get('/faqs'), get('/testimonials'), get('/banners'),
  get('/page-sections'), get('/projects'),
])
// The banner photograph the CMS has chosen for each page, if any.
const cmsBanner = Object.fromEntries((sections ?? [])
  .filter((x) => x.key === 'hero' && x.image_url).map((x) => [x.page, x.image_url]))
const override = Object.fromEntries((cms ?? []).map((r) => [r.path, r]))
const written = []

// ── The fixed pages ─────────────────────────────────────────────────────
for (const [path, base] of Object.entries(PAGES)) {
  const o = override[path] ?? {}
  let noindex = Boolean(o.noindex)
  const jsonLd = []
  if (path === '/testimonials' && reviews && reviews.length === 0) noindex = true
  if (path === '/insights' && (!posts || posts.length === 0)) noindex = true
  if (path === '/faq' && faqs?.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question', name: f.question ?? f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.answer ?? f.a },
      })),
    })
  }
  const title = o.title?.trim() || base.title
  const description = o.description?.trim() || base.description
  await write(path, page(head({ path, title, description, image: o.og_image_url?.trim(), noindex, jsonLd }), title,
    path === '/' ? heroPreload(banners) : imagePreload(cmsBanner[path] || base.banner, BANNER_WIDTHS)))
  written.push(path)
}

// ── Service lines ───────────────────────────────────────────────────────
for (const s of services ?? []) {
  const path = `/services/${s.slug}`
  const meta = serviceMeta(s)
  const indexable = serviceIsIndexable(s)
  await write(path, page(head({
    path, ...meta, image: s.image_url || undefined, noindex: !indexable,
    trail: [['Services', '/services'], [s.title, path]],
    jsonLd: indexable ? [serviceSchema(s)] : [],
  }), meta.title))
  written.push(path)
}

// ── Projects ────────────────────────────────────────────────────────────
for (const p of projects ?? []) {
  const path = `/portfolio/${p.slug}`
  const meta = projectMeta(p)
  const image = mediaMap[p.image_open_url] ?? (p.image_open_url || undefined)
  await write(path, page(head({
    path, ...meta, image, noindex: !projectIsIndexable(p),
    trail: [['Installations', '/portfolio'], [p.title, path]],
  }), meta.title))
  written.push(path)
}

// ── Lighting & fittings ─────────────────────────────────────────────────
for (const p of products ?? []) {
  const path = `/products/${p.slug}`
  const meta = productMeta(p)
  await write(path, page(head({
    path, ...meta, image: p.image_url || undefined,
    trail: [['Lighting & fittings', '/products'], [p.name, path]],
  }), meta.title))
  written.push(path)
}

// ── Insights articles ───────────────────────────────────────────────────
for (const a of posts ?? []) {
  const path = `/insights/${a.slug}`
  const meta = postMeta(a)
  await write(path, page(head({
    path, ...meta, type: 'article', image: a.cover_url || undefined,
    trail: [['Insights', '/insights'], [a.title, path]],
    jsonLd: [articleSchema(a)],
  }), meta.title))
  written.push(path)
}

// ── The app shell, and the real 404 ─────────────────────────────────────
// _shell.html serves the CMS and any service/product/article published since
// the last build: no canonical or description of its own (the app sets them).
await writeFile(join(dist, '_shell.html'), template.replace('</head>', `    ${sitewide}\n  </head>`))
await writeFile(join(dist, '404.html'), page(
  `<meta name="robots" content="noindex" data-rh="true" />`,
  `Page not found | ${SITE_NAME}`,
))

console.log(`seo-html: wrote ${written.length} pages (${API === 'https://premierpower-api.onrender.com/api' ? 'live API' : API})`)
console.log(`seo-html: ${written.join(' ')}`)
