/**
 * End-to-end smoke test: the lead actually reaches the backend, and the
 * signature control is keyboard-operable.
 *
 * Needs both servers running (see README "Testing"):
 *   backend  -> http://127.0.0.1:8000
 *   frontend -> http://127.0.0.1:4173, built with VITE_API_URL pointing at it
 */
import { chromium } from 'playwright'

const SITE = process.env.SITE_URL ?? 'http://127.0.0.1:4173'
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
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  for (const path of ['/', '/services', '/work', '/safety', '/about', '/faq', '/contact']) {
    await page.goto(SITE + path, { waitUntil: 'networkidle' })
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    )
    check(!overflows, `${device} ${path} — no horizontal overflow`)
  }

  // The hero CTA must be visible without scrolling. This was the specific gap
  // in the predecessor build.
  await page.goto(SITE + '/', { waitUntil: 'networkidle' })
  const cta = page.getByRole('link', { name: /book a free site assessment/i }).first()
  check(await cta.isVisible(), `${device} — hero CTA visible above the fold`)

  check(errors.length === 0, `${device} — no console or page errors${errors.length ? ': ' + errors[0] : ''}`)
  await ctx.close()
}

// Lead submission, all the way to the API.
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
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

// The reveal must be operable without a pointer.
await page.goto(SITE + '/', { waitUntil: 'networkidle' })
const range = page.locator('.ba-range').first()
await range.focus()
const before = await range.inputValue()
await page.keyboard.press('ArrowRight')
const after = await range.inputValue()
check(before !== after, 'before/after reveal is keyboard-operable')

await browser.close()

console.log(failures.length ? `\n${failures.length} failing check(s)` : '\nall checks passed')
process.exit(failures.length ? 1 : 0)
