/* FLS V5: browser-level training → life → prematch journey.
   Asserts displayed progress uses the actual career state, not fake UI values. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';

const shots='tests/screenshots/v5';
await mkdir(shots,{recursive:true});
const server=spawn('python3',['-m','http.server','8879','--bind','127.0.0.1'],{stdio:['ignore','pipe','pipe']});
const logs=[];let browser,page;
const verify=(name,fn)=>fn().then(()=>{logs.push({name,passed:true});console.log('WEEK PASS',name)});
try{
 let ready=false;
 for(let i=0;i<55;i++){
   try{const r=await fetch('http://127.0.0.1:8879/');if(r.ok){ready=true;break}}catch{}
   await new Promise(r=>setTimeout(r,180));
 }
 assert.ok(ready,'local server not ready');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='warning'&&/FLS weekly UI|FLS precision UI/.test(m.text()))errors.push(m.text());});
 await page.goto('http://127.0.0.1:8879/',{waitUntil:'domcontentloaded'});
 await page.locator('#name').fill('Semana de QA');
 await page.locator('#fdg10-nationality').selectOption('España');
 await page.locator('button[onclick="Game.create()"]').click();
 await page.evaluate(()=>Game.join(0));
 await verify('V5 adapter installed',async()=>assert.equal(await page.evaluate(()=>window.FLS_WEEK?.installed),true));
 await page.evaluate(()=>Game.tab('training'));
 await verify('Training starts 0/2',async()=>{
   assert.equal((await page.locator('.fls-v5-preparation-count').innerText()).trim(),'0 / 2');
   assert.equal(await page.locator('.fls-v5-rail-stage').count(),3);
   assert.equal(await page.locator('.fls-v5-activity-icon').count(),6);
   assert.equal(await page.locator('.fls-v5-preparation-track').getAttribute('aria-valuenow'),'0');
   assert.equal((await page.locator('.v4-mobiletoggle button').nth(1).innerText()).includes('✓'),false);
 });
 await page.screenshot({path:shots+'/training-start.png',fullPage:true,animations:'disabled'});
 await page.locator('.v4-drill[onclick="Game.train(\'finish\')"]').click();
 await verify('Real training action updates status to 1/2',async()=>{
   assert.equal(await page.evaluate(()=>S.week.training),true);
   assert.equal((await page.locator('.fls-v5-preparation-count').innerText()).trim(),'1 / 2');
   assert.equal(await page.locator('.fls-v5-preparation-track').getAttribute('aria-valuenow'),'1');
 });
 const tChoice=await page.evaluate(()=>{
   const ev=S.day.events.training;
   return ev.choices.findIndex(c=>!(c[1].money<0&&S.player.balance<-c[1].money));
 });
 assert.ok(tChoice>=0);
 await page.evaluate(i=>Game.eventChoice('training',i),tChoice);
 await verify('Training resolves to 2/2 without inventing progress',async()=>{
   assert.equal((await page.locator('.fls-v5-preparation-count').innerText()).trim(),'2 / 2');
   assert.equal(await page.locator('.fls-v5-preparation-track').getAttribute('aria-valuenow'),'2');
   assert.equal(await page.locator('.fls-v5-nextbar.fls-v5-ready').count(),1);
   assert.equal(await page.locator('.v4-nextbar .btn:not(.ghost)').isEnabled(),true);
 });
 await page.screenshot({path:shots+'/training-completed.png',fullPage:true,animations:'disabled'});
 await page.evaluate(()=>Game.dayNext(false));
 await verify('New life day resets preparation and mobile event state',async()=>{
   assert.equal(await page.evaluate(()=>S.day.index),1);
   assert.equal((await page.locator('.fls-v5-preparation-count').innerText()).trim(),'0 / 2');
   assert.equal((await page.locator('.v4-mobiletoggle button').nth(1).innerText()).includes('✓'),false);
   assert.equal(await page.locator('.fls-v5-rail-stage.is-done').count(),1);
 });
 await page.screenshot({path:shots+'/life-start.png',fullPage:true,animations:'disabled'});
 await verify('Activity effects are real and include costs',async()=>{
   const cost=page.locator('.v4-drill[onclick="Game.life(\'physio\')"]');
   assert.match(await cost.innerText(),/180.*€|€.*180/);
   const dinner=page.locator('.v4-drill[onclick="Game.life(\'mates\')"]');
   assert.match(await dinner.innerText(),/Química/);
 });
 await page.locator('.v4-drill[onclick="Game.life(\'rest\')"]').click();
 await verify('Lifestyle completion is correctly tracked',async()=>{
   assert.equal(await page.evaluate(()=>S.week.life),true);
   assert.equal((await page.locator('.fls-v5-preparation-count').innerText()).trim(),'1 / 2');
 });
 const lChoice=await page.evaluate(()=>S.day.events.life.choices.findIndex(c=>!(c[1].money<0&&S.player.balance<-c[1].money)));
 assert.ok(lChoice>=0);
 await page.evaluate(i=>Game.eventChoice('life',i),lChoice);
 await verify('Life day fully completed',async()=>{
   assert.equal((await page.locator('.fls-v5-preparation-count').innerText()).trim(),'2 / 2');
   assert.equal(await page.locator('.v4-mobiletoggle button').nth(1).innerText().then(x=>x.includes('✓')),true);
 });
 await page.evaluate(()=>Game.dayNext(false));
 await verify('Prematch includes actual training / life status',async()=>{
   assert.equal(await page.evaluate(()=>S.day.index),2);
   assert.equal(await page.locator('.fls-v5-preview-fixture .fls-crest').count(),2);
   assert.equal(await page.locator('.fls-v5-match-tasks > span').count(),3);
   assert.equal(await page.locator('.fls-v5-rail-stage.is-done').count(),2);
   assert.equal(await page.locator('.fls-v5-match-preview > button.btn').count(),1);
 });
 await page.screenshot({path:shots+'/prematch-desktop.png',fullPage:true,animations:'disabled'});
 for(const width of [320,375,768,1440]){
   await page.setViewportSize({width,height:820});
   const data=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
   assert.ok(data.scrollWidth<=data.width+2,'Prematch horizontally overflows at '+width);
   if(width===375)await page.screenshot({path:shots+'/prematch-mobile.png',fullPage:true,animations:'disabled'});
 }
 await page.evaluate(()=>Game.startMatch());
 await page.waitForFunction(()=>!!window.FDG11?.start,null,{timeout:20000});
 await page.evaluate(()=>Game.playMatch());
 await page.locator('.fdg11-scoreboard').waitFor({timeout:15000});
 assert.equal(await page.locator('.fls-v5-rail').count(),0,'Week banner should not appear during live match');
 assert.deepEqual(errors,[],'Unexpected browser errors: '+errors.join('; '));
 await writeFile(shots+'/week-report.json',JSON.stringify({passed:logs.length,logs},null,2));
 console.log('ALL WEEK JOURNEY TESTS PASSED',logs.length);
}catch(error){
 console.error(error);
 await writeFile(shots+'/week-errors.json',JSON.stringify({error:String(error),logs},null,2));
 if(page)await page.screenshot({path:shots+'/failure.png',fullPage:true}).catch(()=>{});
 process.exitCode=1;
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
