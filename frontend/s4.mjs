import { chromium } from 'playwright'
const OUT='/tmp/claude-1000/-home-patel-Desktop-PremierPower/dcf94ed6-ddf8-44e1-bbe6-55f68f245028/scratchpad/shots'
const b=await chromium.launch(); const errs=[]
const ctx=await b.newContext({viewport:{width:1440,height:1000}})
await ctx.addInitScript(()=>localStorage.setItem('pp-exit-dismissed',String(Date.now()+864e5)))
const p=await ctx.newPage()
p.on('pageerror',e=>errs.push(e.message.slice(0,150)))
p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,120))})
await p.goto('http://127.0.0.1:4196/',{waitUntil:'networkidle'})
await p.waitForSelector('h1',{timeout:60000})
for (const [name, text] of [['projects','Delivered with the contractors'],['cta',"illuminate"],['footer','Registration']]) {
  const sel = name==='footer' ? p.locator('footer') : p.locator('section').filter({hasText:text}).first()
  if(!(await sel.count())){ console.log(name,'NOT FOUND'); continue }
  await sel.scrollIntoViewIfNeeded(); await p.waitForTimeout(2200)
  await sel.screenshot({path:`${OUT}/N-${name}.png`})
  console.log(name,'ok')
}
if (await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)) errs.push('horizontal overflow')
console.log(errs.length?errs.join('\n'):'clean')
await b.close()
