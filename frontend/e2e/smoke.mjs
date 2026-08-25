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
  const cta = page.getByRole('link', { name: /book a free site assessment/i }).first()
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
await page.fill('input[name="name"]', 'Test Submission')
await page.fill('input[name="phone"]', '0722000111')
await page.fill('input[name="area"]', 'Kilimani')
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

let confirmed = true
try {
  await page.waitForSelector('text=That reached us.', { timeout: 5000 })
} catch {
  confirmed = false
}
check(confirmed, 'success state rendered after submission')

// The hero carousel must be operable without a pointer. The headline is
// static across slides; the per-slide caption is what changes.
await page.goto(SITE + '/', { waitUntil: 'networkidle' })
await page.waitForSelector('h1', { timeout: RENDER_TIMEOUT })
const slideIndex = async () => {
  const text = await page.locator('section').first().innerText()
  return text.match(/(\d\d)\s*\/\s*(\d\d)/)?.[1] ?? null
}
const next = page.getByRole('button', { name: /next slide/i })
const startIndex = await slideIndex()
await next.focus()
await page.keyboard.press('Enter')
await page.waitForTimeout(900)
const afterIndex = await slideIndex()
check(startIndex !== null && afterIndex !== null && startIndex !== afterIndex,
  `hero carousel advances from the keyboard (${startIndex} -> ${afterIndex})`)

// The hero must stay a legible dark stage even before photography arrives.
const heroTall = await page.locator('section').first()
  .evaluate((n) => n.getBoundingClientRect().height >= window.innerHeight * 0.9)
check(heroTall, 'hero fills the viewport')

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
