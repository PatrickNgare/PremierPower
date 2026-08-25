import { chromium } from 'playwright'
const OUT='/tmp/claude-1000/-home-patel-Desktop-PremierPower/dcf94ed6-ddf8-44e1-bbe6-55f68f245028/scratchpad/shots'
const b=await chromium.launch()
for (const [name,vp] of [['1366',{width:1366,height:768}],['1152',{width:1152,height:720}],['1024',{width:1024,height:700}]]) {
  const ctx=await b.newContext({viewport:vp})
  await ctx.addInitScript(()=>localStorage.setItem('pp-exit-dismissed',String(Date.now()+864e5)))
  const p=await ctx.newPage()
  await p.goto('http://127.0.0.1:4198/',{waitUntil:'networkidle'})
  await p.waitForSelector('h1',{timeout:60000}); await p.waitForTimeout(1600)
  const nav = await p.locator('header nav ul li').count()
  const heroH = await p.locator('section').first().evaluate(n=>Math.round(n.getBoundingClientRect().height))
  const cta = await p.getByRole('link',{name:/explore our solutions/i}).first().boundingBox()
  const fits = cta && (cta.y + cta.height) <= vp.height
  console.log(`${name}x${vp.height}: navLinks=${nav} hero=${heroH}px ctaBottom=${cta?Math.round(cta.y+cta.height):'?'} aboveFold=${fits}`)
  if (name==='1366') await p.screenshot({path:`${OUT}/FIT-1366.png`})
  await ctx.close()
}
await b.close()
