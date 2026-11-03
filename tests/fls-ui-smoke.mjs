
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const screenshots='tests/screenshots';
await mkdir(screenshots,{recursive:true});
const server=spawn('python3',['-m','http.server','8877','--bind','127.0.0.1'],{stdio:['ignore','pipe','pipe']});
let browser;
let page;
const errors=[];
const check = async (name,fn)=>{await fn();console.log('PASS',name);};

try{
 let reachable=false;
 for(let i=0;i<50;i++){
   try{const response=await fetch('http://127.0.0.1:8877/');if(response.ok){reachable=true;break;}}catch{}
   await new Promise(resolve=>setTimeout(resolve,200));
 }
 assert.ok(reachable,'Local test server did not start');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 page=await context.newPage();
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto('http://127.0.0.1:8877/',{waitUntil:'domcontentloaded'});
 await check('New game brand',async()=>{
   await page.locator('.v4-entry .setuphero h1').waitFor();
   assert.match(await page.title(),/Football Life Simulator/);
   assert.match(await page.locator('.v4-entry .setuphero h1').innerText(),/FOOTBALL LIFE SIMULATOR/);
   assert.equal(await page.locator('#fdg10-nationality').count(),1,'Nationality field missing');
 });
 await page.locator('#name').fill('Test FLS');
 await page.locator('#fdg10-nationality').selectOption('Dinamarca');
 await page.locator('button[onclick="Game.create()"]').click();
 await check('Academy selection and actual state',async()=>{
   assert.equal(await page.evaluate(()=>S.view),'draft');
   assert.equal(await page.evaluate(()=>S.player.nationality),'Dinamarca');
   await page.evaluate(()=>Game.join(0));
   assert.equal(await page.evaluate(()=>S.view),'hub');
   assert.equal(await page.evaluate(()=>S.player.name),'Test FLS');
 });
 await check('Home with real fixture and SVG fallback',async()=>{
   await page.locator('.v4-feature .fls-fixture').waitFor();
   assert.equal(await page.locator('.v4-feature .fls-fixture .fls-crest').count(),2);
   assert.equal(await page.locator('.v4-clubline .fls-crest').count(),1);
   assert.equal(await page.locator('.fls-news-card').count(),1);
   assert.equal(await page.locator('.v4-navbtn .fls-navsvg').count(),10);
 });
 await page.screenshot({path:screenshots+'/desktop.png',fullPage:true});
 await check('Player nationality differs from club country',async()=>{
   await page.evaluate(()=>Game.tab('player'));
   await page.locator('.fls-nationality').waitFor();
   assert.match(await page.locator('.fls-nationality').innerText(),/Dinamarca/);
   await page.evaluate(()=>Game.tab('hub'));
 });
 await check('Career phases still use existing game actions',async()=>{
   await page.locator('.v4-feature .btn').click();
   assert.equal(await page.evaluate(()=>activeTab),'training');
   await page.evaluate(()=>Game.dayNext(true));
   assert.equal(await page.evaluate(()=>S.day.index),1);
   await page.evaluate(()=>Game.dayNext(true));
   assert.equal(await page.evaluate(()=>S.day.index),2);
   await page.evaluate(()=>Game.tab('hub'));
   await page.locator('.v4-feature .btn').click();
   assert.equal(await page.evaluate(()=>S.view),'match');
 });
 await check('Persistence and reload',async()=>{
   const storage=await page.evaluate(()=>JSON.parse(localStorage.getItem('fuera_de_guion_carrera_v4')));
   assert.equal(storage.player.name,'Test FLS');
   await page.reload({waitUntil:'domcontentloaded'});
   assert.equal(await page.evaluate(()=>S.player.name),'Test FLS');
 });
 await check('Mobile has working navigation and no horizontal overflow',async()=>{
   await page.setViewportSize({width:375,height:812});
   await page.evaluate(()=>Game.back());
   await page.locator('.v4-bottomnav').waitFor();
   assert.equal(await page.locator('.v4-bottomnav .fls-navsvg').count(),6);
   const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(overflow.scroll<=overflow.viewport+2,'Horizontal overflow: '+JSON.stringify(overflow));
   await page.screenshot({path:screenshots+'/mobile.png',fullPage:true});
 });
 assert.deepEqual(errors,[],'Unexpected browser JavaScript errors: '+errors.join('; '));
 console.log('ALL BROWSER SMOKE TESTS PASSED');
} catch(error){
 if(page)await page.screenshot({path:screenshots+'/failure.png',fullPage:true}).catch(()=>{});
 console.error(error);
 process.exitCode=1;
} finally {
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
