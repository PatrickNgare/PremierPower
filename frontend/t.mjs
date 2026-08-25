import { chromium } from 'playwright'
const OUT='/tmp/claude-1000/-home-patel-Desktop-PremierPower/dcf94ed6-ddf8-44e1-bbe6-55f68f245028/scratchpad/shots'
const b=await chromium.launch(); const errs=[]
const ctx=await b.newContext({viewport:{width:1440,height:1000}})
await ctx.addInitScript(()=>localStorage.setItem('pp-exit-dismissed',String(Date.now()+864e5)))
const p=await ctx.newPage()
p.on('pageerror',e=>errs.push(e.message.slice(0,160)))
p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,130))})
await p.goto('http://127.0.0.1:4197/',{waitUntil:'networkidle'})
await p.waitForSelector('h1',{timeout:60000})
const navH = async () => p.locator('header nav > div').first().evaluate(n=>Math.round(n.getBoundingClientRect().height))
console.log('nav height at top     :', await navH())
await p.evaluate(()=>window.scrollTo(0,900)); await p.waitForTimeout(900)
console.log('nav height scrolled   :', await navH())
// Route transition: navigate and confirm the new page renders.
await p.click('a[href="/contact"]'); await p.waitForTimeout(1400)
await p.waitForSelector('form',{timeout:30000})
console.log('contact form fields   :', await p.locator('form input, form select, form textarea').count())
await p.screenshot({path:`${OUT}/FORM.png`})
console.log(errs.length?errs.join('\n'):'clean')
await b.close()
