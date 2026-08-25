import { chromium } from 'playwright'
const OUT='/tmp/claude-1000/-home-patel-Desktop-PremierPower/dcf94ed6-ddf8-44e1-bbe6-55f68f245028/scratchpad/shots'
const b=await chromium.launch()
const ctx=await b.newContext({viewport:{width:1440,height:1000}})
await ctx.addInitScript(()=>localStorage.setItem('pp-exit-dismissed',String(Date.now()+864e5)))
const p=await ctx.newPage()
await p.goto('http://127.0.0.1:4195/',{waitUntil:'networkidle'})
await p.waitForSelector('h1',{timeout:60000})
const targets = [
  ['solutions','Lighting and electrical solutions'],
  ['lighting','Illuminate better'],
  ['services','Residential wiring'],
]
for (const [name, text] of [['solutions','solutions designed around you'],['lighting','Illuminate better'],['stats','Years trading']]) {
  const sec = p.locator('section').filter({hasText:text}).first()
  if (!(await sec.count())) { console.log(name,'NOT FOUND'); continue }
  await sec.scrollIntoViewIfNeeded(); await p.waitForTimeout(2200)
  await sec.screenshot({path:`${OUT}/S-${name}.png`})
  console.log(name,'captured')
}
await b.close()
