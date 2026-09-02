/**
 * Finds the places where missing content produced something worse than nothing.
 *
 *   SITE_URL=https://example.com npm run audit:empty
 *
 * Reports sections that render a heading with nothing under it, tall bands
 * carrying almost no content, lists that came back empty, and placeholder
 * wording that reached the page. It found the home page printing its own build
 * brief to visitors — "three or more real reviews, favouring the ones that
 * mention safety" — under a heading reading "What clients say".
 *
 * The scrolling is the fiddly part and is deliberate. Sections mount on
 * useInView, so they only exist once the viewport has passed over them:
 * clamping the scroll to the current height stops before the next trigger, and
 * jumping to the bottom skips everything between. Both under-measured the home
 * page at 1412px when it is 9888px, and both reported zero findings on a page
 * that had never rendered. Only a steady incremental pass, after networkidle,
 * mounts it.
 */
import { chromium } from 'playwright'
const SITE = process.env.SITE_URL ?? 'http://127.0.0.1:8090'
const PAGES = ['/', '/services', '/products', '/portfolio', '/safety', '/about', '/testimonials', '/faq', '/contact']

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } })
await ctx.addInitScript(() => localStorage.setItem('pp-exit-dismissed', String(Date.now() + 864e5)))
const page = await ctx.newPage()

const report = {}
for (const path of PAGES) {
  await page.goto(SITE + path, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
  await page.waitForTimeout(2200)
  // Sections reveal via useInView, so they only mount if the viewport
  // actually passes over them. Two wrong approaches first: clamping the scroll
  // to the current height stops before the next trigger point, and jumping
  // straight to the bottom skips every section in between — both under-measured
  // the home page at 1412px when it is 9768px. A steady incremental pass with a
  // generous unconditional bound is what actually mounts everything.
  await page.evaluate(async () => {
    // Two passes: the first mounts what it passes over, which makes the page
    // taller, and the second reaches whatever that revealed. No early break —
    // it fired before the API data had arrived and cut the home page short.
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y <= 26000; y += 400) {
        window.scrollTo(0, y)
        await new Promise(r => setTimeout(r, 60))
      }
      window.scrollTo(0, 0)
      await new Promise(r => setTimeout(r, 600))
    }
  })
  await page.waitForTimeout(2000)

  report[path] = await page.evaluate(() => {
    const out = { emptySections: [], placeholders: [], bigGaps: [], zeroLists: [], brokenImg: 0 }

    // A section whose heading promises content but which renders almost nothing.
    document.querySelectorAll('section').forEach(s => {
      const r = s.getBoundingClientRect()
      if (r.height === 0) return
      const heading = s.querySelector('h1,h2,h3')?.textContent?.trim().slice(0, 48) || '(no heading)'
      const text = (s.innerText || '').trim()
      const media = s.querySelectorAll('img,video,svg,canvas').length
      const links = s.querySelectorAll('a,button').length
      // heading only, nothing under it
      const bodyText = text.replace(heading, '').trim()
      if (bodyText.length < 25 && media === 0 && links === 0) {
        out.emptySections.push({ heading, h: Math.round(r.height), text: text.slice(0, 60) })
      }
      // a tall section carrying very little
      if (r.height > 380 && bodyText.length < 90 && media <= 1) {
        out.bigGaps.push({ heading, h: Math.round(r.height), chars: bodyText.length })
      }
    })

    // Lists that rendered zero items.
    document.querySelectorAll('ul,ol').forEach(l => {
      if (l.children.length === 0 && l.getBoundingClientRect().height < 4) {
        const near = l.closest('section')?.querySelector('h2,h3')?.textContent?.trim().slice(0, 44)
        if (near) out.zeroLists.push(near)
      }
    })

    // Visible placeholder wording.
    const rx = /photograph required|dummy|sample —|not a licence|not a registration|coming soon|lorem|placeholder|to be confirmed|awaiting/i
    document.querySelectorAll('*').forEach(el => {
      if ([...el.children].some(c => (c.textContent || '').trim())) return
      const t = (el.textContent || '').trim()
      if (t && rx.test(t) && el.getBoundingClientRect().height > 0) out.placeholders.push(t.slice(0, 70))
    })
    out.placeholders = [...new Set(out.placeholders)]

    out.brokenImg = [...document.images].filter(i => i.complete && i.naturalWidth === 0).length
    out.pageHeight = Math.round(document.body.scrollHeight)
    return out
  })
}
await b.close()

let issues = 0
for (const [p, r] of Object.entries(report)) {
  const n = r.emptySections.length + r.bigGaps.length + r.zeroLists.length + r.placeholders.length
  issues += n
  console.log(`\n${'='.repeat(64)}\n${p}   (${r.pageHeight}px tall)  — ${n} finding(s)`)
  if (r.emptySections.length) { console.log('  EMPTY SECTIONS:'); r.emptySections.forEach(e => console.log(`    ${e.h}px  "${e.heading}"  ${JSON.stringify(e.text)}`)) }
  if (r.bigGaps.length)       { console.log('  TALL BUT NEARLY EMPTY:'); r.bigGaps.forEach(e => console.log(`    ${e.h}px  "${e.heading}"  (${e.chars} chars)`)) }
  if (r.zeroLists.length)     { console.log('  LISTS WITH NO ITEMS:'); [...new Set(r.zeroLists)].forEach(e => console.log(`    "${e}"`)) }
  if (r.placeholders.length)  { console.log('  PLACEHOLDER TEXT ON SCREEN:'); r.placeholders.forEach(e => console.log(`    ${JSON.stringify(e)}`)) }
  if (r.brokenImg)            console.log(`  broken images: ${r.brokenImg}`)
}
console.log(`\n${'='.repeat(64)}\nTOTAL: ${issues} findings`)
