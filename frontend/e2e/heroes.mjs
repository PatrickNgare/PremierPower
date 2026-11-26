/**
 * The heroes: the home page's photograph carousel and the banner every
 * interior page opens with. Checks what a visitor would notice — a missing or
 * blurry photograph, a headline below the fold or under the header, controls
 * that do nothing, a page that scrolls sideways — at a laptop and a phone.
 *
 *   npm run test:heroes                          # against http://localhost:8090
 *   SITE_URL=https://… npm run test:heroes       # against a deployed site
 *   HERO_SHOTS=/some/dir npm run test:heroes     # also save screenshots
 *
 * Soft problems (an upscaled photograph) print as "warn" and do not fail.
 */
import { chromium } from 'playwright'

const SITE = (process.env.SITE_URL ?? 'http://localhost:8090').replace(/\/$/, '')
const SHOTS = process.env.HERO_SHOTS
// This machine renders slowly; waits gate on the page being ready, never on speed.
const RENDER_TIMEOUT = Number(process.env.RENDER_TIMEOUT ?? 60000)

const failures = []
const warnings = []
const check = (ok, label) => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}`)
  if (!ok) failures.push(label)
}
const warn = (label) => { console.log(`  warn ${label}`); warnings.push(label) }

const DEVICES = [
  ['laptop', { viewport: { width: 1366, height: 768 } }],
  ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
]
const PAGES = ['/services', '/products', '/portfolio', '/safety', '/about', '/testimonials', '/faq', '/contact']

const browser = await chromium.launch()

async function newPage(opts) {
  const ctx = await browser.newContext(opts)
  // The exit-intent prompt would sit over the hero and fail every visibility check.
  await ctx.addInitScript(() => localStorage.setItem('pp-exit-dismissed', String(Date.now() + 864e5)))
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  return { ctx, page, errors }
}

/** Every photograph in the first section loaded, and how sharp it is.
 *  Waits for the downloads to finish (or fail) first: a slow CDN response
 *  is not a missing photograph, and a fixed pause cannot tell the two apart. */
async function heroImages(page) {
  await page.waitForFunction(() => {
    const section = document.querySelector('main section, section')
    return [...section.querySelectorAll('img')].every((img) => img.complete)
  }, null, { timeout: RENDER_TIMEOUT }).catch(() => {})
  return page.evaluate(() => {
    const section = document.querySelector('main section, section')
    return [...section.querySelectorAll('img')].map((img) => {
      const r = img.getBoundingClientRect()
      return {
        name: (img.currentSrc || img.src).split('/').pop().slice(0, 40),
        loaded: img.complete && img.naturalWidth > 0,
        natural: img.naturalWidth,
        shown: Math.round(r.width * devicePixelRatio),
      }
    })
  })
}

async function layout(page) {
  return page.evaluate(() => {
    const h1 = document.querySelector('h1').getBoundingClientRect()
    const header = document.querySelector('header')?.getBoundingClientRect()
    return {
      h1Top: h1.top, h1Bottom: h1.bottom,
      headerBottom: header ? header.bottom : 0,
      vh: innerHeight,
      overflowX: document.documentElement.scrollWidth - innerWidth,
    }
  })
}

function imageChecks(device, path, imgs, required = true) {
  if (imgs.length === 0 && !required) { warn(`${device} ${path} — banner has no photograph`); return }
  check(imgs.length > 0, `${device} ${path} — hero has a photograph`)
  for (const im of imgs) {
    check(im.loaded, `${device} ${path} — photograph loads (${im.name})`)
    // 0.8: a little upscaling is invisible; much more reads as soft.
    if (im.loaded && im.natural < im.shown * 0.8) {
      warn(`${device} ${path} — ${im.name} is ${im.natural}px wide, shown at ${im.shown}px: will look soft`)
    }
  }
}

/**
 * Content under the hero that is on screen but still invisible. A reveal that
 * waits for too much of a tall block to scroll in leaves an empty band at the
 * fold, which reads as a broken page rather than an animation.
 */
async function hiddenAtFold(page) {
  // Polled, not sampled once: on a slow machine content can still be
  // arriving, and an entrance still playing is not a reveal that never fires.
  let last = []
  for (let k = 0; k < 8; k++) {
    last = await foldScan(page)
    if (last.length === 0) return last
    await page.waitForTimeout(2000)
  }
  return last
}

function foldScan(page) {
  return page.evaluate(() => {
    const hero = document.querySelector('main section, section').getBoundingClientRect()
    const out = []
    for (const el of document.querySelectorAll('main li, main article, main h2, main p, main img')) {
      const r = el.getBoundingClientRect()
      if (r.top < hero.bottom || r.top > innerHeight - 24 || r.height === 0) continue
      let o = 1
      for (let n = el; n && n !== document.body; n = n.parentElement) o *= Number(getComputedStyle(n).opacity)
      if (o < 0.1 && !el.closest('[aria-hidden=true]')) out.push(`${el.tagName.toLowerCase()} at y=${Math.round(r.top)}`)
    }
    return out
  })
}

function layoutChecks(device, path, l) {
  check(l.h1Top >= l.headerBottom - 1, `${device} ${path} — headline clears the header`)
  check(l.h1Bottom <= l.vh, `${device} ${path} — headline is above the fold`)
  check(l.overflowX <= 0, `${device} ${path} — no sideways scroll (${l.overflowX}px)`)
}

const selected = (page) => page.getAttribute('[role=tab][aria-selected=true]', 'aria-label')

// ── The home hero ──────────────────────────────────────────────────────────
for (const [device, opts] of DEVICES) {
  console.log(`\nhome hero — ${device}`)
  const { ctx, page, errors } = await newPage(opts)
  await page.goto(SITE + '/', { waitUntil: 'networkidle', timeout: RENDER_TIMEOUT })
  await page.waitForSelector('[role=tab]', { timeout: RENDER_TIMEOUT })
  // Past the load reveal, so the headline has risen into place.
  await page.waitForTimeout(2500)

  imageChecks(device, '/', await heroImages(page))
  const l = await layout(page)
  layoutChecks(device, '/', l)
  const hidden = await hiddenAtFold(page)
  check(hidden.length === 0, `${device} / — nothing left invisible below the hero${hidden.length ? ': ' + hidden.slice(0, 3).join(', ') : ''}`)

  const cta = await page.locator('section a.btn-primary').first().boundingBox()
  check(cta && cta.y + cta.height <= l.vh, `${device} / — main call to action is above the fold`)

  // The last hidden phrase is the slogan; the first is the separator
  // between the small label and the slogan, both inside the H1.
  const spoken = await page.locator('h1 .sr-only').last().innerText()
  check(/Powering spaces/.test(spoken), `${device} / — headline is one stable sentence for screen readers`)

  // The marker's fill is the carousel's clock; 12s a photograph.
  const clock = await page.$eval('[role=tab][aria-selected=true] span', (el) => getComputedStyle(el).animationDuration)
  check(clock === '12s', `${device} / — each photograph shows for 12s (${clock})`)

  // The neighbours are fetched ahead, so a change never wipes in an empty room.
  const slides = await page.evaluate(() => fetch('/api/banners').then((r) => r.json()).catch(() => []))
  if (slides.length > 1) {
    const stem = (u) => u.split('/').pop().replace(/\.[a-z]+$/, '')
    const fetched = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name))
    for (const k of [1, slides.length - 1]) {
      const want = stem(slides[k].image_url)
      check(fetched.some((u) => u.includes(want)), `${device} / — slide ${k + 1} photograph fetched ahead (${want})`)
    }
  }

  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${device}-home.png` })

  const first = await selected(page)
  if (device === 'laptop') {
    await page.mouse.move(900, 300) // hover pauses autoplay
    const state = await page.$eval('[role=tab][aria-selected=true] span', (el) => getComputedStyle(el).animationPlayState)
    check(state === 'paused', `${device} / — hovering the hero pauses it`)

    await page.click('button[aria-label="Next slide"]')
    await page.waitForTimeout(400)
    const second = await selected(page)
    check(second !== first, `${device} / — next arrow changes the photograph`)
    await page.waitForTimeout(1500) // let the wipe finish
    imageChecks(device, '/ (slide 2)', await heroImages(page))
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${device}-home-slide2.png` })

    await page.click('button[aria-label="Previous slide"]')
    await page.waitForTimeout(400)
    check((await selected(page)) === first, `${device} / — previous arrow goes back`)

    await page.click('li:last-child > [role=tab]')
    await page.waitForTimeout(400)
    check(/^Slide \d+/.test(await selected(page)) && (await selected(page)) !== first, `${device} / — a slide marker jumps to that photograph`)

    await page.focus('button[aria-label="Next slide"]')
    const before = await selected(page)
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(400)
    check((await selected(page)) !== before, `${device} / — arrow keys move between photographs`)
  } else {
    // A real touch swipe, right to left, across the photograph.
    const cdp = await ctx.newCDPSession(page)
    const y = 300
    const pts = (x) => [{ x, y }]
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(320) })
    for (const x of [290, 240, 180, 120, 80]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(x) })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(500)
    check((await selected(page)) !== first, `${device} / — swiping changes the photograph`)

    // A vertical drag is a scroll, never a swipe.
    const now = await selected(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 500 }] })
    for (const yy of [460, 400, 340, 300]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: yy }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(500)
    check((await selected(page)) === now, `${device} / — scrolling down does not change the photograph`)
  }

  check(errors.length === 0, `${device} / — no script errors${errors.length ? ': ' + errors[0] : ''}`)
  await ctx.close()
}

// ── Reduced motion: everything readable, nothing moving on its own ─────────
{
  console.log('\nhome hero — reduced motion')
  const { ctx, page } = await newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' })
  await page.goto(SITE + '/', { waitUntil: 'networkidle', timeout: RENDER_TIMEOUT })
  await page.waitForSelector('[role=tab]', { timeout: RENDER_TIMEOUT })
  await page.waitForTimeout(1500)
  const anim = await page.$eval('[role=tab][aria-selected=true] span', (el) => getComputedStyle(el).animationName)
  check(anim === 'none', 'reduced motion — no autoplay')
  const opacity = await page.$eval('h1 [aria-hidden=true]', (el) => getComputedStyle(el).opacity)
  check(Number(opacity) === 1, 'reduced motion — headline fully visible')
  await ctx.close()
}

// ── Interior page banners ──────────────────────────────────────────────────
for (const [device, opts] of DEVICES) {
  console.log(`\npage banners — ${device}`)
  const { ctx, page, errors } = await newPage(opts)
  for (const path of PAGES) {
    await page.goto(SITE + path, { waitUntil: 'networkidle', timeout: RENDER_TIMEOUT })
    await page.waitForSelector('h1', { timeout: RENDER_TIMEOUT })
    await page.waitForTimeout(1500)
    imageChecks(device, path, await heroImages(page), false)
    layoutChecks(device, path, await layout(page))
    const hidden = await hiddenAtFold(page)
    check(hidden.length === 0, `${device} ${path} — nothing left invisible below the banner${hidden.length ? ': ' + hidden.slice(0, 3).join(', ') : ''}`)
    const h1 = (await page.locator('h1').innerText()).trim()
    check(h1.length > 0, `${device} ${path} — has a headline ("${h1.slice(0, 40)}")`)
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${device}${path.replace(/\//g, '-')}.png` })
  }
  check(errors.length === 0, `${device} banners — no script errors${errors.length ? ': ' + errors[0] : ''}`)
  await ctx.close()
}

await browser.close()

if (warnings.length) console.log(`\n${warnings.length} warning(s)`)
console.log(failures.length ? `${failures.length} failing check(s)` : 'all checks passed')
process.exit(failures.length ? 1 : 0)
