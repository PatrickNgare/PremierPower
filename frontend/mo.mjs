import { chromium } from 'playwright'
const OUT='/tmp/claude-1000/-home-patel-Desktop-PremierPower/dcf94ed6-ddf8-44e1-bbe6-55f68f245028/scratchpad/shots'
const b=await chromium.launch()

// 1. Normal motion: headings must end up fully visible and readable.
const ctx=await b.newContext({viewport:{width:1440,height:900}})
await ctx.addInitScript(()=>localStorage.setItem('pp-exit-dismissed',String(Date.now()+864e5)))
const p=await ctx.newPage()
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,140)))
await p.goto('http://127.0.0.1:4219/',{waitUntil:'networkidle'})
await p.waitForSelector('h1',{timeout:60000})
const sec = p.locator('section').filter({hasText:'Delivered with the contractors'}).first()
await sec.scrollIntoViewIfNeeded(); await p.waitForTimeout(2500)
const h2 = sec.locator('h2').first()
console.log('heading text     :', (await h2.innerText()).replace(/\n/g,' ').slice(0,44))
console.log('heading readable :', await h2.evaluate(n=>{
  const inner=n.querySelector('[aria-hidden] span span')
  return inner ? getComputedStyle(inner).transform : 'no-wrapper'
}))
console.log('sr-only present  :', await h2.locator('.sr-only').count())
await sec.screenshot({path:`${OUT}/REVEAL.png`})
await ctx.close()

// 2. Reduced motion: the reveal must not wrap the text at all.
const ctx2=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'})
await ctx2.addInitScript(()=>localStorage.setItem('pp-exit-dismissed',String(Date.now()+864e5)))
const p2=await ctx2.newPage()
await p2.goto('http://127.0.0.1:4219/',{waitUntil:'networkidle'})
await p2.waitForSelector('h1',{timeout:60000}); await p2.waitForTimeout(900)
const h1 = p2.locator('h1').first()
console.log('reduced: opacity :', await h1.evaluate(n=>getComputedStyle(n).opacity))
console.log('reduced: wrapper :', await h1.evaluate(n=>n.querySelector('[aria-hidden]') ? 'present' : 'none'))
await ctx2.close()
console.log(errs.length?errs.join('\n'):'clean')
await b.close()
