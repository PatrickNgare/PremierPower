import { chromium } from 'playwright'
const OUT='/tmp/claude-1000/-home-patel-Desktop-PremierPower/dcf94ed6-ddf8-44e1-bbe6-55f68f245028/scratchpad/shots'
const b=await chromium.launch()
const ctx=await b.newContext({viewport:{width:1440,height:900}})
await ctx.addInitScript(()=>localStorage.setItem('pp-exit-dismissed',String(Date.now()+864e5)))
const p=await ctx.newPage()
await p.goto('http://localhost:8090/',{waitUntil:'networkidle'})
await p.waitForSelector('h1',{timeout:60000})
// Reveal everything, then measure section rhythm.
await p.evaluate(async()=>{const h=document.body.scrollHeight;for(let y=0;y<h;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}window.scrollTo(0,0)})
await p.waitForTimeout(1500)
const rhythm = await p.evaluate(()=>[...document.querySelectorAll('main > div > section, main section')].map(s=>{
  const r=s.getBoundingClientRect(); const cs=getComputedStyle(s)
  const h2=s.querySelector('h2,h1')
  return { h: Math.round(r.height), pt: cs.paddingTop, pb: cs.paddingBottom, bg: cs.backgroundColor,
           title: (h2?.textContent||'').trim().slice(0,38) }
}))
console.log(JSON.stringify(rhythm,null,1).slice(0,2200))
await b.close()
