import { chromium } from 'playwright'
const OUT='/tmp/claude-1000/-home-patel-Desktop-PremierPower/dcf94ed6-ddf8-44e1-bbe6-55f68f245028/scratchpad/shots'
const b=await chromium.launch()
for (const [name,vp] of [['1366',{width:1366,height:768}],['1280',{width:1280,height:800}]]) {
  const ctx=await b.newContext({viewport:vp})
  await ctx.addInitScript(()=>localStorage.setItem('pp-exit-dismissed',String(Date.now()+864e5)))
  const p=await ctx.newPage()
  await p.goto('http://localhost:8090/',{waitUntil:'networkidle'})
  await p.waitForSelector('h1',{timeout:60000}); await p.waitForTimeout(1800)
  await p.screenshot({path:`${OUT}/LOOK-${name}.png`})
  const navLinks = await p.locator('header nav ul li').count()
  const heroH = await p.locator('section').first().evaluate(n=>Math.round(n.getBoundingClientRect().height))
  const cardVisible = await p.locator('section').first().locator('img').nth(1).isVisible().catch(()=>false)
  console.log(`${name}: visible nav links=${navLinks} heroHeight=${heroH} viewport=${vp.height} specimenCard=${cardVisible}`)
  await ctx.close()
}
await b.close()
