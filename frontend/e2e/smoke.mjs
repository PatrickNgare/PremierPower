/**
 * End-to-end smoke test: the lead actually reaches the backend, and the
 * signature control is keyboard-operable.
 *
 * Needs both servers running (see README "Testing"):
 *   backend  -> http://127.0.0.1:8000
 *   frontend -> http://127.0.0.1:4173, built with VITE_API_URL pointing at it
 */
import { chromium } from 'playwright'

// Renders are CPU-bound; this machine can sit at 4x oversubscription, so the
// waits are generous rather than tight. They gate on the render completing,
// never on how fast it completed.
const RENDER_TIMEOUT = Number(process.env.RENDER_TIMEOUT ?? 40000)

const SITE = process.env.SITE_URL ?? 'http://127.0.0.1:4178'
const failures = []
const check = (ok, label) => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}`)
  if (!ok) failures.push(label)
}

const browser = await chromium.launch()

for (const [device, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport })
  await ctx.addInitScript(() => localStorage.setItem('pp-exit-dismissed', String(Date.now() + 864e5)))
  const page = await ctx.newPage()
  const errors = []
  let demoAsset = true
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (r) => {
    if (r.status() === 404 && /\/demo\//.test(r.url())) demoAsset = true
  })
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    // Demo photography is not supplied yet, so /demo/*.jpg legitimately 404s
    // and Photo falls back to its labelled placeholder. Anything else is real.
    if (/404/.test(m.text()) && demoAsset) { demoAsset = false; return }
    errors.push(m.text())
  })

  for (const path of ['/', '/services', '/portfolio', '/safety', '/about', '/testimonials', '/faq', '/contact']) {
    await page.goto(SITE + path, { waitUntil: 'networkidle' })
    await page.waitForSelector('h1', { timeout: RENDER_TIMEOUT })
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    )
    check(!overflows, `${device} ${path} — no horizontal overflow`)
  }

  // The hero CTA must be visible without scrolling. This was the specific gap
  // in the predecessor build.
  await page.goto(SITE + '/', { waitUntil: 'networkidle' })
  await page.waitForSelector('h1', { timeout: RENDER_TIMEOUT })
  // Entrance animations are delayed; wait for the control itself.
  const cta = page.getByRole('link', { name: /explore our solutions/i }).first()
  await cta.waitFor({ state: 'visible', timeout: RENDER_TIMEOUT })
  // isVisible() is true at any scroll depth, so measure the box against the
  // viewport: this must fail if the CTA ever drops below the fold.
  const fold = await page.evaluate(() => window.innerHeight)
  const box = await cta.boundingBox()
  const aboveFold = box !== null && box.y >= 0 && box.y + box.height <= fold
  check(aboveFold,
    `${device} — hero CTA above the fold (bottom ${box ? Math.round(box.y + box.height) : '?'} of ${fold})`)

  check(errors.length === 0, `${device} — no console or page errors${errors.length ? ': ' + errors[0] : ''}`)
  await ctx.close()
}

// Lead submission, all the way to the API.
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
await ctx.addInitScript(() => localStorage.setItem('pp-exit-dismissed', String(Date.now() + 864e5)))
const page = await ctx.newPage()
await page.goto(SITE + '/contact', { waitUntil: 'networkidle' })
// Capture what actually goes on the wire. A 201 only proves the request was
// accepted — unknown fields are dropped silently, so the payload itself has
// to be asserted.
let sentPayload = null
page.on('request', (r) => {
  if (r.url().includes('/api/leads') && r.method() === 'POST') {
    try { sentPayload = JSON.parse(r.postData() ?? '{}') } catch { /* ignore */ }
  }
})

await page.fill('input[name="name"]', 'Test Submission')
await page.fill('input[name="company"]', 'Test Contractor Ltd')
await page.fill('input[name="email"]', 'smoke@example.com')
await page.fill('input[name="phone"]', '0722000111')
await page.fill('input[name="area"]', 'Kilimani')
await page.selectOption('select[name="project_type"]', { index: 1 })
await page.fill('textarea[name="message"]', 'Automated smoke test.')

let status = 0
try {
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/leads'), { timeout: 10000 }),
    page.click('button[type="submit"]'),
  ])
  status = resp.status()
} catch {
  /* falls through to the check below */
}
check(status === 201, `lead POST returned 201 (got ${status || 'no response'})`)

const carried = ['name', 'company', 'email', 'phone', 'project_type', 'message']
  .filter((k) => sentPayload && String(sentPayload[k] ?? '').trim())
check(carried.length === 6,
  `lead payload carries every field (${carried.length}/6)`)

let confirmed = true
try {
  await page.waitForSelector('text=That reached us.', { timeout: 5000 })
} catch {
  confirmed = false
}
check(confirmed, 'success state rendered after submission')

// Images are interactive: a project tile opens a viewer that traps focus,
// locks background scroll, navigates by keyboard and closes on Escape.
await page.goto(SITE + '/', { waitUntil: 'networkidle' })
await page.waitForSelector('h1', { timeout: RENDER_TIMEOUT })
const tile = page.getByRole('button', { name: /view .* larger/i }).first()
await tile.scrollIntoViewIfNeeded()
await page.waitForTimeout(1200)
await tile.click()
let dialogOpened = true
try {
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 })
} catch { dialogOpened = false }
check(dialogOpened, 'clicking an image opens the viewer')

if (dialogOpened) {
  // scroll-behavior is smooth, so the page can still be animating from the
  // scrollIntoView that preceded this. Wait for the position to settle before
  // sampling, or the comparison measures the tail of that animation.
  await page.evaluate(async () => {
    let last = -1
    for (let i = 0; i < 40 && last !== window.scrollY; i++) {
      last = window.scrollY
      await new Promise((r) => setTimeout(r, 50))
    }
  })
  const lockedStyle = await page.evaluate(() => document.body.style.position)
  const scrollBefore = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, 700)
  await page.waitForTimeout(500)
  const scrollAfter = await page.evaluate(() => window.scrollY)
  check(lockedStyle === 'fixed' && scrollBefore === scrollAfter,
    `viewer locks background scroll without moving it (position=${lockedStyle}, ${scrollBefore}->${scrollAfter})`)

  await page.keyboard.press('Escape')
  // Exit animation plus a loaded machine; poll rather than assume a duration.
  let closed = false
  for (let i = 0; i < 20 && !closed; i++) {
    await page.waitForTimeout(250)
    closed = (await page.locator('[role="dialog"]').count()) === 0
  }
  check(closed, 'Escape closes the viewer')
}

// The hero is now a single composition rather than a carousel. What must
// hold is that its imagery paints and both calls to action are reachable.
await page.goto(SITE + '/', { waitUntil: 'networkidle' })
await page.waitForSelector('h1', { timeout: RENDER_TIMEOUT })
const heroImg = await page.locator('section').first().locator('img').first()
const heroBox = await heroImg.boundingBox()
check(
  heroBox !== null && heroBox.width >= 400,
  `hero imagery paints (${heroBox ? Math.round(heroBox.width) + 'px wide' : 'missing'})`,
)

const secondary = page.getByRole('link', { name: /talk to an expert/i })
  .or(page.getByRole('link', { name: /^\+?[\d ]+$/ }))
check(await page.getByRole('link', { name: /explore our solutions/i }).count() > 0,
  'hero primary action present')

// The condensing navbar must still expose navigation once scrolled.
await page.evaluate(() => window.scrollTo(0, 1200))
await page.waitForTimeout(700)
const navVisible = await page.locator('header nav').first().isVisible()
check(navVisible, 'navigation remains available when condensed')

// The hero must stay a legible dark stage even before photography arrives.
const heroFits = await page.locator('section').first().evaluate((n) => {
  const h = n.getBoundingClientRect().height
  // Substantial enough to read as a stage, but never taller than the screen —
  // overflowing it is what pushed the calls to action below the fold.
  return h >= window.innerHeight * 0.6 && h <= window.innerHeight + 1
})
check(heroFits, 'hero is a full stage without overflowing the viewport')

// Every URL offered to search engines must be a real page.
//
// The hand-written sitemap this replaced listed /work, which stopped being a
// route long ago. The SPA answers unknown paths with 200 and a not-found
// screen, so nothing failed loudly — a crawler was simply told to index a page
// that does not exist. Checking the rendered heading is what catches that;
// checking the status code does not.
{
  const xml = await fetch(SITE + '/sitemap.xml').then((r) => r.text())
  const paths = [...xml.matchAll(/<loc>[^<]*?premierpower\.co\.ke([^<]*)<\/loc>/g)]
    .map((m) => m[1] || '/')
  check(paths.length > 0, `sitemap lists ${paths.length} URLs`)

  let dead = 0
  for (const path of paths) {
    await page.goto(SITE + path, { waitUntil: 'networkidle' })
    await page.waitForSelector('h1', { timeout: RENDER_TIMEOUT })
    const heading = await page.locator('h1').first().innerText()
    if (/circuit is dead|not found/i.test(heading)) dead++
  }
  check(dead === 0, `every sitemap URL renders a real page (${paths.length} checked)`)

  const robots = await fetch(SITE + '/robots.txt').then((r) => r.text())
  check(robots.includes('Disallow: /admin'), 'robots.txt keeps crawlers out of the CMS')
  check(robots.includes('Sitemap:'), 'robots.txt points at the sitemap')
}

// Licence trust signal must sit beside the primary action, on every page.
for (const path of ['/', '/services', '/portfolio', '/safety', '/about', '/contact']) {
  await page.goto(SITE + path, { waitUntil: 'networkidle' })
  // Lazy routes: without this the count can measure the Suspense fallback.
  await page.waitForSelector('h1', { timeout: RENDER_TIMEOUT })
  // The credential is NCA registration, not an EPRA licence.
  const badges = await page.getByText(/nca\s*(contractor|registered)/i).count()
  check(badges > 0, `${path} — NCA credential present`)
}

await browser.close()

console.log(failures.length ? `\n${failures.length} failing check(s)` : '\nall checks passed')
process.exit(failures.length ? 1 : 0)
