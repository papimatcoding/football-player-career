/* FUERA DE GUIÓN 7 — coherent 2D match presenter.
   Gameplay uses the existing, event-sourced V6 result engine. V7 changes the
   geometry and time presentation, not the serialized career/save schema.
   V5 and V6 matches already in progress retain their own presentation. */
'use strict';
const FDG7={freezeUntil:0,lastGoal:-1};
const fdg7LegacyStart=window.Game.playMatch;
const fdg7LegacyPaint=fdg6Paint;
const fdg7LegacyLayout=fdg6LayoutAction;
const fdg7LegacyApply=fdg6Apply;
const fdg7LegacyAdvance=fdg6Advance;
const fdg7LegacySync=fdg6Sync;
const fdg7LegacyView=fdg6LiveView;
const fdg7LegacyContinue=window.Game.halfContinue;
const fdg7LegacySkip=window.Game.liveSkip;
const fdg7LegacyMode=window.Game.liveMode;
const fdg7IsNew=()=>S?.match?.live?.engine===6&&S.match.live.presentation===7;
const fdg7Clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fdg7Mix=(a,b,t)=>a+(b-a)*t;
const fdg7Smooth=t=>{t=fdg7Clamp(t,0,1);return t*t*(3-2*t);};
const fdg7Distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const fdg7TeamDir=side=>side===0?1:-1;
// Input coordinates remain fixed in team-relative space. The camera mirrors
// the entire pitch after half-time; the goalkeeper then visibly changes ends.
const fdg7ScreenX=(x,l)=>l.clock>=45.02?100-x:x;
function fdg7Actor(e){
 if(e.hero&&fdg6HeroLive(e.t))return fdgHeroIndex();
 const indices=[1,2,3,4,5,6,7,8,9,10];
 const target={x:e.x,y:e.y};
 return indices.sort((a,b)=>fdg7Distance({x:fdg6HomeX(e.side,FDG6_FORM[a][0]),y:FDG6_FORM[a][1]},target)-fdg7Distance({x:fdg6HomeX(e.side,FDG6_FORM[b][0]),y:FDG6_FORM[b][1]},target))[0];
}
function fdg7PlanDrive(){
 const l=S.match.live,next=l.events[l.idx];if(!next){l.v7Drive=null;return;}
 const prev={x:l.ball.x,y:l.ball.y};const dest={x:next.x,y:next.y};
 let start=Math.max(l.clock,0),end=next.t;
 const side=next.side,dir=fdg7TeamDir(side),len=Math.max(.15,end-start);
 // Intermediate passes progress in a realistic direction and remain in bounds.
 const middleX=fdg7Clamp(prev.x+(dest.x-prev.x)*.48,7,93);
 const middleY=fdg7Clamp(prev.y+(dest.y-prev.y)*.38,9,91);
 const link={x:middleX,y:middleY};
 const approach={x:fdg7Clamp(dest.x-dir*9,7,93),y:fdg7Mix(middleY,dest.y,.7)};
 l.v7Drive={start,end,side,points:[prev,link,approach,dest],actors:[5,7,fdg7Actor(next)],kind:next.kind};
 // Show offensive/defensive phase even while no exceptional event occurs.
 l.v7Possession=side;
}
function fdg7BallAt(l){
 const k=l.v7Kick;
 if(k&&l.clock>=k.start&&l.clock<=k.end){
  const u=fdg7Smooth((l.clock-k.start)/Math.max(.01,k.end-k.start));
  return {x:fdg7Mix(k.from.x,k.to.x,u),y:fdg7Mix(k.from.y,k.to.y,u),side:k.side,flight:true};
 }
 const d=l.v7Drive;
 if(d){
  const u=fdg7Clamp((l.clock-d.start)/Math.max(.02,d.end-d.start),0,1);
  const phase=fdg7Clamp(Math.floor(u*3),0,2),v=fdg7Smooth(u*3-phase);
  const a=d.points[phase],b=d.points[phase+1];
  return {x:fdg7Mix(a.x,b.x,v),y:fdg7Mix(a.y,b.y,v),side:d.side,flight:(v>.12&&v<.88)};
 }
 return {x:l.ball.x,y:l.ball.y,side:l.v7Possession??0,flight:false};
}
function fdg7Start(){
 fdg7LegacyStart();let m=S?.match,l=m?.live;
 if(!l||l.engine!==6)return;
 l.presentation=7;
 l.v7Possession=0;l.v7Kick=null;l.v7Drive=null;l.v7SubAcknowledged=m.enter===0||m.enter<0;
 l.v7SubPause=false;l.v7Following=m.enter>0?'bench':'full';l.v7HeroNumber=m.enter>0?17:FDG6_NUM[fdgHeroIndex()];
 l.v7SubShown=false;l.v7LastPossession=0;l.v7Banner=null;
 fdg7PlanDrive();persist();render();fdg6Resume();
}
window.Game.playMatch=fdg7Start;
// Rebind layout creation: preparation of an event leads to an observable
// ball flight, instead of an arbitrary jump between unrelated coordinates.
fdg6LayoutAction=function(e){
 if(!fdg7IsNew())return fdg7LegacyLayout(e);
 const l=S.match.live;const side=e.side,dir=fdg7TeamDir(side);
 l.v7Possession=side;
 const shooting=['shot','penalty','direct','corner','cross'].includes(e.kind)&&e.result!=='cross';
 let target={x:e.x,y:e.y};
 if(shooting){
  const shotEnd=fdg6GoalX(side);
  if(e.result==='goal')target={x:shotEnd,y:50+fdg6Rand(-5,5)};
  else if(e.result==='saved')target={x:fdg7Clamp(shotEnd-dir*4,4,96),y:fdg7Clamp(50+fdg6Rand(-16,16),33,67)};
  else if(e.result==='blocked')target={x:fdg7Clamp(e.x+dir*7,4,96),y:fdg7Clamp(50+fdg6Rand(-19,19),23,77)};
  else target={x:shotEnd,y:fdg6Rand(21,31)*(Math.random()<.5?1:2.8)};
 }else if(e.kind==='corner'||e.kind==='cross'||e.kind==='direct'){
  // Crosses and set pieces must travel into the area, not along the touchline.
  target={x:fdg6HomeX(side,86),y:fdg7Clamp(50+fdg6Rand(-16,16),28,72)};
 }else if(e.kind==='pass'){target={x:fdg7Clamp(e.x+dir*8,5,95),y:fdg7Clamp(e.y+fdg6Rand(-13,13),5,95)};}
 else if(e.kind==='tackle'){target={x:e.x,y:e.y};}
 else if(e.kind==='offside'||e.kind==='foul'||e.kind==='indirect'||e.kind==='restart'){target={x:e.x,y:e.y};}
 else target={x:fdg7Clamp(e.x+dir*6,5,95),y:fdg7Clamp(e.y+fdg6Rand(-14,14),5,95)};
 l.v7Drive=null;
 l.v7Kick={from:{x:e.x,y:e.y},to:target,start:e.t,end:e.t+(shooting?.40:.27),side};
 // Keep the original event stream and the same application pathway.
 l.action={event:e,applied:false,revealAt:l.v7Kick.end};
 l.v7Possession=side;
};
fdg6Apply=function(e){
 if(!fdg7IsNew())return fdg7LegacyApply(e);
 const m=S.match,l=m.live,before=[m.scoreUs,m.scoreThem];
 fdg7LegacyApply(e);
 if(e.result==='goal'&&(m.scoreUs!==before[0]||m.scoreThem!==before[1])){
  FDG7.freezeUntil=performance.now()+1100;
  l.v7Banner={type:'goal',label:`¡GOL! · ${e.side===0?S.club.name:m.opp}`,until:performance.now()+2700};
  l.v7LastScorer=e.side;
 }
};
function fdg7Arrival(e){
 const l=S.match.live,k=l.v7Kick;
 if(k){
  l.ball.x=k.to.x;l.ball.y=k.to.y;
  if(e.result==='goal'){l.ball.x=50;l.ball.y=50;}
  else if(['saved','wide'].includes(e.result)){
   // The goalkeeper retrieves the ball instead of leaving it in the goalmouth.
   l.ball.x=fdg6HomeX(1-e.side,6);l.ball.y=50;
  }
 }
 l.v7Kick=null;
 fdg7PlanDrive();
}
function fdg7Enter(){
 const m=S.match,l=m.live;
 if(l.v7SubShown||m.enter<0||m.enter===0)return;
 l.v7SubShown=true;l.v7SubPause=true;l.paused=true;l.v7Following='field';
 // Once you step on, return to normal live speed instead of staying at the
 // accelerated bench-mode pace.
 l.mode='full';l.speed=1;
 l.v7Banner={type:'sub',label:`ENTRAS AL CAMPO · ${m.enter}'`,until:Infinity};
 const z=l.players[fdgHeroIndex()];
 if(z){z.n=l.v7HeroNumber;z.x=fdg6HomeX(0,49);z.y=99;z.tx=z.x;z.ty=78;}
 fdg6Feed({t:m.enter},`Sustitución: entra ${S.player.name} (${S.player.pos}) en el minuto ${m.enter}.`,'hero');
 persist();fdg6Sync(true);
}
// A clock crossed during simulation must stop at the substitute's entrance,
// the interval break, or the end of play. Action outcomes are revealed only
// after the ball has actually reached its destination.
fdg6Advance=function(mins){
 if(!fdg7IsNew())return fdg7LegacyAdvance(mins);
 let l=S.match.live,m=S.match;if(l.half||l.done||l.v7SubPause)return;
 const start=l.clock,sub=(!l.v7SubShown&&m.enter>0?m.enter:Infinity);
 const target=Math.min(90,start+Math.max(0,mins),start<45?45:90,sub);
 while(l.idx<l.events.length){
  const e=l.events[l.idx],finish=e.t+(['shot','penalty','direct','corner','cross'].includes(e.kind)&&e.result!=='cross'?.40:.27);
  if(e.t>=target)break;
  // If the last shot overlaps the whistle, finish that action before the
  // interval. It must not be replayed in the wrong attacking direction.
  if(finish>target){
   if(target===45&&e.t<45){
    if(!l.action){l.clock=e.t;fdg6LayoutAction(e);}
    l.clock=45;fdg6Apply(e);l.idx++;fdg7Arrival(e);l.action=null;
    continue;
   }
   break;
  }
  // Do not skip the visible flight in an ordinary frame.
  if(l.clock<e.t){l.clock=e.t;fdg6LayoutAction(e);}
  else if(!l.action)fdg6LayoutAction(e);
  l.clock=finish;
  fdg6Apply(e);
  l.idx++;
  fdg7Arrival(e);
 }
 l.clock=target;
 if(l.idx<l.events.length){
  const e=l.events[l.idx];
  if(e.t<=l.clock&&!l.action)fdg6LayoutAction(e);
  if(l.action&&l.clock>=l.action.revealAt){fdg6Apply(e);l.idx++;fdg7Arrival(e);l.action=null;}
 }
 if(!l.action&&!l.v7Drive)fdg7PlanDrive();
 if(l.clock===sub){fdg7Enter();return;}
 if(start<45&&target>=45){fdg6EndHalf();return;}
 if(target>=90){fdg6Conclude();return;}
};
// Do not leap over the last few frames of a goal when running normally;
// save the frozen goal notice as an actual, visible moment.
const fdg7LegacyFrame=fdg6Frame;
fdg6Frame=function(now){
 if(!fdg7IsNew())return fdg7LegacyFrame(now);
 FDG6.raf=0;const l=S?.match?.live;
 if(!l||l.done||S.view!=='match')return;
 const dt=Math.min(.09,Math.max(0,(now-FDG6.stamp)/1000));FDG6.stamp=now;
 if(!l.paused){
  let speed=l.speed;
  if(l.mode==='highlights'||l.v7Following==='bench'&&S.match.enter>l.clock)speed=12;
  if(performance.now()<FDG7.freezeUntil)speed=0;
  fdg6Advance(dt*.30*speed);
  if(Math.floor(l.clock/6)>l.lastSave){l.lastSave=Math.floor(l.clock/6);persist();}
 }
 fdg6Paint(dt);
 if(now-FDG6.lastDom>250){fdg6Sync(false);FDG6.lastDom=now;}
 if(!l.done)FDG6.raf=requestAnimationFrame(fdg6Frame);
};
// Responsive, tactical formation motion. Defenders maintain a back line,
// receivers run into passing lanes, closest markers press; no random jitter.
fdg6Paint=function(dt){
 if(!fdg7IsNew())return fdg7LegacyPaint(dt);
 const canvas=document.getElementById('fdg-pitch'),l=S.match.live;
 if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const W=900,H=500,pad=26,X=x=>pad+x*(W-2*pad)/100,Y=y=>pad+y*(H-2*pad)/100;
 const ball=fdg7BallAt(l);
 // Keep the pitch drawn even when the overlay temporarily hides it.
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#185e42';ctx.fillRect(0,0,W,H);
 for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#176b48':'#1a7951';ctx.fillRect(pad+i*(W-pad*2)/12,pad,(W-2*pad)/12,H-pad*2);}
 ctx.strokeStyle='rgba(224,251,225,.62)';ctx.lineWidth=2;
 ctx.strokeRect(pad,pad,W-2*pad,H-2*pad);ctx.beginPath();ctx.moveTo(W/2,pad);ctx.lineTo(W/2,H-pad);ctx.stroke();ctx.beginPath();ctx.arc(W/2,H/2,53,0,7);ctx.stroke();
 for(let k=0;k<2;k++){const x=k===0?pad:W-pad;ctx.strokeRect(k===0?x:x-118,H/2-115,118,230);ctx.strokeRect(k===0?x:x-42,H/2-62,42,124);ctx.fillStyle='#e6fbe8';ctx.fillRect(k===0?x-12:x,H/2-34,12,68);}
 const drive=l.v7Drive,action=l.action?.event,side=ball.side;
 const stage=drive?fdg7Clamp((l.clock-drive.start)/Math.max(.01,drive.end-drive.start),0,1):.6;
 const actorIndex=action?fdg7Actor(action):(drive?drive.actors[Math.min(2,Math.floor(stage*3))]:9);
 const attacking=side;
 // Choose two opponents closest to the ball to apply pressure.
 const chasers=l.players.filter(p=>p.team!==attacking&&p.i>0).map(p=>({p,dist:Math.hypot(p.x-ball.x,p.y-ball.y)})).sort((a,b)=>a.dist-b.dist).slice(0,2).map(v=>v.p);
 const alpha=1-Math.exp(-dt*4.4),limit=34*dt;
 for(const z of l.players){
  const [origX,origY]=FDG6_FORM[z.i];let anchor=fdg6HomeX(z.team,origX);
  let x=anchor+(ball.x-50)*.17;
  let y=origY+(ball.y-50)*.15;
  if(z.i===0){x=fdg6HomeX(z.team,5)+(ball.x-50)*.035;y=50+(ball.y-50)*.14;}
  else if(z.team===attacking){
   x+=fdg7TeamDir(z.team)*(z.i>=8?3:1);
   if(z.i>=8)x=fdg7Mix(x,fdg7Clamp(ball.x+fdg7TeamDir(z.team)*12,10,90),.22);
  }else if(z.i>=8){x=fdg7Mix(x,ball.x-fdg7TeamDir(attacking)*13,.20);}
  if(z.team===attacking&&z.i===actorIndex){x=ball.x-fdg7TeamDir(z.team)*(ball.flight?4:1.0);y=ball.y+(ball.flight?0:1.1);}
  if(chasers.includes(z)){x=fdg7Mix(x,ball.x-fdg7TeamDir(attacking)*(z===chasers[0]?4:8),.60);y=fdg7Mix(y,ball.y+(z===chasers[0]?3:-5),.60);}
  // A player entering the field starts on the touchline and moves inside.
  if(l.v7SubPause&&z.team===0&&z.i===fdgHeroIndex()){x=z.x;y=z.y;}
  x=fdg7Clamp(x,3,97);y=fdg7Clamp(y,5,95);
  const dx=(x-z.x)*alpha,dy=(y-z.y)*alpha,len=Math.hypot(dx,dy),ratio=len>limit?limit/len:1;
  if(!l.paused){z.x+=dx*ratio;z.y+=dy*ratio;}
  const sx=X(fdg7ScreenX(z.x,l)),sy=Y(z.y);
  const hero=z.team===0&&z.i===fdgHeroIndex()&&fdg6HeroLive(l.clock)&&!l.v7SubPause;
  ctx.beginPath();ctx.arc(sx+1.5,sy+2,11.8,0,7);ctx.fillStyle='#06281788';ctx.fill();
  if(hero){ctx.beginPath();ctx.arc(sx,sy,17.0,0,7);ctx.lineWidth=3;ctx.strokeStyle='#ffe870';ctx.stroke();}
  ctx.beginPath();ctx.arc(sx,sy,11.2,0,7);ctx.fillStyle=z.team===0?'#ccf47f':'#fbab8f';ctx.fill();ctx.lineWidth=1.3;ctx.strokeStyle=z.team===0?'#27452c':'#803e38';ctx.stroke();ctx.fillStyle='#10251d';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 11px system-ui';ctx.fillText(z.n,sx,sy+.4);
 }
 if(action?.kind==='offside'){
  const offsideX=X(fdg7ScreenX(action.x,l));ctx.save();ctx.strokeStyle='#f8e781bd';ctx.lineWidth=2;ctx.setLineDash([9,6]);ctx.beginPath();ctx.moveTo(offsideX,pad);ctx.lineTo(offsideX,H-pad);ctx.stroke();ctx.restore();
 }
 const bx=X(fdg7ScreenX(ball.x,l)),by=Y(ball.y);
 ctx.beginPath();ctx.ellipse(bx+1,by+2.5,7,3,0,0,7);ctx.fillStyle='#08271c77';ctx.fill();
 ctx.beginPath();ctx.arc(bx,by,5.2,0,7);ctx.fillStyle='white';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#153a29';ctx.stroke();
 if(l.v7Banner&&performance.now()<l.v7Banner.until&&l.v7Banner.type==='goal'){
  ctx.fillStyle='rgba(9,42,28,.83)';ctx.fillRect(300,24,300,57);ctx.fillStyle='#f5ffac';ctx.font='900 23px system-ui';ctx.textAlign='center';ctx.fillText(l.v7Banner.label,450,61);
 }
};
const fdg7Continue=function(){const l=S?.match?.live;if(!fdg7IsNew())return fdg7LegacyContinue();fdg7LegacyContinue();if(l){
 // Teams change ends at half-time. A fresh kick-off starts centrally.
 l.ball.x=50;l.ball.y=50;l.v7Kick=null;
 for(const p of l.players){p.x=fdg6HomeX(p.team,FDG6_FORM[p.i][0]);p.y=FDG6_FORM[p.i][1];}
 fdg7PlanDrive();fdg6Feed({t:45},'Los equipos han cambiado de campo. Se reanuda el encuentro.','half');fdg6Sync(true);
 }};
window.Game.halfContinue=fdg7Continue;
function fdg7SubContinue(){let l=S?.match?.live;if(!fdg7IsNew()||!l?.v7SubPause)return;
 l.v7SubPause=false;l.v7SubAcknowledged=true;l.paused=false;l.v7Banner=null;l.v7Following='field';persist();fdg6Sync(true);fdg6Resume();}
window.Game.subContinue=fdg7SubContinue;
function fdg7Watch(mode){let l=S?.match?.live;if(!fdg7IsNew()||l.done||l.v7SubPause)return;
 l.v7Following=mode==='full'?'full':'bench';l.mode=mode==='full'?'full':'highlights';
 persist();fdg6Sync(true);}
window.Game.subWatch=fdg7Watch;
const fdg7OldMode=window.Game.liveMode;
window.Game.liveMode=function(mode){if(fdg7IsNew()&&S.match.enter>0&&!S.match.live.v7SubShown){fdg7Watch(mode==='highlights'?'bench':'full');return;}return fdg7OldMode(mode);};
const fdg7OldSkip=window.Game.liveSkip;
window.Game.liveSkip=function(){let l=S?.match?.live;if(fdg7IsNew()&&l?.v7SubPause){fdg7SubContinue();return;}return fdg7OldSkip();};
const fdg7OldSync=fdg6Sync;
fdg6Sync=function(force){
 fdg7OldSync(force);if(!fdg7IsNew())return;
 const m=S.match,l=m.live,waiting=m.enter>0&&!l.v7SubShown;
 const item=id=>document.getElementById(id);
 let box=item('fdg7-bench');if(box)box.hidden=!waiting||l.v7Following==='full';
 const pitch=item('fdg7-pitch-area');if(pitch)pitch.classList.toggle('fdg7-only-events',waiting&&l.v7Following==='bench');
 box=item('fdg7-entry');if(box)box.hidden=!l.v7SubPause;
 const state=item('fdg7-role');if(state)state.textContent=l.v7SubPause?'SUSTITUCIÓN':waiting?`BANQUILLO · ENTRAS EN EL ${m.enter}'`:m.enter<0?'NO CONVOCADO':fdg6HeroLive(l.clock)?'EN EL CAMPO':'TITULAR';
 const side=item('fdg7-direction');if(side)side.textContent=l.clock>=45.02?'Tu equipo ataca ←':'Tu equipo ataca →';
 const bench=item('fdg7-watch-controls');if(bench)bench.hidden=!waiting;
 const top=document.querySelector('.fdg6-page .fdg-live-heading .v4-badge');
 if(top)top.textContent=l.v7SubPause?'VAS A ENTRAR':waiting?`SUPLENTE · ${m.enter}'`:m.enter<0?'NO CONVOCADO':'EN EL CÉSPED';
 const eventText=item('fdg7-bench-line');if(eventText){let event=l.feed[0];eventText.textContent=event?`${event.minute}' · ${event.text}`:'Esperando las primeras ocasiones…';}
 if(state&&l.v7SubPause)state.classList.add('fdg7-pulse');else state?.classList.remove('fdg7-pulse');
};
const fdg7OldView=v4MatchScreen;
function fdg7View(){
 const m=S?.match,l=m?.live;let html=fdg7OldView();if(!l||l.presentation!==7)return html;
 const banner=`<div class="fdg7-status"><strong id="fdg7-role">${m.enter>0&&l.clock<m.enter?`BANQUILLO · ENTRAS EN EL ${m.enter}'`:m.enter<0?'NO CONVOCADO':'EN EL CAMPO'}</strong><span id="fdg7-direction">${l.clock>=45.02?'Tu equipo ataca ←':'Tu equipo ataca →'}</span></div>`;
 const bench=`<div id="fdg7-bench" class="fdg7-bench" ${m.enter>0&&l.clock<m.enter&&l.v7Following==='bench'?'':'hidden'}><div class="v4-kicker">BANQUILLO · RETRANSMISIÓN DE ACONTECIMIENTOS</div><h3>Te preparas para entrar</h3><p>Mientras esperas ves las ocasiones y el marcador. Cuando el entrenador te llame, el partido se detendrá para mostrar tu entrada al campo.</p><div id="fdg7-bench-line">Los dos equipos están compitiendo.</div></div>`;
 const watch=`<div id="fdg7-watch-controls" class="fdg7-watch" ${m.enter>0&&l.clock<m.enter?'':'hidden'}><button onclick="Game.subWatch('bench')">⚡ Eventos hasta entrar</button><button onclick="Game.subWatch('full')">◉ Ver partido desde el inicio</button></div>`;
 const entry=`<div id="fdg7-entry" class="fdg7-entry" ${l.v7SubPause?'':'hidden'}><div class="v4-kicker">CAMBIO EN TU EQUIPO</div><h3>¡A CALENTAR! ${esc(S.player.name)}</h3><p>Minuto ${m.enter}: el entrenador te llama. Entras al césped para jugar los minutos que quedan.</p><button class="btn" onclick="Game.subContinue()">▶ Entrar al campo</button></div>`;
 html=html.replace('<div class="fdg-canvas-wrap">',banner+watch+'<div id="fdg7-pitch-area" class="fdg-canvas-wrap">'+bench);
 html=html.replace('<div class="fdg6-overlay" id="fdg-halftime"',entry+'<div class="fdg6-overlay" id="fdg-halftime"');
 html=html.replace('JORNADA '+(S.round+1)+' · RETRANSMISIÓN SIMULADA','JORNADA '+(S.round+1)+' · SIMULADOR 7.0');
 return html;
}
v4MatchScreen=fdg7View;
const fdg7OldPress=fdg6PressPrepare;
// Fix v6's shared {noun} placeholder ("1 goles" after an assist), and use
// the actual final match facts rather than a generic system question.
fdg6PressPrepare=function(){
 fdg7OldPress();const r=S?.lastResult,p=S?.pressV6;if(!r||!p||p.answered)return;
 if(p.type==='assist'){
  const count=Math.max(0,r.assists||0);
  p.question=count===1?`Has dado una asistencia contra ${r.opp}. ¿Cómo viste la jugada y qué fue lo más importante para crear esa ocasión?`:`Has dado ${count} asistencias contra ${r.opp}. ¿Cómo has encontrado los espacios para ayudar a tus compañeros?`;
  if(r.us<r.them)p.question+=` Aun así, el equipo ha perdido ${r.us}-${r.them}.`;
 }else if(p.type==='goal'){
  const n=r.goals||0;p.question=`${n===1?'Has marcado un gol':`Has marcado ${n} goles`} ante ${r.opp}. ${r.us>r.them?'¿Cómo valoras tu contribución a la victoria?':'¿Qué significa para ti después de este resultado?'}`;
 }
};
if(S?.match?.live?.presentation===7&&S.view==='match'){render();fdg6Resume();}