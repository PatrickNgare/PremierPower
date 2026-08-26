import { chromium } from 'playwright'
const OUT='/tmp/claude-1000/-home-patel-Desktop-PremierPower/dcf94ed6-ddf8-44e1-bbe6-55f68f245028/scratchpad/shots'
const b=await chromium.launch(); const errs=[]
const ctx=await b.newContext({viewport:{width:1440,height:900}})
await ctx.addInitScript(()=>localStorage.setItem('pp-exit-dismissed',String(Date.now()+864e5)))
const p=await ctx.newPage()
p.on('pageerror',e=>errs.push(e.message.slice(0,140)))
await p.goto('http://127.0.0.1:4232/',{waitUntil:'networkidle'})
await p.waitForSelector('h1',{timeout:60000})
await p.mouse.move(1150,430); await p.waitForTimeout(2000)
const card = p.locator('section').first().locator('.backdrop-blur-2xl').first()
const box = await card.boundingBox()
console.log('card size :', box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'MISSING')
console.log('glass bg  :', await card.evaluate(n=>getComputedStyle(n).backgroundColor))
console.log('backdrop  :', await card.evaluate(n=>getComputedStyle(n).backdropFilter))
console.log('tilt      :', await card.evaluate(n=>getComputedStyle(n).transform).then(t=>t.slice(0,44)))
await p.screenshot({path:`${OUT}/CARD.png`, clip:{x:800,y:40,width:640,height:800}})
console.log(errs.length?errs.join('\n'):'clean')
await b.close()
