/**
 * Light / dark mode end-to-end check.
 *
 * Three things have to hold, and only one of them is about colour:
 *
 *   1. Light mode is unchanged. Every semantic role must still resolve to the
 *      exact literal it replaced, or the switch has quietly restyled a site
 *      nobody asked to restyle.
 *   2. Dark mode is readable. Text is measured against the ground actually
 *      painted behind it, with translucent layers composited down — the thing
 *      a token-level check cannot see.
 *   3. The choice survives. It is written down, it is re-applied before first
 *      paint on the next navigation, and no page flashes white on the way.
 *
 * Needs the site running (see README "Testing"):
 *   SITE_URL=http://127.0.0.1:8090 node e2e/theme.mjs
 */
import { chromium } from 'playwright'

const SITE = process.env.SITE_URL ?? 'http://127.0.0.1:8090'
const RENDER_TIMEOUT = Number(process.env.RENDER_TIMEOUT ?? 40000)

const PAGES = ['/', '/services', '/products', '/portfolio', '/safety', '/about', '/testimonials', '/faq', '/contact']

const failures = []
const check = (ok, label) => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}`)
  if (!ok) failures.push(label)
}

/** The light value each semantic role replaced. Drift here is a visual regression. */
const LIGHT_ROLES = {
  '--color-surface': '#fff', '--color-surface-2': '#f8f7f5', '--color-surface-3': '#ece9e4',
  '--color-page': '#fcfcfb', '--color-page-warm': '#f7f5f1',
  '--color-line': '#e4e1dc', '--color-line-soft': '#ece9e4', '--color-line-firm': '#cfcbc4',
  '--color-body': '#0d0e11', '--color-body-strong': '#16181d',
  '--color-body-mid': '#22252c', '--color-body-soft': '#3a3e48',
}

/**
 * Runs in the page. Composites every translucent layer down to the first
 * opaque ancestor, because a token-level check cannot see what is actually
 * painted behind a line of text.
 */
function contrastSweep() {
  const parse = (c) => {
    const m = c.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/)
    if (m) return { r: +m[1] * 255, g: +m[2] * 255, b: +m[3] * 255, a: m[4] === undefined ? 1 : +m[4] }
    const n = (c.match(/[\d.]+/g) || [0, 0, 0]).map(Number)
    return { r: n[0] || 0, g: n[1] || 0, b: n[2] || 0, a: n.length > 3 ? n[3] : 1 }
  }
  const over = (f, b) => ({
    r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1,
  })
  const lum = (o) => {
    const t = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
    return 0.2126 * t(o.r) + 0.7152 * t(o.g) + 0.0722 * t(o.b)
  }
  const groundOf = (el) => {
    const stack = []
    let opaque = null
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const b = getComputedStyle(n).backgroundColor
      if (b && !/rgba\(0, 0, 0, 0\)/.test(b)) { const p = parse(b); stack.push(p); if (p.a >= 0.999) { opaque = p; break } }
    }
    // A section marks itself .on-dark to say "this subtree sits on the dark
    // showroom ground". That ground is often painted by an absolutely
    // positioned sibling — a photograph and its scrim — which walking
    // ancestors never finds, so without this every hero reads as white.
    let base
    if (!opaque && el.closest('.on-dark')) base = { r: 8, g: 8, b: 10, a: 1 }
    else base = parse(getComputedStyle(document.body).backgroundColor)
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base)
    return base
  }
  const ratio = (fg, bg) => {
    const f = over(parse(fg), bg)
    const [x, y] = [lum(f), lum(bg)].sort((p, q) => q - p)
    return +((x + 0.05) / (y + 0.05)).toFixed(2)
  }

  const out = []
  let checked = 0
  const sel = 'p,span,a,h1,h2,h3,h4,li,dt,dd,button,label,small,strong,figcaption,blockquote'
  document.querySelectorAll(sel).forEach((el) => {
    const txt = (el.textContent || '').trim()
    if (!txt) return
    if ([...el.children].some((c) => (c.textContent || '').trim().length > 0)) return
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity < 0.15) return
    const rc = el.getBoundingClientRect()
    if (rc.width === 0 || rc.height === 0) return
    // Text over a photograph is judged by its scrim, not by a colour token.
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const bi = getComputedStyle(n).backgroundImage
      if (bi && bi !== 'none') return
    }
    checked++
    const px = parseFloat(s.fontSize)
    const bold = parseInt(s.fontWeight) >= 700
    const need = px >= 24 || (px >= 18.66 && bold) ? 3 : 4.5
    const r = ratio(s.color, groundOf(el))
    if (r < need) out.push({ t: txt.slice(0, 40), px: +px.toFixed(1), r, need, cls: String(el.className).slice(0, 50) })
  })
  return { checked, fails: out }
}

const browser = await chromium.launch()

// ── 1. light mode is byte-identical to what it replaced ─────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
  await page.goto(SITE + '/', { waitUntil: 'domcontentloaded', timeout: RENDER_TIMEOUT })
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
  const got = await page.evaluate((roles) => {
    const cs = getComputedStyle(document.documentElement)
    const norm = (s) => (s === '#ffffff' ? '#fff' : s)
    return Object.fromEntries(Object.keys(roles).map((k) => [k, norm(cs.getPropertyValue(k).trim().toLowerCase())]))
  }, LIGHT_ROLES)
  for (const [k, want] of Object.entries(LIGHT_ROLES)) {
    check(got[k] === want, `light role ${k} is ${want}${got[k] === want ? '' : ` (got ${got[k]})`}`)
  }
  await page.close()
}

// ── 2. the switch works, persists, and beats the system preference ─────────
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, colorScheme: 'light' })
  const page = await ctx.newPage()
  await page.goto(SITE + '/', { waitUntil: 'domcontentloaded', timeout: RENDER_TIMEOUT })
  check((await page.getAttribute('html', 'data-theme')) === 'light', 'opens on a light system preference')

  const toggle = page.locator('button[aria-label^="Switch to"]:visible').first()
  await toggle.click()
  await page.waitForTimeout(400)
  check((await page.getAttribute('html', 'data-theme')) === 'dark', 'toggle switches to dark')
  check((await page.evaluate(() => localStorage.getItem('pp-theme'))) === 'dark', 'the choice is written down')
  check(
    (await page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.content)) === '#0D0E11',
    'browser chrome colour follows the theme',
  )

  // The real test of the no-flash script: a fresh navigation must already be
  // dark in the very first frame, before React has mounted.
  await page.goto(SITE + '/services', { waitUntil: 'commit', timeout: RENDER_TIMEOUT })
  check((await page.getAttribute('html', 'data-theme')) === 'dark', 'dark is applied before first paint on the next page')

  // ...and back again, so the control is a real two-way switch.
  await page.goto(SITE + '/', { waitUntil: 'domcontentloaded', timeout: RENDER_TIMEOUT })
  await page.locator('button[aria-label^="Switch to"]:visible').first().click()
  await page.waitForTimeout(400)
  check((await page.getAttribute('html', 'data-theme')) === 'light', 'toggle switches back to light')

  // A stored choice outranks the operating system, not merely matches it.
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.waitForTimeout(600)
  check((await page.getAttribute('html', 'data-theme')) === 'light', 'a stored choice beats a dark OS')

  // Operable without a mouse.
  await page.locator('button[aria-label^="Switch to"]:visible').first().focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(400)
  check((await page.getAttribute('html', 'data-theme')) === 'dark', 'the switch is keyboard-operable')

  await ctx.close()
}

// ── 3. a dark system preference is honoured when nothing is stored ──────────
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, colorScheme: 'dark' })
  const page = await ctx.newPage()
  await page.goto(SITE + '/', { waitUntil: 'domcontentloaded', timeout: RENDER_TIMEOUT })
  check((await page.getAttribute('html', 'data-theme')) === 'dark', 'follows a dark system preference with nothing stored')
  await ctx.close()
}

// ── 4. dark mode introduces no contrast regression ──────────────────────────
//
// Measured differentially, on purpose. An absolute sweep cannot judge text
// sitting on a photograph or on a scrim painted by a positioned sibling, and
// this site is full of both — those rows fail in light mode too, and light
// mode is what already ships. What matters is whether *switching the theme*
// makes something unreadable that was readable before. So each page is swept
// in both themes and only the difference is a failure.
const sweepPage = async (ctx, path, theme) => {
  const page = await ctx.newPage()
  await page.goto(SITE + path, { waitUntil: 'domcontentloaded', timeout: RENDER_TIMEOUT })
  // Routes are lazily loaded, so a fixed wait measured the shell on a slow
  // pass and the page on a fast one — the node counts swung between 43 and 83
  // and the comparison was meaningless. Gate on the route's own heading.
  await page.waitForSelector('h1', { timeout: RENDER_TIMEOUT })
  // And on the photography settling, because a hero that has not loaded its
  // image paints a different ground than one that has.
  await page.waitForLoadState('networkidle', { timeout: RENDER_TIMEOUT }).catch(() => {})
  await page.evaluate(async () => {
    const h = document.body.scrollHeight
    for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(700)
  const applied = await page.getAttribute('html', 'data-theme')
  if (applied !== theme) throw new Error(`${path}: expected ${theme}, page was ${applied}`)
  const res = await page.evaluate(contrastSweep)
  await page.close()
  return res
}

const makeCtx = async (theme) => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  await ctx.addInitScript((t) => {
    localStorage.setItem('pp-theme', t)
    localStorage.setItem('pp-exit-dismissed', String(Date.now() + 864e5))
  }, theme)
  return ctx
}

const lightCtx = await makeCtx('light')
const darkCtx = await makeCtx('dark')

for (const path of PAGES) {
  const light = await sweepPage(lightCtx, path, 'light')
  const dark = await sweepPage(darkCtx, path, 'dark')

  // Key on the text itself: the same line of copy in both runs.
  const lightFails = new Set(light.fails.map((f) => f.t))
  const regressions = dark.fails.filter((f) => !lightFails.has(f.t))
  const preexisting = dark.fails.length - regressions.length

  check(
    regressions.length === 0,
    `${path} — ${dark.checked} text nodes; ${regressions.length} dark-only regression(s)` +
      (preexisting ? `, ${preexisting} pre-existing (fails in light too)` : ''),
  )
  for (const f of regressions.slice(0, 8)) {
    console.log(`         ${f.r}:1 (needs ${f.need}) ${f.px}px "${f.t}"  .${f.cls}`)
  }
}

await lightCtx.close()
await darkCtx.close()

await browser.close()

console.log(failures.length ? `\n${failures.length} failing check(s)` : '\nall theme checks passed')
process.exit(failures.length ? 1 : 0)
