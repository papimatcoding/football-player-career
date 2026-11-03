import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn('python3',['-m','http.server','8191','--bind','127.0.0.1'],{stdio:'ignore'});
let browser=null;
const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
try{
 await delay(600);
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8191/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>Boolean(window.FDG11?.start),{timeout:20000});
 await page.locator('#name').fill('Jugador QA');
 await page.locator('#position').selectOption('DC');
 await page.evaluate(()=>{window.Game.create();window.Game.join(0);});
 let initial=await page.evaluate(()=>({view:S.view,club:S.club.name,player:S.player.name}));
 assert.equal(initial.view,'hub');assert.equal(initial.player,'Jugador QA');
 await page.evaluate(()=>{
  startMatch();
  S.match.enter=0;
  persist();render();
 });
 await page.evaluate(()=>window.Game.playMatch());
 await page.waitForSelector('#fdg11-pitch',{timeout:8000});
 const started=await page.evaluate(()=>({engine:S.match.live.engine,started:S.match.started,clock:S.match.live.clock}));
 assert.equal(started.engine,11);assert.equal(started.started,true);
 await page.evaluate(()=>{S.match.live.speed=45});
 await page.waitForFunction(()=>S.match.live.half,{timeout:25000});
 const atHalf=await page.evaluate(()=>({clock:S.match.live.clock,status:document.querySelector('#fdg11-stage')?.textContent}));
 assert.ok(atHalf.clock>=45);
 assert.equal(atHalf.status,'DESCANSO','the browser must show halftime as soon as the first half ends');
 await page.evaluate(()=>window.Game.halfContinue());
 await page.waitForFunction(()=>S.match.live.done,{timeout:25000});
 const final=await page.evaluate(()=>({
  goals:[S.match.scoreUs,S.match.scoreThem],
  clock:S.match.live.clock,
  ticks:S.match.live.ticks,
  heroStats:{...S.match.stats},
  fullRender:document.querySelector('#fdg11-pitch')?.width,
  serializable:JSON.stringify(S).length>0
 }));
 assert.ok(final.clock>=90);
 assert.ok(final.ticks>2800);
 assert.ok(final.fullRender>1);
 assert.ok(final.serializable);
 assert.ok(final.heroStats.goals<=final.goals[0]);
 await page.evaluate(()=>window.Game.liveClose());
 const end=await page.evaluate(()=>({view:S.view,results:S.results?.length,roleLevel:S.player.roleTraining?.level}));
 assert.equal(end.view,'post');assert.ok(end.results>=1);
 assert.ok(end.roleLevel>=1);
 assert.deepEqual(errors,[],'Uncaught browser exceptions: '+errors.join('; '));
 console.log('BROWSER PASS',JSON.stringify({initial,started,atHalf,final,end}));
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
