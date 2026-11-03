/* FUERA DE GUIÓN 11 — MatchLab 0.5.8 is the source of ball physics,
 * results and career statistics for NEW matches. V10 replays are untouched.
 * Persist only serializable inputs + frame count. Rebuild by deterministic replay
 * after refresh; never JSON.stringify a live MatchEngine with Maps and cycles.
 */
import {MatchEngine} from '../matchlab/engine.js?v=0.5.8';
import {TEAMS} from '../matchlab/teams.js?v=0.5.8';
import {PitchRenderer} from '../matchlab/render.js?v=0.5.8';
import {assignRole,defaultRole,eligibleRoles} from '../matchlab/roles.js?v=0.5.8';
import {technicalProfile} from '../matchlab/attributes.js?v=0.5.8';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const HERO_SLOTS={POR:0,LD:1,DFC:3,LI:4,MCD:5,MC:6,MCO:7,ED:8,DC:9,EI:10};
const LABELS={goal:'⚽',save:'🧤',shot:'🎯',corner:'🚩',offside:'🚩',foul:'🟨',yellow:'🟨',red:'🟥',substitution:'🔄',
 advantage:'▶',advantageBack:'⚑',half:'⏱',tackle:'🛡',interception:'🛡',combinationComplete:'✨',duel:'⚔',miss:'↗'};
const capSkill=v=>clamp(Math.round(Number(v)||65),40,96);
let api=null,engine=null,renderer=null,canvas=null,raf=0,last=0,accumulator=0,updating=false,session=null;
let fromFrame=null;

function current(){
 const S=api.state();return S?.match?.live?.engine===11?S.match:null;
}
function shapeCareerRoster(m){
 const S=api.state(),raw=api.roster();
 // f10Lineups() is ordered [user, opponent], irrespective of home/away.
 const rosters=raw.map(arr=>arr.slice(0,11).map(p=>({...p})));
 if(m.enter===0){
  const oldIndex=api.heroOldIndex(),targetIndex=HERO_SLOTS[S.player.pos]??7;
  if(oldIndex!==targetIndex){
   const a=rosters[0][oldIndex];rosters[0][oldIndex]=rosters[0][targetIndex];rosters[0][targetIndex]=a;
  }
  rosters[0][targetIndex].name=S.player.name;rosters[0][targetIndex].number=api.number();
 }
 return m.home?[rosters[0],rosters[1]]:[rosters[1],rosters[0]];
}
function buildEngine(l){
 const S=api.state(),m=S.match,ownSide=m.home?0:1,opponent=api.club(m.opp);
 const prototypeHome=TEAMS.find(t=>t.id==='barca'),prototypeAway=TEAMS.find(t=>t.id==='getafe');
 const lineups=shapeCareerRoster(m),names=m.home?[S.club.name,m.opp]:[m.opp,S.club.name];
 const power=m.home?[S.club.power,opponent.power]:[opponent.power,S.club.power];
 const source=[prototypeHome,prototypeAway];
 const clubs=source.map((base,side)=>({
  ...base,name:names[side],rating:power[side],style:side===ownSide?
   (m.tactics==='attack'?'vertical':m.tactics==='calm'?'bloque':'posesion'):
   (power[side]>82?'vertical':'equilibrada'),
  players:lineups[side].map(p=>({name:p.name,number:p.number}))
 }));
 const mode=m.tactics==='attack'?'ofensiva':m.tactics==='calm'?'defensiva':'equilibrada';
 const tactics=ownSide===0?[mode,'equilibrada']:['equilibrada',mode];
 const g=new MatchEngine(clubs[0],clubs[1],l.seed,{tactics});
 // MatchLab's sample OVRs are not the real career squad strength.
 // Clamp these fictional roster values to their respective career club power.
 for(let side=0;side<2;side++)for(const p of [...g.teams[side],...g.benches[side]]){
  const base=source[side].rating;
  const adjustment=(power[side]-base)*.78;
  p.rating=capSkill(p.rating+adjustment);
  for(const k of Object.keys(p.skills))p.skills[k]=capSkill(p.skills[k]+adjustment);
  p.technical=technicalProfile(p);
 }
 const role=api.role()?.get(S.player);
 // A snapshot affects only NEW games; old saves replay with no archetype boost.
 const buildArchetype=l.archetype?api.role()?.archetype?.(S.player.pos,l.archetype):null;
 const boost=buildArchetype?.boost||{};
 const heroSlot=HERO_SLOTS[S.player.pos]??7;
 const heroAttributes=p=>{
  const attrs=S.player.attrs||{};
  p.name=S.player.name;p.number=api.number();p.isHero=true;
  const rawRating=(attrs.ritmo+attrs.pase+attrs.tiro+attrs.defensa+attrs.regate+attrs.fisico)/6;
  // Goalkeepers use actual goalkeeping training in new matches rather than
  // an outfield average. Archetypes never confer Role+ automatically.
  p.rating=capSkill((l.archetype&&S.player.pos==='POR'&&Number.isFinite(Number(attrs.porteria)))?
    Number(attrs.porteria)+(boost.keeper||0):rawRating+(boost.keeper||0));
  p.skills={pace:capSkill(attrs.ritmo+(boost.pace||0)),pass:capSkill(attrs.pase+(boost.pass||0)),
   shot:capSkill(attrs.tiro+(boost.shot||0)),tackle:capSkill(attrs.defensa+(boost.tackle||0))};
  p.technical=technicalProfile(p,{finishing:capSkill(attrs.tiro+(boost.finishing||0)),
   shotPower:capSkill(attrs.tiro+(boost.shot||0)),
   curve:capSkill((Number(attrs.regate)||65)*.60+(Number(attrs.tiro)||65)*.40+(boost.curve||0)),
   technique:capSkill(attrs.regate+(boost.technique||0)),
   composure:capSkill((Number(attrs.pase)||65)*.35+(Number(attrs.regate)||65)*.65+(boost.composure||0)),
   preferredFoot:S.player.foot==='Zurdo'?'left':S.player.foot==='Ambidiestro'?'both':'right'});
  p.roleFamiliarity={...(role?.mastery||{})};
  p.energy=clamp((Number(S.player.fitness)||75)/100,.52,1);
  const preferred=l.equippedRole;
  if(preferred&&eligibleRoles(p.role).includes(preferred))assignRole(p,preferred);
  else assignRole(p,defaultRole(p,g.clubs[ownSide]));
  return p;
 };
 let heroReserve=null;
 if(l.plannedEntry===0){
  const hero=g.teams[ownSide][heroSlot];heroAttributes(hero);
  hero.subOn=true; // Prevent the manager from substituting the protagonist automatically.
 }else if(l.plannedEntry>0){
  const reference=g.teams[ownSide][heroSlot];
  heroReserve=heroAttributes({...reference,id:ownSide+'-career-hero',i:11+g.benches[ownSide].length,subOn:false,red:false});
  g.benches[ownSide].push(heroReserve);
 }
 const originalSubs=g.makeSubsAtStoppage.bind(g);
 g.makeSubsAtStoppage=function(){
  const minute=g.time/60;
  const already=g.teams[ownSide].some(p=>p.isHero);
  if(heroReserve&&!already&&minute>=l.plannedEntry&&g.subsUsed[ownSide]<5&&g.subWindowsUsed[ownSide]<3){
   // A teammate who replaced this position earlier can legally be substituted again.
   const idx=g.teams[ownSide].findIndex(p=>p.i===heroSlot&&!p.red);
   const benchIdx=g.benches[ownSide].findIndex(p=>p.id===heroReserve.id);
   if(idx>=1&&benchIdx>=0){
    const old=g.teams[ownSide][idx],incoming=g.benches[ownSide].splice(benchIdx,1)[0];
    Object.assign(incoming,{i:old.i,role:old.role,anchor:{...old.anchor},x:old.x,y:old.y,fx:old.fx,fy:old.fy,subOn:true});
    heroAttributes(incoming);
    g.teams[ownSide][idx]=incoming;
    g.subsUsed[ownSide]++;g.subWindowsUsed[ownSide]++;g.stats[ownSide].substitutions++;
    g.lastSubMinute[ownSide]=minute;
    g.add('substitution',ownSide,`${incoming.name} entra por ${old.name}.`,incoming,{in:incoming.name,out:old.name,hero:true});
    l.heroEntryActual=Math.ceil(minute);
   }
  }
  // Protect the future hero's starting slot plus ONE substitute and ONE window.
  // Otherwise the AI coach may fill the position or exhaust all five changes
  // before the scheduled real stoppage. Restore every temporary guard after
  // the ordinary coach has made its independent decision.
  const awaitingHero=heroReserve&&!g.teams[ownSide].some(p=>p.isHero)&&minute<l.plannedEntry;
  const target=awaitingHero?g.teams[ownSide].find(p=>p.i===heroSlot&&!p.red):null;
  const wasSubOn=target?.subOn;
  const savedWindows=g.subWindowsUsed[ownSide],savedSubs=g.subsUsed[ownSide];
  const holdWindow=awaitingHero&&savedWindows>=2;
  const holdSub=awaitingHero&&savedSubs>=4;
  if(target)target.subOn=true; // Excluded from the regular coach's outgoing candidates.
  if(holdWindow)g.subWindowsUsed[ownSide]=3;
  if(holdSub)g.subsUsed[ownSide]=5;
  try{originalSubs();}
  finally{
   if(holdWindow)g.subWindowsUsed[ownSide]=savedWindows;
   if(holdSub)g.subsUsed[ownSide]=savedSubs;
   if(target&&g.teams[ownSide].includes(target))target.subOn=wasSubOn;
  }
 };
 g.start();
 return g;
}
function updateCareer(){
 const S=api.state(),m=current();if(!m||!engine)return;
 const l=m.live,our=m.home?0:1,other=1-our;
 l.clock=engine.time/60;l.half=engine.status==='halftime';l.done=engine.status==='finished';
 m.minute=Math.min(90,Math.floor(l.clock));
 m.scoreUs=engine.stats[our].goals;m.scoreThem=engine.stats[other].goals;
 const hero=engine.teams[our].find(p=>p.isHero);
 const active=Boolean(hero)&&!hero.red&&m.enter>=0;
 if(l.plannedEntry>0&&Number.isInteger(l.heroEntryActual))m.enter=l.heroEntryActual;
 if(hero?.red&&!m.sentOff){m.sentOff=true;m.exitMinute=Math.ceil(l.clock);}
 const events=engine.events;
 if(events.length){
  const fresh=events.filter(e=>e.id>l.lastEventId);
  if(fresh.length){
   for(const e of fresh){
    if(e.type==='goal'||e.type==='save'||e.type==='shot'||e.type==='corner'||e.type==='yellow'||
       e.type==='red'||e.type==='substitution'||e.type==='half'||e.type==='advantage'||
       e.type==='advantageBack'||e.type==='duel'||e.type==='tackle'){
     l.feed.unshift({id:e.id,minute:e.minute,text:(LABELS[e.type]||'⚽')+' '+e.description,type:e.type});
    }
    l.lastEventId=e.id;
   }
   l.feed=l.feed.slice(0,45);
  }
 }
 const now=m.stats;
 now.goals=engine.goals.filter(g=>g.side===our&&g.scorer===S.player.name).length;
 now.assists=engine.goals.filter(g=>g.side===our&&g.assist===S.player.name).length;
 now.saves=events.filter(e=>e.type==='save'&&e.player===S.player.name&&e.side===our).length;
 now.tackles=events.filter(e=>['tackle','interception','duel'].includes(e.type)&&e.player===S.player.name&&e.side===our).length;
 now.passes=events.filter(e=>e.type==='pass'&&e.player===S.player.name&&e.side===our).length;
 now.shots=events.filter(e=>e.type==='shot'&&e.player===S.player.name&&e.side===our).length;
 now.yellow=events.filter(e=>e.type==='yellow'&&e.player===S.player.name&&e.side===our).length;
 const minutes=active||l.heroEntryActual>=0?Math.max(0,Math.floor(l.clock)-(m.enter||0)):0;
 m.rating=minutes>0?clamp(6.15+now.goals*1.2+now.assists*.76+now.saves*.12+
   now.tackles*.075+now.passes*.017+now.shots*.035,3,10):6.3;
}
function buildState(){
 const m=current();if(!m)return null;
 if(engine&&session===m)return engine;
 engine=buildEngine(m.live);session=m;renderer?.observer?.disconnect();renderer=null;canvas=null;fromFrame=null;
 const l=m.live,ticks=Math.max(0,Math.min(12000,Math.trunc(l.ticks)||0));
 // Replay the exact number of deterministic updates, with half-time preserved.
 for(let i=0;i<ticks;i++){
  if(engine.status==='halftime')engine.resumeHalf();
  if(engine.status==='finished')break;
  engine.update(.08);
 }
 if(engine.status==='halftime'&&!l.half&&l.resumedSecondHalf)engine.resumeHalf();
 updateCareer();return engine;
}
function paint(){
 if(!current()||!engine)return;
 const node=document.getElementById('fdg11-pitch');if(!node)return;
 if(canvas!==node){renderer?.observer?.disconnect();canvas=node;renderer=new PitchRenderer(node);}
 renderer.render(engine,fromFrame?{...fromFrame,alpha:clamp(accumulator/.08,0,1)}:null);
}
function matchStatsHTML(m){
 const our=m.home?0:1,their=1-our,a=engine.stats[our],b=engine.stats[their];
 const rows=[
  ['Remates',a.shots,b.shots],['A puerta',a.onTarget,b.onTarget],
  ['Goles esperados',a.xg.toFixed(2),b.xg.toFixed(2)],
  ['Pases acertados',a.completed+' / '+a.passes,b.completed+' / '+b.passes],
  ['Conducciones',a.carries,b.carries],['Córneres',a.corners,b.corners],
  ['Faltas',a.fouls,b.fouls],['Fueras de juego',a.offsides,b.offsides]
 ];
 return '<div class="fdg11-break-stats"><div class="fdg11-stats-title"><b>'+
  escapeHTML(m.home?api.state().club.name:m.opp)+'</b><span>ESTADÍSTICAS</span><b>'+
  escapeHTML(m.home?m.opp:api.state().club.name)+'</b></div>'+
  rows.map(([label,x,y])=>'<div class="fdg11-stats-row"><strong>'+x+'</strong><span>'+label+'</span><strong>'+y+'</strong></div>').join('')+'</div>';
}
function updateOverlay(m){
 const l=m.live,node=document.getElementById('fdg11-overlay');if(!node)return;
 const mode=l.done?'final':l.half?'half':'live';
 node.hidden=mode==='live';
 // Rebuilding a clicked element every animation frame prevents click from firing.
 // Keep button nodes stable throughout the break.
 if(node.dataset.mode===mode)return;
 node.dataset.mode=mode;
 if(mode==='live'){node.replaceChildren();return}
 node.innerHTML='<div class="fdg11-modal"><p class="fdg11-modal-kicker">'+
  (mode==='final'?'SILBATO FINAL':'DESCANSO')+'</p><h2>'+
  escapeHTML(m.home?api.state().club.name:m.opp)+' <em>'+
  (m.home?m.scoreUs:m.scoreThem)+' : '+(m.home?m.scoreThem:m.scoreUs)+'</em> '+
  escapeHTML(m.home?m.opp:api.state().club.name)+'</h2>'+
  matchStatsHTML(m)+
  '<button type="button" class="btn fdg11-overlay-action" data-match-action="'+(mode==='final'?'close':'continue')+'">'+
  (mode==='final'?'Ver resultado y volver a mi carrera':'▶ Reanudar la segunda parte')+'</button></div>';
}
function refreshUI(){
 const m=current();if(!m||!engine)return;
 const l=m.live,put=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
 put('fdg11-clock',Math.floor(Math.min(90,l.clock))+"'");
 put('fdg11-score',String(m.home?m.scoreUs:m.scoreThem)+' : '+String(m.home?m.scoreThem:m.scoreUs));
 put('fdg11-stage',l.done?'FINAL':l.half?'DESCANSO':l.clock<45?'PRIMERA PARTE':'SEGUNDA PARTE');
 put('fdg11-pause',l.paused?'▶ Reanudar':'Ⅱ Pausar');
 const progress=document.getElementById('fdg11-progress');
 if(progress)progress.style.width=clamp(l.clock/90*100,0,100)+'%';
 const heroOnField=engine.teams[m.home?0:1].some(p=>p.isHero&&!p.red);
 const ring=document.getElementById('fdg11-rating-ring');
 if(ring)ring.style.setProperty('--rating-progress',heroOnField?((clamp(m.rating,3,10)-3)/7*100).toFixed(1)+'%':'0%');
 put('fdg11-rating-value',heroOnField?m.rating.toFixed(1):'—');
 put('fdg11-hero-status',heroOnField?'EN EL CAMPO':m.enter<0?'NO CONVOCADO':'BANQUILLO');
 put('fdg11-hero',m.stats.goals+' goles · '+m.stats.assists+' asist. · '+
  m.stats.passes+' pases · '+m.stats.tackles+' recuperaciones · '+m.stats.shots+' remates');
 const feed=document.getElementById('fdg11-bench-feed');
 if(feed){
  feed.hidden=heroOnField;
  if(!heroOnField){
   const tag=document.getElementById('fdg11-events');
   if(tag)tag.innerHTML=l.feed.slice(0,10).map(e=>'<div class="fdg11-event"><b>'+
    escapeHTML(e.minute)+"'</b><span>"+escapeHTML(e.text)+'</span></div>').join('');
  }
 }
 updateOverlay(m);
 const controls=document.getElementById('fdg11-controls');
 if(controls)controls.hidden=l.done||l.half;
}

const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stop(){if(raf){cancelAnimationFrame(raf);raf=0;}last=0;}
function frame(now){
 raf=0;const m=current();if(!m||!engine||m!==session||api.state().view!=='match'){stop();return}
 let l=m.live,elapsed=clamp((now-(last||now))/1000,0,.15);last=now;
 if(!l.paused&&!l.half&&!l.done){
  accumulator+=elapsed*(l.mode==='highlights'?6:l.speed);
  let count=0;while(accumulator>=.08&&count<35){
   accumulator-=.08;count++;l.ticks++;
   fromFrame={players:new Map(engine.teams.flat().map(p=>[p.id,{x:p.x,y:p.y}])),
    ball:{x:engine.ball.x,y:engine.ball.y}};
   try{engine.update(.08)}catch(err){
    console.error('MatchLab career step failed',err);l.error=String(err.message||err);l.paused=true;api.save();break;
   }
   if(engine.status!=='live')break;
  }
  // Keep DOM and hero event scans off the presentation-only frames.
  if(count>0)updateCareer();
  if(l.half||l.done||Math.floor(l.clock/4)>l.lastSaved){
   l.lastSaved=Math.floor(l.clock/4);api.save();
  }
 }
 paint();
 if(l.half||l.done||l.paused||now-(l.lastRendered||0)>180){refreshUI();l.lastRendered=now;}
 if(l.error){putError(l.error);stop();return;}
 // Do not burn animation frames at halftime, the final whistle or while paused.
 if(l.half||l.done||l.paused){stop();return;}
 raf=requestAnimationFrame(frame);
}
function putError(message){
 const node=document.getElementById('fdg11-errors');
 if(node){node.hidden=false;node.textContent='El motor se ha detenido sin alterar tu partida. '+message;}
}
function resume(){
 if(!current()||api.state().view!=='match')return;
 buildState();
 if(!raf&&!current().live.half&&!current().live.done&&!current().live.paused){last=performance.now();raf=requestAnimationFrame(frame);}
}
function start(){
 const S=api.state(),m=S?.match;if(!m||m.started)return;
 api.oldStop();api.roster();
 const role=api.role()?.get(S.player);
 const l={engine:11,seed:Math.floor(Math.random()*4294967295)>>>0,ticks:0,clock:0,
  speed:1,mode:'full',paused:false,half:false,done:false,plannedEntry:m.enter,
  equippedRole:role?.selected||null,archetype:role?.archetype||null,feed:[],lastEventId:0,lastSaved:0,resumedSecondHalf:false};
 m.started=true;m.minute=0;m.live=l;session=null;engine=null;accumulator=0;
 buildState();api.save();api.render();resume();
}
function pause(){
 const m=current();if(!m||m.live.half||m.live.done)return;
 m.live.paused=!m.live.paused;api.save();refreshUI();if(!m.live.paused)resume();
}
function speed(n){
 const m=current();if(!m)return;
 m.live.speed=[1,2,4].includes(Number(n))?Number(n):1;
 m.live.mode='full';api.save();refreshUI();
}
function skip(){
 const m=current();if(!m||m.live.done)return;
 if(m.live.half){continueHalf();return;}
 m.live.mode=m.live.mode==='highlights'?'full':'highlights';api.save();refreshUI();
}
function continueHalf(){
 const m=current();if(!m||!m.live.half||m.live.done)return;
 engine.resumeHalf();m.live.half=false;m.live.paused=false;m.live.resumedSecondHalf=true;
 api.save();refreshUI();resume();
}
function close(){
 const m=current();if(!m||!m.live.done||m.finished)return;
 updateCareer();stop();
 const S=api.state(),l=m.live;
 if(!l.xpGranted&&m.enter>=0){
  const actual=l.heroEntryActual??l.plannedEntry;
  const mins=actual>=0?Math.max(0,90-actual):0;
  api.role()?.grant(mins,m.rating);
  l.xpGranted=true;
 }
 api.save();
 renderer?.observer?.disconnect();renderer=null;canvas=null;fromFrame=null;
 engine=null;session=null;api.finish();
}
function screen(){
 const S=api.state(),m=current();if(!m)return '';
 const l=m.live,home=m.home?S.club.name:m.opp,away=m.home?m.opp:S.club.name;
 return `<div class="fdg-live-page fdg6-page fdg11-page">
  <section class="v4-panel fdg-live-stadium fdg11-stadium">
   <div class="fdg11-scoreboard"><strong>${escapeHTML(home)}</strong><b id="fdg11-score">0 : 0</b><strong>${escapeHTML(away)}</strong></div>
   <div class="fdg-timebar"><b id="fdg11-clock">0'</b><div class="fdg-progress"><span id="fdg11-progress"></span></div><small id="fdg11-stage">PRIMERA PARTE</small></div>
   <div class="fdg11-pitch-layout">
    <div class="fdg-canvas-wrap fdg11-canvas" id="fdg11-pitch-stage">
     <canvas id="fdg11-pitch" width="900" height="583" aria-label="Partido táctico 2D" role="img"></canvas>
     <div class="fdg11-performance" role="group" aria-label="Valoración y estadísticas de tu futbolista">
      <div class="fdg11-rating-ring" id="fdg11-rating-ring" style="--rating-progress:0%"><span id="fdg11-rating-value">—</span></div>
      <div class="fdg11-performance-text"><small id="fdg11-hero-status">EN EL CAMPO</small>
       <b>${escapeHTML(S.player.name)}</b><span id="fdg11-hero">0 goles · 0 asistencias</span></div>
     </div>
     <div class="fdg11-overlay" id="fdg11-overlay" hidden></div>
    </div>
   </div>
   <div class="fdg-controlbar fdg11-controls" id="fdg11-controls">
    <button type="button" class="tinybtn" id="fdg11-pause" onclick="Game.livePause()">Ⅱ Pausar</button>
    <button type="button" class="tinybtn" onclick="Game.liveSpeed(1)">1×</button>
    <button type="button" class="tinybtn" onclick="Game.liveSpeed(2)">2×</button>
    <button type="button" class="tinybtn" onclick="Game.liveSpeed(4)">4×</button>
    <button type="button" class="tinybtn" onclick="Game.liveSkip()">Momentos importantes</button>
   </div>
   <p class="fdg11-error" id="fdg11-errors" hidden></p>
  </section>
  <section class="v4-panel fdg11-bench-feed" id="fdg11-bench-feed" hidden>
   <h3>Retransmisión desde el banquillo</h3>
   <p>Mientras esperas tu oportunidad, sigue las jugadas destacadas de tus compañeros.</p>
   <div class="fdg11-events" id="fdg11-events"></div>
  </section>
 </div>`;
}
function bindControls(){
 const overlay=document.getElementById('fdg11-overlay');
 if(!overlay||overlay.dataset.bound==='yes')return;
 overlay.dataset.bound='yes';
 overlay.addEventListener('click',event=>{
  const button=event.target.closest('[data-match-action]');
  if(!button)return;
  if(button.dataset.matchAction==='continue')continueHalf();
  if(button.dataset.matchAction==='close')close();
 });
}

export function installFDG11(career){
 api=career;
 return {start,restore:resume,screen,afterRender:()=>{if(current()){bindControls();paint();refreshUI();resume();}},
  pause,speed,skip,continueHalf,close,resume};
}
