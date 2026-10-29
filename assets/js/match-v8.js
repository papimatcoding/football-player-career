/* FUERA DE GUIÓN 8 — tactical 2D match broadcast.
 * Display-only layer over V6's event-sourced match statistics. Does not alter
 * any serialized career values, the existing save key or completed fixtures.
 * V7/earlier matches loaded mid-flight keep their original renderer. */
'use strict';
const FDG8 = {tick:0, lastScene:'', visualSpeed:32, frame:0};
const fdg8Current=()=>!!(S?.match?.live?.engine===6&&S.match.live.presentation===7&&S.match.live.v8===true);
const fdg8C=(x,a,b)=>Math.min(b,Math.max(a,x));
const fdg8L=(a,b,t)=>a+(b-a)*fdg8C(t,0,1);
const fdg8V=(x,y)=>({x,y});
const fdg8Dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const fdg8Ease=x=>{x=fdg8C(x,0,1);return x*x*(3-2*x)};
const fdg8Dir=side=>side===0?1:-1;
const fdg8Home=(side,x)=>side===0?x:100-x;
const fdg8Seed=(event,k=1)=>{const x=Math.sin((event?.id||0)*24.721+k*77.112)*43758.546;return x-Math.floor(x)};
const FDG8_SET=new Set(['corner','direct','indirect','penalty','restart']);
const FDG8_SHOT=new Set(['shot','corner','direct','penalty','cross']);
const FDG8_LABEL={corner:'SAQUE DE ESQUINA',direct:'FALTA DIRECTA',indirect:'LIBRE INDIRECTO',penalty:'PENALTI',restart:'SAQUE DE CENTRO',offside:'FUERA DE JUEGO',foul:'FALTA',shot:'REMATE',cross:'CENTRO AL ÁREA',tackle:'RECUPERACIÓN',pass:'EN JUEGO'};
// Pitch coordinates stay team-relative (left-to-right for side 0) for the
// entire event stream; visual projection mirrors only after the interval.
function fdg8Origin(e){return fdg8V(e.x,e.y);}
function fdg8Terminal(e){
 const d=fdg8Dir(e.side),g=fdg6GoalX(e.side),r=fdg8Seed(e,3);
 if(e.kind==='restart')return fdg8V(50+fdg8Dir(e.side)*5,48);
 if(e.kind==='offside'||e.kind==='foul')return fdg8V(e.x,e.y);
 if(e.kind==='tackle')return fdg8V(e.x,e.y);
 if(FDG8_SHOT.has(e.kind)&&e.result!=='cross'){
  if(e.result==='goal')return fdg8V(g,48.5+r*3);
  if(e.result==='saved')return fdg8V(g-d*3.5,43+r*14);
  if(e.result==='blocked')return fdg8V(fdg8C(e.x+d*6,3,97),e.y+fdg8L(-7,7,r));
  return fdg8V(g,r<.5?18+r*24:70+(r-.5)*24);
 }
 if(e.kind==='corner'||e.kind==='cross'||e.kind==='direct')return fdg8V(fdg8Home(e.side,87),42+r*18);
 if(e.kind==='indirect')return fdg8V(fdg8C(e.x+d*8,4,96),fdg8C(e.y+9*(r-.5),5,95));
 if(e.kind==='pass')return fdg8V(fdg8C(e.x+d*8,5,95),fdg8C(e.y+12*(r-.5),6,94));
 return fdg8V(e.x,e.y);
}
// For a corner/centre/free kick, the position of the restart is fixed. The
// previous ball is intentionally retired while play is stopped; it never
// visibly drifts across the field to the new placement.
function fdg8At(l,clock=l.clock){
 const e=l.events[l.idx],prev=l.events[l.idx-1],start=prev?prev.t+.40:0;
 if(!e){let end=prev?fdg8Terminal(prev):fdg8V(50,50);return {ball:end,side:prev?.side??0,stage:'open',event:prev,progress:1,carrierIndex:9,flight:false};}
 const stageStart=e.t-Math.min(.54,Math.max(.22,(e.t-start)*.62));
 const isSet=FDG8_SET.has(e.kind),live=clock>=e.t;
 const setup=isSet&&!live&&clock>=stageStart;
 const pre=clock<e.t;
 let ball,flight=false,progress=0,stage='open';
 if(setup){ball=fdg8Origin(e);stage='setup';progress=fdg8C((clock-stageStart)/Math.max(.01,e.t-stageStart),0,1);}
 else if(pre){
  const from=prev?fdg8Terminal(prev):fdg8V(50,50);
  const to=fdg8Origin(e);
  let u=fdg8Ease((clock-start)/Math.max(.12,(isSet?stageStart:e.t)-start));
  // Two visible pass/run segments, with a small lateral change of angle.
  const normal=(fdg8Seed(e,2)-.5)*Math.min(13,fdg8Dist(from,to)*.25);
  const halfway=fdg8V(fdg8L(from.x,to.x,.50),fdg8L(from.y,to.y,.50)+normal);
  if(u<.5){let v=fdg8Ease(u*2);ball=fdg8V(fdg8L(from.x,halfway.x,v),fdg8L(from.y,halfway.y,v));}
  else{let v=fdg8Ease((u-.5)*2);ball=fdg8V(fdg8L(halfway.x,to.x,v),fdg8L(halfway.y,to.y,v));}
  stage='build';progress=u;flight=(u>.08&&u<.17)||(u>.55&&u<.68);
 }else{
  stage='kick';progress=fdg8Ease((clock-e.t)/.40);
  const from=fdg8Origin(e),to=fdg8Terminal(e);
  const doubleTouch=(e.kind==='corner'||e.kind==='cross'||e.kind==='direct')&&e.result!=='cross';
  if(doubleTouch){
   // A delivery and a second contact in the box (never a corner that
   // magically flies directly into the goal).
   const reception=fdg8V(fdg8Home(e.side,86),44+fdg8Seed(e,9)*12);
   if(progress<.58){const u=fdg8Ease(progress/.58);ball=fdg8V(fdg8L(from.x,reception.x,u),fdg8L(from.y,reception.y,u));}
   else{const u=fdg8Ease((progress-.58)/.42);ball=fdg8V(fdg8L(reception.x,to.x,u),fdg8L(reception.y,to.y,u));}
  }else{
   const u=progress;ball=fdg8V(fdg8L(from.x,to.x,u),fdg8L(from.y,to.y,u));
  }
  flight=FDG8_SHOT.has(e.kind)||e.kind==='indirect'||e.kind==='pass';
 }
 ball.x=fdg8C(ball.x,0,100);ball.y=fdg8C(ball.y,0,100);
 // In the original event stream 'e.side' always identifies the team receiving
 // the event. No team swapping is inferred from the colour on screen.
 return {ball,side:e.side,event:e,stage,progress,flight,
  carrierIndex:e.hero&&S.player.pos!=='POR'&&fdg6HeroLive(e.t)?fdgHeroIndex():fdg8Actor(e),
  inPlay:!setup,isSet};
}
function fdg8Actor(e){
 const opts=e.kind==='shot'||e.kind==='penalty'?[8,9,10]:e.kind==='corner'?[1,4,8,10]:e.kind==='direct'?[5,7,8,9]:[1,2,3,4,5,6,7,8,9,10];
 return opts.slice().sort((a,b)=>{
  const p=fdg8V(fdg8Home(e.side,FDG6_FORM[a][0]),FDG6_FORM[a][1]);
  const q=fdg8V(fdg8Home(e.side,FDG6_FORM[b][0]),FDG6_FORM[b][1]);
  return fdg8Dist(p,e)-fdg8Dist(q,e);
 })[0];
}
function fdg8SetTargets(l,pose){
 const e=pose.event, side=e.side,def=1-side,d=fdg8Dir(side),origin=fdg8Origin(e);
 const byTeam=Array.from({length:2},()=>Array(11).fill(null));
 const place=(team,i,x,y)=>byTeam[team][i]=fdg8V(fdg8C(x,3,97),fdg8C(y,5,95));
 const gx=fdg6GoalX(side),defGoalX=fdg8Home(def,5);
 const actor=pose.carrierIndex;
 if(e.kind==='penalty'){
  // Spot at 11 metres, keeper on the line, and EVERY other footballer
  // outside the defending penalty area and the D until the ball is kicked.
  const spot=fdg8Home(side,87);
  place(side,actor,spot-d*3.8,50);
  place(def,0,fdg8Home(def,3),50);
  const attackOrder=[1,2,3,4,5,6,7,8,9,10].filter(i=>i!==actor);
  attackOrder.forEach((i,j)=>place(side,i,fdg8Home(side,66+j%4*2.8),17+j*6.5));
  for(let i=1;i<=10;i++)place(def,i,fdg8Home(side,69+(i%4)*2.8),14+(i-1)*7.5);
  if(pose.stage==='kick'&&pose.progress>.48){
   // Only after the kick can the players break into the box for a rebound.
   for(let i=1;i<=10;i++)if(i!==actor){let p=byTeam[side][i];p.x+=d*4;}
   for(let i=1;i<=10;i++)byTeam[def][i].x+=d*3;
  }
  return byTeam;
 }
 if(e.kind==='corner'){
  place(side,actor,origin.x-d*2.5,origin.y<50?7:93);
  place(def,0,fdg8Home(def,3),50);
  // Six aerial targets, two on the edge for second balls, two at the back.
  const receivers=[8,9,10,5,7,6].filter(i=>i!==actor);
  receivers.forEach((i,j)=>place(side,i,fdg8Home(side,83+(j%3)*2),27+j*8));
  for(let i of [2,3])if(i!==actor)place(side,i,fdg8Home(side,74+i%2*3),i===2?40:63);
  for(let i of [1,4])if(i!==actor)place(side,i,fdg8Home(side,56),i===1?18:82);
  for(let i=1;i<=6;i++)place(def,i,fdg8Home(side,86+(i%3)*1.8),27+i*8);
  for(let i=7;i<=8;i++)place(def,i,fdg8Home(side,76),i===7?40:63);
  for(let i=9;i<=10;i++)place(def,i,fdg8Home(side,57),i===9?25:75);
  // The cross is met by a receiver inside the area, not by the corner taker.
  if(pose.stage==='kick'&&pose.progress>.57){let i=receivers[0],p=byTeam[side][i];if(p){p.x=fdg8Home(side,86);p.y=44+fdg8Seed(e,9)*12;}}
  return byTeam;
 }
 if(e.kind==='direct'||e.kind==='indirect'){
  place(side,actor,origin.x-d*2.2,origin.y+3);
  place(def,0,fdg8Home(def,4),50);
  // Defensive wall 9.15m away, between the ball and the goal.
  const wallX=fdg8C(origin.x+d*9,5,95),wallY=fdg8L(origin.y,50,.24);
  for(let n=0;n<4;n++)place(def,n+1,wallX,wallY+(n-1.5)*4.3);
  for(let n=5;n<=8;n++)place(def,n,fdg8Home(side,82+(n%3)*2.0),25+(n-5)*15);
  for(let n=9;n<=10;n++)place(def,n,fdg8Home(side,58),n===9?24:76);
  const attackers=[8,9,10,5,7].filter(i=>i!==actor);
  attackers.forEach((i,j)=>place(side,i,fdg8Home(side,80+(j%3)*3),22+j*14));
  for(let i of [1,4])if(i!==actor)place(side,i,fdg8Home(side,53),i===1?18:82);
  for(let i of [2,3,6])if(i!==actor)place(side,i,fdg8Home(side,67+(i%3)*2),i===2?32:i===3?67:50);
  if(e.kind==='indirect'){
   const receiver=attackers[0]??6;place(side,receiver,origin.x+d*6,origin.y-8);
  }
  return byTeam;
 }
 if(e.kind==='restart'){
  place(side,9,50-d*1.8,50);
  place(side,6,50-d*7,49);
  for(let t=0;t<2;t++)for(let i=0;i<11;i++){
   if(byTeam[t][i])continue;
   let [x,y]=FDG6_FORM[i];let ex=fdg8Home(t,x);
   // Nobody steps into the other team's half before the centre kick.
   if(t===side)ex=fdg8C(ex,side===0?5:50,side===0?50:95);
   else ex=fdg8C(ex,t===0?5:51,t===0?49:95);
   place(t,i,ex,y);
  }
  return byTeam;
 }
 return null;
}
function fdg8Formation(l,pose){
 const targets=Array.from({length:2},()=>Array(11));
 const ball=pose.ball,side=pose.side,enemy=1-side,d=fdg8Dir(side);
 const e=pose.event,kind=e?.kind,stage=pose.stage;
 const pressure=(ball.x-50),wide=(ball.y-50);
 for(let team=0;team<2;team++)for(let i=0;i<11;i++){
  const [fx,fy]=FDG6_FORM[i],baseX=fdg8Home(team,fx),isAttack=team===side;
  let tx=baseX+pressure*(i===0?.045:i<=4?.22:.35),ty=fy+wide*(i===0?.11:i<=4?.23:.30);
  if(i===0){const goal=fdg8Home(team,4);tx=fdg8L(goal,ball.x,(isAttack?.06:.14));ty=fdg8L(50,ball.y,.11);}
  else if(i<=4){
   // Back four remain compact while shifting collectively behind the ball.
   tx=fdg8Home(team,27)+pressure*.20+(i===1||i===4?(isAttack?d*1:0):0);
   ty=fy+wide*.21;
  }else if(i<=7){
   tx=baseX+pressure*.31+(isAttack?d*3:-d*2);
   ty=fy+wide*.33;
  }else{
   // Wingers stretch play; striker plays between centre backs, not on top
   // of the current ball carrier throughout the whole attack.
   tx=baseX+pressure*.27+(isAttack?d*4:-d*4);
   ty=(i===9?50:fy)+wide*.20;
  }
  targets[team][i]=fdg8V(fdg8C(tx,4,96),fdg8C(ty,5,95));
 }
 if(kind==='offside'&&stage==='kick'){
  const line=e.x-d*3;
  for(let i=1;i<=4;i++)targets[enemy][i].x=fdg8C(line,6,94);
  targets[side][pose.carrierIndex]=fdg8V(fdg8C(e.x+d*2,5,95),e.y);
 }else{
  // Nearest two defenders close the carrier; the third covers the passing
  // channel. Do not drag an entire defensive team into the same ball point.
  const defenders=[1,2,3,4,5,6,7,8,9,10].map(i=>({i,d:fdg8Dist(targets[enemy][i],ball)})).sort((a,b)=>a.d-b.d);
  const a=defenders[0]?.i,b=defenders[1]?.i;
  if(a!==undefined){const p=targets[enemy][a];p.x=fdg8L(p.x,ball.x-d*3,.60);p.y=fdg8L(p.y,ball.y+3,.60);}
  if(b!==undefined){const p=targets[enemy][b];p.x=fdg8L(p.x,ball.x-d*8,.34);p.y=fdg8L(p.y,ball.y-5,.34);}
 }
 // Carrier follows the ball during a dribble; on a pass the carrier gives
 // way to the receiving teammate while another attacker offers support.
 let ballActor=pose.carrierIndex;
 if(stage==='build'&&pose.progress<.53)ballActor=[5,6,7][Math.floor(fdg8Seed(e,7)*3)];
 if(stage==='kick'&&kind==='corner'&&pose.progress>.57)ballActor=9;
 if(stage==='kick'&&kind==='cross'&&pose.progress>.57)ballActor=9;
 if(stage==='kick'&&kind==='direct'&&pose.progress>.57&&e.result!=='cross')ballActor=9;
 if(ballActor!==undefined&&ballActor!==null){
  const trail=pose.flight?5:1.6;
  targets[side][ballActor]=fdg8V(fdg8C(ball.x-d*trail,4,96),fdg8C(ball.y+1.8,6,94));
 }
 if(stage==='setup'||stage==='kick'&&FDG8_SET.has(kind)){
  const staged=fdg8SetTargets(l,pose);
  if(staged){for(let t=0;t<2;t++)for(let i=0;i<11;i++)if(staged[t][i]){
   const target=targets[t][i],set=staged[t][i];
   const factor=1;
   target.x=fdg8L(target.x,set.x,factor);target.y=fdg8L(target.y,set.y,factor);
  }}
 }
 if(kind==='shot'&&stage==='kick'){
  const goalkeeper=targets[enemy][0];
  goalkeeper.y=fdg8L(50,fdg8Terminal(e).y,pose.progress*.7);
 }
 if(e?.hero&&fdg6HeroLive(l.clock)&&S.player.pos!=='POR'&&stage==='kick'&&!FDG8_SET.has(kind)){
  targets[0][fdgHeroIndex()]=fdg8V(fdg8C(ball.x-d*(pose.flight?5:2),4,96),fdg8C(ball.y+2,6,94));
 }
 return targets;
}
function fdg8Inspect(l=S.match.live){let scene=fdg8At(l);return {...scene,targets:fdg8Formation(l,scene)};}
function fdg8DrawPitch(ctx,X,Y,W,H,pad){
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#145b3e';ctx.fillRect(0,0,W,H);
 for(let i=0;i<14;i++){ctx.fillStyle=i%2?'#176d49':'#207a51';ctx.fillRect(pad+i*(W-2*pad)/14,pad,(W-2*pad)/14+1,H-2*pad);}
 ctx.save();ctx.strokeStyle='#e3fae9bc';ctx.lineWidth=2;ctx.strokeRect(pad,pad,W-2*pad,H-2*pad);
 ctx.beginPath();ctx.moveTo(W/2,pad);ctx.lineTo(W/2,H-pad);ctx.stroke();ctx.beginPath();ctx.arc(W/2,H/2,53,0,2*Math.PI);ctx.stroke();
 for(let k=0;k<2;k++){
  const x=k===0?pad:W-pad,left=k===0;
  ctx.strokeRect(left?x:x-139,H/2-119,139,238);ctx.strokeRect(left?x:x-55,H/2-58,55,116);
  ctx.fillStyle='#e3fae9bc';ctx.beginPath();ctx.arc(left?x+91:x-91,H/2,2.6,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(left?x+139:x-139,H/2,52,left?-.92:Math.PI-.92,left?.92:Math.PI+.92);ctx.stroke();
  ctx.fillStyle='#e4f7ff';ctx.fillRect(left?x-11:x,H/2-30,11,60);
  for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x,H/2-30+i*30,3,0,7);ctx.stroke();}
  // Corner arcs: spectators can see the exact restart position.
  ctx.beginPath();ctx.arc(x,pad,13,left?0:Math.PI/2,left?Math.PI/2:Math.PI);ctx.stroke();
  ctx.beginPath();ctx.arc(x,H-pad,13,left?-Math.PI/2:Math.PI,left?0:3*Math.PI/2);ctx.stroke();
 }
 ctx.restore();
}
function fdg8Canvas(dt){
 if(!fdg8Current())return;
 const l=S.match.live,canvas=document.getElementById('fdg-pitch');if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const W=900,H=500,pad=26,X=x=>pad+x*(W-2*pad)/100,Y=y=>pad+y*(H-2*pad)/100;
 const sx=x=>X(l.clock>=45.02?100-x:x),sy=y=>Y(y);
 const pose=fdg8At(l),targets=fdg8Formation(l,pose),e=pose.event;
 fdg8DrawPitch(ctx,X,Y,W,H,pad);
 const playerSpeed=(l.mode==='highlights'?1.7:1)*Math.max(1,l.speed||1);
 const speed=42*dt*playerSpeed,blend=1-Math.exp(-dt*5.2*playerSpeed);
 const setupKey=pose.stage==='setup'&&e?`${l.idx}-${e.kind}-${e.t}`:null;
 const snapSetup=setupKey&&l.v8SetupKey!==setupKey;
 if(snapSetup)l.v8SetupKey=setupKey;
 const positions=[[],[]];
 for(const p of l.players){
  const t=targets[p.team]?.[p.i]||fdg8V(p.x,p.y),dx=t.x-p.x,dy=t.y-p.y,dist=Math.hypot(dx,dy);
  if(snapSetup){p.x=t.x;p.y=t.y;}
  else if(!l.paused&&dist>.001){const frac=Math.min(1,dist?Math.min(speed/dist,blend):1);p.x+=dx*frac;p.y+=dy*frac;}
  positions[p.team][p.i]=p;
 }
 // Live positional overlay: penalty spot, wall and offside line are all
 // drawn in the same transformed coordinate system as the footballers.
 if(e&&pose.stage==='setup'||e&&pose.stage==='kick'){
  if(e.kind==='penalty'){
   const spot=fdg8Home(e.side,87);
   ctx.beginPath();ctx.arc(sx(spot),sy(50),5,0,7);ctx.fillStyle='#ffe79a';ctx.fill();
   ctx.strokeStyle='#ffedabbb';ctx.setLineDash([5,7]);ctx.beginPath();ctx.arc(sx(spot),sy(50),23,0,7);ctx.stroke();ctx.setLineDash([]);
  }else if(e.kind==='direct'||e.kind==='indirect'){
   const d=fdg8Dir(e.side),wallX=fdg8C(e.x+d*9,5,95),wallY=fdg8L(e.y,50,.24);
   ctx.strokeStyle='#e6e5ff8c';ctx.setLineDash([3,6]);ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx(e.x),sy(e.y),fdg8Dist(fdg8V(wallX,wallY),e)*7.6,0,7);ctx.stroke();ctx.setLineDash([]);
  }
 }
 if(e?.kind==='offside'&&(pose.stage==='kick'||pose.stage==='build'&&pose.progress>.77)){
  const off=sx(e.x-fdg8Dir(e.side)*3);ctx.save();ctx.strokeStyle='#ffe072';ctx.lineWidth=2;ctx.setLineDash([8,5]);ctx.beginPath();ctx.moveTo(off,pad);ctx.lineTo(off,H-pad);ctx.stroke();ctx.restore();
 }
 // The pitch and all player targets are computed before the ball is painted.
 for(const p of l.players){
  const px=sx(p.x),py=sy(p.y);
  ctx.beginPath();ctx.ellipse(px+1.5,py+4.4,11,4,0,0,7);ctx.fillStyle='#071c1990';ctx.fill();
  const hero=p.team===0&&p.i===fdgHeroIndex()&&fdg6HeroLive(l.clock)&&!l.v7SubPause;
  if(hero){ctx.beginPath();ctx.arc(px,py,16.7,0,7);ctx.strokeStyle='#ffeb81';ctx.lineWidth=3;ctx.stroke();}
  ctx.beginPath();ctx.arc(px,py,11,0,7);ctx.fillStyle=p.team===0?'#dbf784':'#ffa88f';ctx.fill();ctx.lineWidth=1.4;ctx.strokeStyle=p.team===0?'#285435':'#864238';ctx.stroke();
  ctx.font='bold 11px system-ui';ctx.fillStyle='#122820';ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillText(p.n,px,py+.4);
 }
 const ball=pose.ball;
 if(pose.flight&&e){
  // A short, fading tail makes a long pass readable but doesn't draw a
  // permanent arrow across the pitch or imply an impossible ball path.
  for(let i=4;i>=1;i--){const v=fdg8At(l,Math.max(0,l.clock-i*.023)).ball;
   ctx.beginPath();ctx.arc(sx(v.x),sy(v.y),1.8+(4-i)*.28,0,7);ctx.fillStyle=`rgba(255,255,245,${.12+i*.08})`;ctx.fill();}
 }
 const bx=sx(ball.x),by=sy(ball.y),raised=pose.flight?4.5*Math.sin(Math.PI*pose.progress):0;
 ctx.beginPath();ctx.ellipse(bx+1,by+4,6.5,2.6,0,0,7);ctx.fillStyle='#072c2090';ctx.fill();
 ctx.beginPath();ctx.arc(bx,by-raised,5.6,0,7);ctx.fillStyle='#fffdf1';ctx.fill();ctx.lineWidth=1.7;ctx.strokeStyle='#183c2f';ctx.stroke();
 if(l.v7Banner&&performance.now()<l.v7Banner.until&&l.v7Banner.type==='goal'){
  ctx.fillStyle='rgba(7,35,23,.91)';ctx.fillRect(300,22,300,56);ctx.strokeStyle='#e6f49f';ctx.strokeRect(300,22,300,56);ctx.font='900 24px system-ui';ctx.fillStyle='#f6ffc9';ctx.textAlign='center';ctx.fillText('¡GOOOOL!',450,58);
 }
 FDG8.lastScene=pose.stage;
}
// The same event-driven result engine remains the single source of truth for
// the scoreboard, goals, penalties, card counts and statistics.
const fdg8PreviousPaint=fdg6Paint;
fdg6Paint=function(dt){if(!fdg8Current())return fdg8PreviousPaint(dt);fdg8Canvas(Math.min(dt,.09));};
const fdg8PreviousStart=window.Game.playMatch;
window.Game.playMatch=function(){fdg8PreviousStart();let l=S?.match?.live;if(!l||l.engine!==6||l.presentation!==7)return;
 l.v8=true;l.v8Build='setpiece-and-possession';persist();render();fdg6Resume();};
const fdg8PreviousView=v4MatchScreen;
v4MatchScreen=function(){let html=fdg8PreviousView();if(!fdg8Current())return html;
 html=html.replace('SIMULADOR 7.0','SIMULADOR 8.0');
 html=html.replace('<div id="fdg7-pitch-area" class="fdg-canvas-wrap">','<div id="fdg7-pitch-area" class="fdg-canvas-wrap fdg8-pitch-area"><div id="fdg8-action" class="fdg8-action" aria-live="off">EN JUEGO</div>');
 return html;
};
const fdg8PreviousSync=fdg6Sync;
fdg6Sync=function(force){fdg8PreviousSync(force);if(!fdg8Current())return;
 const l=S.match.live,e=l.events[l.idx],pose=fdg8At(l);
 const q=document.getElementById('fdg8-action');if(q){const relevant=e&&(pose.stage==='setup'||pose.stage==='kick'||e.kind==='offside'&&pose.progress>.75);
  q.textContent=relevant?(pose.stage==='setup'?'PREPARANDO · ':'')+(FDG8_LABEL[e.kind]||'EN JUEGO')+(e.side===0?' · TU EQUIPO':' · RIVAL'):'EN JUEGO';
  q.dataset.kind=relevant?e.kind:'open';}
 const direction=document.getElementById('fdg7-direction');if(direction)direction.textContent=l.clock>=45.02?'Tu equipo ataca ←':'Tu equipo ataca →';
};
window.FDG8={inspect:fdg8Inspect,at:fdg8At,formation:fdg8Formation,version:8};
// If a fresh V8 fixture was saved mid-match, resume it. Legacy V5-V7
// fixtures retain their own rules until the next match begins.
if(fdg8Current()&&S?.view==='match'){render();fdg6Resume();}