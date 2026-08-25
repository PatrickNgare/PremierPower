import { chromium } from 'playwright'
const OUT='/tmp/claude-1000/-home-patel-Desktop-PremierPower/dcf94ed6-ddf8-44e1-bbe6-55f68f245028/scratchpad/shots'
const b=await chromium.launch()
const errs=[]
const ctx=await b.newContext({viewport:{width:1440,height:900}})
await ctx.addInitScript(()=>localStorage.setItem('pp-exit-dismissed',String(Date.now()+864e5)))
const p=await ctx.newPage()
p.on('pageerror',e=>errs.push(e.message.slice(0,150)))
p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,120))})
await p.goto('http://127.0.0.1:4195/',{waitUntil:'networkidle'})
await p.waitForSelector('h1',{timeout:60000})
await p.evaluate(async()=>{const h=document.body.scrollHeight;for(let y=0;y<h;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,150))}window.scrollTo(0,0)})
await p.waitForTimeout(1200)
await p.screenshot({path:`${OUT}/NEW-full.png`, fullPage:true})
if (await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)) errs.push('horizontal overflow')
console.log(errs.length?errs.join('\n'):'clean')
await b.close()
