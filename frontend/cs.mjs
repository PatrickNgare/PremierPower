import { chromium } from 'playwright'
const OUT='/tmp/claude-1000/-home-patel-Desktop-PremierPower/dcf94ed6-ddf8-44e1-bbe6-55f68f245028/scratchpad/shots'
const b=await chromium.launch()
const ctx=await b.newContext({viewport:{width:1440,height:1000}})
await ctx.addInitScript(()=>localStorage.setItem('pp-exit-dismissed',String(Date.now()+864e5)))
const p=await ctx.newPage()
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,140)))
await p.goto('http://127.0.0.1:4213/',{waitUntil:'networkidle'})
await p.waitForSelector('h1',{timeout:60000})
for (const [name,text] of [['services','Electrical installation, and the syste'],['solutions','solutions designed around you']]) {
  const sec=p.locator('section').filter({hasText:text}).first()
  if(!(await sec.count())){console.log(name,'NOT FOUND');continue}
  await sec.scrollIntoViewIfNeeded(); await p.waitForTimeout(2400)
  await sec.screenshot({path:`${OUT}/C-${name}.png`})
  const h=await sec.evaluate(n=>Math.round(n.getBoundingClientRect().height))
  console.log(`${name}: ${h}px`)
}
console.log(errs.length?errs.join('\n'):'clean')
await b.close()
