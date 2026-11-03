/* FLS geometry audit: live browser, real career, 320–1920px. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';

const folder='tests/screenshots/v4';
await mkdir(folder,{recursive:true});
const server=spawn('python3',['-m','http.server','8878','--bind','127.0.0.1'],{stdio:['ignore','pipe','pipe']});
const widths=[320,360,375,390,428,768,1024,1280,1440,1920];
const results=[],errors=[];
let browser,page;
async function audit(label,width,tab,shot){
 await page.setViewportSize({width,height:Math.max(760,Math.round(width*.59))});
 if(tab)await page.evaluate(t=>Game.tab(t),tab);
 await page.evaluate(()=>document.fonts.ready);
 const data=await page.evaluate(()=>{
   const el=selector=>document.querySelector(selector);
   const rect=element=>{if(!element)return null;const r=element.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,center:r.x+r.width/2};};
   const main=el('.v4-main'),work=el('.v4-workspace'),fixture=el('.fls-v3-versus'),vs=fixture?.querySelector('.fls-vs');
   const preview=el('.v4-bigfixture'),preVs=preview?.querySelector(':scope > strong');
   const live=el('.fdg11-scoreboard'),score=live?.querySelector('#fdg11-score');
   const centers=[
     ['main',main&&work?Math.abs(rect(main).center-rect(work).center):null],
     ['fixture',fixture&&vs?Math.abs(rect(fixture).center-rect(vs).center):null],
     ['preview',preview&&preVs?Math.abs(rect(preview).center-rect(preVs).center):null],
     ['v11',live&&score?Math.abs(rect(live).center-rect(score).center):null]
   ].filter(x=>x[1]!==null);
   const surfaces=['.v4-main','.v4-toolbar','.v4-bottomnav','.fls-v3-matchday','.fls-v3-pagehead','.v4-steps','.fls-v3-shortcuts','.setupcard','.fdg11-scoreboard'].map(selector=>({selector,rect:rect(el(selector))})).filter(x=>x.rect);
   return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,centers,surfaces,brand:el('.v4-mobbrand strong')?.textContent?.trim()||'',screen:window.S?.view==='hub'?(window.activeTab||'hub'):(window.S?.view||'setup')};
 });
 assert.ok(data.scrollWidth<=width+2,label+': document overflow '+data.scrollWidth+' at '+width);
 for(const pair of data.centers)assert.ok(pair[1]<=5,label+': '+pair[0]+' off-center by '+pair[1].toFixed(1)+'px');
 for(const surface of data.surfaces){
   if(surface.selector==='.v4-bottomnav'&&width>760)continue;
   assert.ok(surface.rect.left>=-3&&surface.rect.right<=width+3,label+': '+surface.selector+' outside viewport at '+width);
 }
 if(width<=760&&data.brand)assert.equal(data.brand,'FOOTBALL LIFE');
 if(shot)await page.screenshot({path:folder+'/'+shot+'.png',fullPage:true,animations:'disabled'});
 results.push({label,width,screen:data.screen,documentWidth:data.scrollWidth,centerErrors:Object.fromEntries(data.centers)});
 console.log('LAYOUT PASS',label,width);
}
try{
 let available=false;
 for(let i=0;i<60;i++){
   try{const r=await fetch('http://127.0.0.1:8878/');if(r.ok){available=true;break;}}catch{}
   await new Promise(resolve=>setTimeout(resolve,160));
 }
 assert.ok(available,'server failed to start');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='warning'&&/FLS precision UI|FLS Personality layer|FLSUI decoration/.test(m.text()))errors.push(m.text());});
 await page.goto('http://127.0.0.1:8878/',{waitUntil:'domcontentloaded'});
 await page.locator('.setuphero').waitFor();
 for(const w of [320,375,768,1440])await audit('setup',w,null,w===1440?'setup-desktop':w===375?'setup-mobile':null);
 await page.locator('#name').fill('Prueba Diseño V4');
 await page.locator('#fdg10-nationality').selectOption('Dinamarca');
 await page.locator('button[onclick="Game.create()"]').click();
 await page.locator('.fls-academy-offer').first().waitFor();
 for(const w of [320,375,1440])await audit('academy',w,null,w===1440?'academy-desktop':null);
 await page.evaluate(()=>Game.join(0));
 assert.equal(await page.evaluate(()=>S.view),'hub');
 for(const w of widths)await audit('home',w,'hub',w===1440?'home-desktop':w===1024?'home-tablet':w===375?'home-mobile':w===320?'home-compact':null);
 for(const w of [320,375,768,1024,1440]){
   await audit('player',w,'player',w===1440?'player-desktop':w===375?'player-mobile':null);
   await audit('market',w,'agent',w===1440?'market-desktop':null);
   await audit('league',w,'league',w===1440?'league-desktop':null);
   await audit('news',w,'news',w===1440?'news-desktop':null);
   await audit('training',w,'training',w===375?'training-mobile':null);
   await audit('life',w,'life',w===375?'life-mobile':null);
   await audit('settings',w,'settings',null);
 }
 await page.evaluate(()=>Game.tab('hub'));
 await page.evaluate(()=>Game.dayNext(true));
 await page.evaluate(()=>Game.dayNext(true));
 await page.evaluate(()=>Game.tab('match'));
 for(const w of [320,375,768,1440])await audit('match-preview',w,null,w===1440?'preview-desktop':w===375?'preview-mobile':null);
 await page.evaluate(()=>Game.startMatch());
 await page.waitForFunction(()=>!!window.FDG11?.start,null,{timeout:20000});
 await page.evaluate(()=>Game.playMatch());
 await page.locator('.fdg11-scoreboard').waitFor({timeout:15000});
 for(const w of [320,375,768,1024,1440])await audit('match-v11',w,null,w===1440?'match-desktop':w===375?'match-mobile':null);
 assert.deepEqual(errors,[]);
 await writeFile(folder+'/layout-report.json',JSON.stringify({passed:results.length,results},null,2));
 console.log('ALL LAYOUT AUDITS PASSED',results.length);
}catch(error){
 console.error(error);
 await writeFile(folder+'/layout-errors.json',JSON.stringify({error:String(error),results},null,2)).catch(()=>{});
 if(page)await page.screenshot({path:folder+'/failure.png',fullPage:true}).catch(()=>{});
 process.exitCode=1;
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
