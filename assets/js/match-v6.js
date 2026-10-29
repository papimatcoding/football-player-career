/* FUERA DE GUIÓN 6.0 — event-sourced match simulation and 60Hz canvas presenter.
 * All box-score statistics are consequences of the events that are actually simulated.
 * Clock at x1: 90 / 300 football minutes per wall-clock second, not frame dependent.
 * No external APIs; game state remains on the unchanged v4 localStorage key. */
'use strict';
const FDG6={raf:0,stamp:0,lastDom:0,slowUntil:0,scene:null};
const fdgV5Resume=fdgResumeTicker;
const fdgV5Stop=fdgStopTicker;
const fdgV5View=fdgLiveView;
const FDG6_FORM=[[5,50],[23,12],[22,36],[22,64],[23,88],[44,20],[46,50],[44,80],[69,17],[75,50],[69,83]];
const FDG6_NUM=[1,2,4,5,3,6,8,10,7,9,11];
const FDG6_NAMES=['portería','lateral','central','central','lateral','interior','medio','interior','extremo','delantero','extremo'];
const FDG6_KINDS={restart:'Saque de centro',pass:'Circulación',tackle:'Recuperación',offside:'Fuera de juego',foul:'Falta',shot:'Disparo',cross:'Centro',corner:'Córner',penalty:'Penalti',direct:'Falta directa',indirect:'Falta indirecta'};
const fdg6Rand=(a,b)=>a+Math.random()*(b-a);
const fdg6Pick=a=>a[Math.floor(Math.random()*a.length)];
function fdg6EmptyStats(){return {shots:0,on:0,goals:0,xg:0,passes:0,attempts:0,corners:0,fouls:0,offsides:0,yellow:0,red:0,penalties:0,direct:0,indirect:0,saves:0,tackles:0,blocks:0};}
function fdg6HeroLive(min){let m=S?.match;return !!m&&m.enter>=0&&min>=m.enter&&!m.sentOff&&(m.exitMinute===undefined||min<m.exitMinute);}
function fdg6HomeX(side,x){return side===0?x:100-x;}
function fdg6GoalX(side){return side===0?98:2;}
function fdg6Other(side){return 1-side;}
function fdg6Generate(){
 const m=S.match,home=S.club.power,away=getClub(m.opp).power;
 const h=.51+clamp((home-away)/160,-.16,.16)+(m.home?.025:-.025);
 const list=[];let minute=0.6,side=Math.random()<h?0:1,pending=null;
 while(minute<89.5&&list.length<190){
   const r=Math.random();let kind=pending?.kind|| (r<.405?'pass':r<.485?'tackle':r<.535?'offside':r<.665?'foul':r<.85?'shot':r<.95?'cross':'pass');
   if(pending){side=pending.side;pending=null;}else if(Math.random()<(side===0?h:1-h)*.27+.23)side=fdg6Other(side);
   let e={t:+minute.toFixed(2),side,kind,id:list.length,x:0,y:+fdg6Rand(18,82).toFixed(1),result:'',xg:0,linked:false,hero:false};
   const attacking=kind!=='tackle';const off=attacking?fdg6Rand(43,91):fdg6Rand(27,78);
   e.x=+fdg6HomeX(side,off).toFixed(1);
   if(kind==='pass'){e.passes=Math.round(fdg6Rand(8,18));e.completed=e.passes-Math.round(fdg6Rand(0,3));e.result='completed';}
   if(kind==='tackle'){e.passes=Math.round(fdg6Rand(1,4));e.completed=e.passes;e.result='won';side=fdg6Other(side);e.side=side;e.x=fdg6HomeX(side,fdg6Rand(32,63));}
   if(kind==='restart'){e.x=50;e.y=50;e.result='kickoff';}
   if(kind==='offside'){e.x=fdg6HomeX(side,fdg6Rand(75,91));e.result='whistle';pending={kind:'indirect',side:fdg6Other(side)};}
   if(kind==='foul'){
      e.x=fdg6HomeX(side,fdg6Rand(48,94));e.inBox=(side===0?e.x>83:e.x<17)&&Math.random()<.14;
      e.hard=Math.random();e.result=e.hard>.988?'red':e.hard>.77?'yellow':'foul';
      pending={kind:e.inBox?'penalty':(side===0?e.x>68:e.x<32)?'direct':'indirect',side};
   }
   if(['shot','penalty','direct','corner','cross'].includes(kind)){
     let quality=kind==='penalty'?.76:kind==='direct'?.075:kind==='corner'?.115:kind==='cross'?.10:clamp(fdg6Rand(.035,.29),.025,.36);
     let strength=clamp((side===0?home-away:away-home)/130,-.13,.13);
     e.xg=+clamp(quality,0.015,.78).toFixed(3);
     if((kind==='cross'&&Math.random()<.50)||(kind==='direct'&&Math.random()<.63)||(kind==='corner'&&Math.random()<.56)){e.result='cross';e.xg=0;}
     else{
       let goalChance=clamp(quality*(1+strength)*.87,.008,.85);let shotRoll=Math.random();
       e.result=shotRoll<goalChance?'goal':shotRoll<goalChance+.34?'saved':shotRoll<goalChance+.50?'blocked':'wide';
       if(e.result==='goal')pending={kind:'restart',side:fdg6Other(side)};
       else if(e.result==='blocked'&&Math.random()<.52||e.result==='saved'&&Math.random()<.24)pending={kind:'corner',side};
     }
     e.x=kind==='penalty'?fdg6HomeX(side,87):kind==='direct'?fdg6HomeX(side,fdg6Rand(71,81)):fdg6HomeX(side,fdg6Rand(71,92));
   }
   if(kind==='corner'){e.x=fdg6HomeX(side,98);e.y=e.y<50?4:96;}
   e.hero=side===0&&fdg6HeroLive(e.t)&&Math.random()<(['DC','EI','ED'].includes(S.player.pos)?.36:S.player.pos==='POR'?.055:.25);
   e.number=e.hero?FDG6_NUM[fdgHeroIndex()]:fdg6Pick([7,8,9,10,11,6]);
   list.push(e);
   minute+=pending?fdg6Rand(.27,.55):fdg6Rand(.64,1.50);
 }
 return list;
}
function fdg6Start(){
 let m=S?.match;if(!m||m.started)return;
 m.started=true;m.minute=0;
 m.live={engine:6,clock:0,speed:1,mode:'full',paused:false,half:false,done:false,idx:0,stats:[fdg6EmptyStats(),fdg6EmptyStats()],possession:[1,1],feed:[{minute:0,type:'info',text:'¡Rueda el balón!'}],goals:[],players:[],ball:{x:50,y:50,fx:50,fy:50,tx:50,ty:50,start:0,end:1},action:null,weather:fdg6Pick(['Despejado','Nublado','Lluvia ligera','Viento suave']),events:[],lastSave:0,replay:null};
 const l=m.live;
 for(let team=0;team<2;team++)for(let i=0;i<11;i++){
  let [xx,yy]=FDG6_FORM[i],x=fdg6HomeX(team,xx);
  l.players.push({team,i,n:FDG6_NUM[i],x,y:yy,tx:x,ty:yy});
 }
 l.events=fdg6Generate();
 persist();render();fdg6Resume();
}
function fdg6Stop(){if(FDG6.raf){cancelAnimationFrame(FDG6.raf);FDG6.raf=0;}}
function fdg6Resume(){
 if(S?.match?.live?.engine!==6)return fdgV5Resume();
 fdgV5Stop();fdg6Stop();
 if(S.view!=='match'||S.match.live.done)return;
 FDG6.stamp=performance.now();FDG6.lastDom=0;
 FDG6.raf=requestAnimationFrame(fdg6Frame);
}
// The previous renderer may try to start its 80ms interval on every render.
fdgResumeTicker=fdg6Resume;
function fdg6Feed(e,text,type='info'){
 const l=S.match.live;
 const entry={minute:Math.min(90,Math.ceil(e.t||l.clock)),type,text};l.feed.unshift(entry);l.feed=l.feed.slice(0,42);if(type==='goal'){l.goals=(l.goals||[]);l.goals.unshift(entry);l.goals=l.goals.slice(0,24);}
}
function fdg6LayoutAction(e){
 const l=S.match.live,side=e.side;
 for(const p of l.players){
   let [ox,oy]=FDG6_FORM[p.i];let x=fdg6HomeX(p.team,ox)+(p.team===side?(side===0?8:-8):(side===0?-5:5));
   p.tx=clamp(x+fdg6Rand(-6,6),4,96);p.ty=clamp(oy+fdg6Rand(-9,9),6,94);
 }
 let carrier=l.players[side*11+(e.hero?fdgHeroIndex():FDG6_NUM.indexOf(e.number))];
 if(carrier){carrier.tx=e.x;carrier.ty=e.y;}
 l.ball.fx=l.ball.x;l.ball.fy=l.ball.y;
 l.ball.tx=(e.kind==='shot'||e.kind==='direct'||e.kind==='penalty'||e.kind==='cross'||e.kind==='corner')&&e.result!=='cross'&&e.result!=='wide'?fdg6GoalX(side):e.x;
 l.ball.ty=e.kind==='shot'||e.kind==='penalty'||e.kind==='direct'?clamp(50+fdg6Rand(-17,17),33,67):e.y;
 l.ball.start=l.clock;l.ball.end=l.clock+(e.result==='goal'?.39:.26);
 l.action={event:e,applied:false,revealAt:l.ball.end};
}
function fdg6Apply(e){
 const m=S.match,l=m.live,our=l.stats[e.side],their=l.stats[fdg6Other(e.side)],p=S.player;
 const own=e.side===0,hero=own&&e.hero&&fdg6HeroLive(e.t),name=own?S.club.name:m.opp,other=own?m.opp:S.club.name;
 const heroName=hero?p.name:`el ${FDG6_NAMES[FDG6_NUM.indexOf(e.number)]||'atacante'} (${e.number})`;
 l.possession[e.side]+=e.kind==='pass'?fdg6Rand(1.6,3.4):1;
 if(e.passes){our.attempts+=e.passes;our.passes+=e.completed||e.passes;}
 if(e.kind==='pass'&&hero)m.stats.passes+=Math.min(e.completed||e.passes,5);
 if(e.kind==='restart')fdg6Feed(e,`${name} saca desde el círculo central.`, 'set');
 if(e.kind==='tackle'){our.tackles++;if(!own&&fdg6HeroLive(e.t)&&['DFC','LI','LD','MCD','MC'].includes(p.pos)&&Math.random()<.25)m.stats.tackles++;}
 if(e.kind==='offside'){our.offsides++;fdg6Feed(e,`Fuera de juego de ${name}. El árbitro interrumpe el ataque.`,'ref');}
 if(e.kind==='foul'){
   their.fouls++;
   const severity=e.result==='yellow'?' Tarjeta amarilla.':e.result==='red'?' ¡Tarjeta roja directa!':'';
   if(e.result==='yellow')their.yellow++;
   if(e.result==='red')their.red++;
   fdg6Feed(e,`Falta ${e.inBox?'dentro del área ':''}sobre un jugador de ${name}.${severity}`,'ref');
   if(!own&&fdg6HeroLive(e.t)&&e.result!=='foul'&&Math.random()<.18){if(e.result==='red') {m.sentOff=true;m.exitMinute=Math.ceil(e.t);}else{m.stats.yellow++;if(m.stats.yellow>=2){m.sentOff=true;m.exitMinute=Math.ceil(e.t);}}}
 }
 if(e.kind==='indirect'){our.indirect++;fdg6Feed(e,`${name} reanuda con una falta indirecta.`,'set');}
 if(e.kind==='direct'){our.direct++;fdg6Feed(e,`Falta directa a favor de ${name}.`,'set');}
 if(e.kind==='corner'){our.corners++;fdg6Feed(e,`Córner para ${name}: el balón llega al área.`,'set');}
 if(e.kind==='penalty'){our.penalties++;fdg6Feed(e,`¡PENALTI para ${name}! El lanzador prepara la carrera.`,'set');}
 if(['cross','corner','direct'].includes(e.kind)&&e.result==='cross'){our.attempts+=1;if(Math.random()<.72)our.passes++;fdg6Feed(e,`${name} ${e.kind==='corner'?'pone el córner':e.kind==='direct'?'cuelga la falta':'envía un centro'} al área, pero despeja la defensa.`,'info');}
 const shot=['shot','penalty','direct','corner','cross'].includes(e.kind)&&e.result!=='cross';
 if(shot){
  our.shots++;our.xg+=e.xg;
  if(e.result==='saved'||e.result==='goal')our.on++;
  if(e.result==='saved')their.saves++;
  if(e.result==='blocked')their.blocks++;
  if(own&&hero&&p.pos!=='POR')m.stats.shots++;
  if(e.result==='goal'){
    our.goals++;if(own)m.scoreUs++;else m.scoreThem++;
    let heroCredit='';
    // Event-owned credits: penalties and direct free kicks NEVER create assists.
    // V10 attaches the actual scorer and assister to the preceding action.
    if(e.v10){
      if(own&&p.pos!=='POR'&&e.scorerHero===true){m.stats.goals++;heroCredit=`${p.name} marca. `;}
      else if(own&&p.pos!=='POR'&&e.assistHero===true&&e.kind==='shot'){m.stats.assists++;heroCredit=`Asistencia de ${p.name}. `;}
    }else if(hero&&p.pos!=='POR'){
      if(Math.random()<.58&&['DC','EI','ED','MCO'].includes(p.pos)){m.stats.goals++;heroCredit=`${p.name} marca. `;}
      else if(!['penalty','direct'].includes(e.kind)&&Math.random()<.48){m.stats.assists++;heroCredit=`Asistencia de ${p.name}. `;}
    }else if(own&&fdg6HeroLive(e.t)&&!['penalty','direct'].includes(e.kind)&&Math.random()<.14&&p.pos!=='POR'){m.stats.assists++;heroCredit=`Asistencia de ${p.name}. `;}
    fdg6Feed(e,`¡¡GOOOL DE ${name.toUpperCase()}!! ${heroCredit}${e.kind==='penalty'?'Transforma el penalti.':e.kind==='direct'?'El lanzamiento directo entra en la portería.':'El balón termina dentro de la red.'}`,'goal');
    FDG6.slowUntil=performance.now()+1700;l.goalFlashUntil=performance.now()+1600;l.lastGoalTeam=name;
  }else if(e.result==='saved'){
    if(!own&&fdg6HeroLive(e.t)&&p.pos==='POR'){m.stats.saves++;fdg6Feed(e,`¡PARADÓN de ${p.name}! Evita el gol de ${name}.`,'hero');}
    else if(e.xg>.18||e.kind==='penalty')fdg6Feed(e,`Ocasión de ${name}: el portero interviene y detiene el balón.`,'chance');
  }else if(e.result==='blocked'&&e.xg>.15)fdg6Feed(e,`Remate de ${name} bloqueado por la defensa.`,'chance');
  else if(e.result==='wide'&&e.xg>.14)fdg6Feed(e,`El remate de ${name} se marcha fuera.`,'chance');
 }
 if(l.feed[0]?.type==='goal'&&own||m.stats.goals||m.stats.assists)fdgUpdateRating();
 // Ratings evolve slowly; occasional setbacks should not outweigh a full game.
 if(fdg6HeroLive(e.t)&&!hero&&Math.random()<.16){m.stats.passes++;}
}
function fdg6EndHalf(){const l=S.match.live;l.clock=45;l.half=true;l.paused=true;l.action=null;fdg6Feed({t:45},'DESCANSO. El árbitro manda a los jugadores a vestuarios.','half');persist();fdg6Sync(true);}
function fdg6ContinueHalf(){let l=S?.match?.live;if(!l||!l.half||l.done)return;l.half=false;l.paused=false;l.clock=45.03;fdg6Feed({t:45},'Empieza la segunda parte.','half');persist();fdg6Sync(true);fdg6Resume();}
function fdg6Conclude(){let m=S.match,l=m.live;if(l.done)return;l.clock=90;l.done=true;l.paused=true;l.half=false;l.action=null;m.minute=90;
 fdgUpdateRating();fdg6Feed({t:90},`FINAL · ${S.club.name} ${m.scoreUs} – ${m.scoreThem} ${m.opp}`,'half');fdg6Stop();persist();fdg6Sync(true);}
function fdg6Advance(mins){
 const l=S.match.live;if(l.half||l.done)return;const oldClock=l.clock;
 const goal=Math.min(90,l.clock+mins);
 const cap=oldClock<45&&goal>=45?45:goal;
 while(l.idx<l.events.length&&l.events[l.idx].t<=cap){
  const e=l.events[l.idx];if(l.clock<45&&e.t>=45){fdg6EndHalf();return}
  if(!l.action){l.clock=Math.max(l.clock,e.t);fdg6LayoutAction(e);}
  if(cap>=l.action.revealAt){fdg6Apply(e);l.action=null;l.idx++;}
  else break;
 }
 if(!l.half&&!l.done){l.clock=Math.max(l.clock,cap);
  if(oldClock<45&&goal>=45){fdg6EndHalf();return}
  if(l.clock>=90){fdg6Conclude();return}
 }
}
function fdg6Frame(now){
 FDG6.raf=0;const l=S?.match?.live;if(!l||l.engine!==6||l.done||S.view!=='match')return;
 const dt=Math.min(.12,Math.max(0,(now-FDG6.stamp)/1000));FDG6.stamp=now;
 if(!l.paused){
  let speed=l.speed;
  if(l.mode==='highlights')speed=(l.action?.event?.result==='goal'||l.action?.event?.kind==='penalty'||l.action?.event?.kind==='foul'&&l.action?.event?.result==='red')?2.3:13;
  if(performance.now()<FDG6.slowUntil)speed=Math.min(speed,2);
  fdg6Advance(dt*0.3*speed);
  if(Math.floor(l.clock/6)>l.lastSave){l.lastSave=Math.floor(l.clock/6);persist();}
 }
 fdg6Paint(dt);
 if(now-FDG6.lastDom>260){fdg6Sync(false);FDG6.lastDom=now;}
 if(!l.done)FDG6.raf=requestAnimationFrame(fdg6Frame);
}
function fdg6Paint(dt){
 let el=document.getElementById('fdg-pitch'),l=S?.match?.live;
 if(!el||!l||l.engine!==6)return;const ctx=el.getContext('2d');if(!ctx)return;
 const W=900,H=500,pad=27,X=x=>pad+x*(W-2*pad)/100,Y=y=>pad+y*(H-2*pad)/100;
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#12603d';ctx.fillRect(0,0,W,H);
 for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#166c46':'#19754e';ctx.fillRect(pad+i*(W-pad*2)/12,pad,(W-2*pad)/12,H-pad*2);}
 ctx.strokeStyle='#c4f4d099';ctx.lineWidth=2;ctx.strokeRect(pad,pad,W-pad*2,H-pad*2);ctx.beginPath();ctx.moveTo(W/2,pad);ctx.lineTo(W/2,H-pad);ctx.stroke();ctx.beginPath();ctx.arc(W/2,H/2,53,0,Math.PI*2);ctx.stroke();
 for(let k=0;k<2;k++){let left=k===0,x=left?pad:W-pad;ctx.strokeRect(left?x:x-118,H/2-116,118,232);ctx.strokeRect(left?x:x-41,H/2-62,41,124);ctx.fillStyle='#e8f6eb';ctx.fillRect(left?x-13:x,H/2-34,13,68);}
 const eased=1-Math.exp(-dt*3.5),seconds=performance.now()/1000;
 for(const z of l.players){z.x+=(z.tx-z.x)*eased;z.y+=(z.ty-z.y)*eased;let drift=l.paused?0:1.4,x=X(z.x+Math.sin(seconds*1.30+z.i*1.25+z.team)*drift),y=Y(z.y+Math.cos(seconds*1.10+z.i*.93+z.team)*drift*.55),hero=z.team===0&&z.i===fdgHeroIndex()&&fdg6HeroLive(l.clock);
   ctx.beginPath();ctx.arc(x+1.5,y+2,11.8,0,7);ctx.fillStyle='#06281777';ctx.fill();
   if(hero){ctx.beginPath();ctx.arc(x,y,17.4,0,7);ctx.lineWidth=3;ctx.strokeStyle='#ffef80';ctx.stroke()}
   ctx.beginPath();ctx.arc(x,y,11.2,0,7);ctx.fillStyle=z.team===0?'#ccf47f':'#fbab8f';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=z.team===0?'#27452c':'#803e38';ctx.stroke();ctx.fillStyle='#10251d';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 11px system-ui';ctx.fillText(z.n,x,y+.4);
 }
 const b=l.ball,prog=b.end>b.start?clamp((l.clock-b.start)/(b.end-b.start),0,1):1;
 const smooth=prog*prog*(3-2*prog);b.x=b.fx+(b.tx-b.fx)*smooth;b.y=b.fy+(b.ty-b.fy)*smooth;
 const bx=X(b.x+(!l.action&&!l.paused?Math.sin(seconds*1.4)*.9:0)),by=Y(b.y+(!l.action&&!l.paused?Math.cos(seconds*1.5)*.65:0));ctx.beginPath();ctx.arc(bx,by,5.3,0,7);ctx.fillStyle='white';ctx.fill();ctx.lineWidth=1.7;ctx.strokeStyle='#183528';ctx.stroke();
 if(performance.now()<(l.goalFlashUntil||0)){ctx.fillStyle='rgba(251,238,139,.9)';ctx.font='900 26px system-ui';ctx.textAlign='center';ctx.fillText('¡GOOOL!',W/2,65);}
}
function fdg6Toggle(){let l=S?.match?.live;if(!l||l.done||l.half)return;l.paused=!l.paused;fdg6Sync(true);}
function fdg6Speed(n){let l=S?.match?.live;if(!l)return;l.speed=n;l.mode='full';persist();fdg6Sync(true);}
function fdg6Mode(mode){let l=S?.match?.live;if(!l)return;l.mode=mode;persist();fdg6Sync(true);}
function fdg6Skip(){let l=S?.match?.live;if(!l||l.done)return;if(l.half){fdg6ContinueHalf();return;}while(l.idx<l.events.length){let e=l.events[l.idx];l.clock=e.t;fdg6Apply(e);l.idx++;}fdg6Conclude();fdg6Paint(0.09);}
function fdg6Close(){let l=S?.match?.live;if(!l||!l.done)return;fdg6Stop();finishMatch(true);}
function fdg6StatsHtml(){let m=S.match,l=m.live,a=m.home?l.stats[0]:l.stats[1],b=m.home?l.stats[1]:l.stats[0];let poss=l.possession.reduce((x,y)=>x+y,0);let left=Math.round(100*(m.home?l.possession[0]:l.possession[1])/poss);let rows=[['Posesión',left+'%',100-left+'%'],['Remates',a.shots,b.shots],['A puerta',a.on,b.on],['xG',a.xg.toFixed(2),b.xg.toFixed(2)],['Pases acertados',a.passes,b.passes],['Precisión de pase',a.attempts?Math.round(100*a.passes/a.attempts)+'%':'—',b.attempts?Math.round(100*b.passes/b.attempts)+'%':'—'],['Córners',a.corners,b.corners],['Faltas cometidas',a.fouls,b.fouls],['Fueras de juego',a.offsides,b.offsides],['Faltas directas',a.direct,b.direct],['Faltas indirectas',a.indirect,b.indirect],['Penaltis lanzados',a.penalties,b.penalties],['Amarillas',a.yellow,b.yellow],['Rojas',a.red,b.red]];
 return rows.map(([label,lv,rv])=>`<div class="fdg-statrow"><b>${lv}</b><span>${label}</span><b>${rv}</b></div>`).join('');}
function fdg6Highlights(){let l=S.match.live;const latest=l.feed.filter(e=>e.type!=='goal'&&['hero','chance','ref','half','set'].includes(e.type)).slice(0,8);return [...(l.goals||[]),...latest].sort((a,b)=>b.minute-a.minute).slice(0,14).map(e=>`<div class="fdg-feed-line ${e.type}"><span>${e.minute}'</span><p>${esc(e.text)}</p></div>`).join('')||'<p class="micro">Esperando las primeras ocasiones.</p>';}
function fdg6HeroHtml(){let m=S.match,l=m.live,s=m.stats;let mins=m.enter<0?0:Math.max(0,Math.floor(l.clock)-m.enter);if(m.sentOff&&m.exitMinute)mins=Math.min(mins,m.exitMinute-m.enter);return `<div class="fdg-hero-grid">${[['Minutos',mins],['Nota',mins?m.rating.toFixed(1):'—'],['Goles',s.goals],['Asist.',s.assists],['Pases',s.passes],['Remates',s.shots],['Recup.',s.tackles],['Paradas',s.saves]].map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>`;}
function fdg6Sync(force){let m=S?.match,l=m?.live;if(!l||l.engine!==6||S.view!=='match')return;
 const el=id=>document.getElementById(id);let q=el('fdg-clock');if(q)q.textContent=`${Math.floor(l.clock)}'`;
 q=el('fdg-progress-fill');if(q)q.style.width=(100*l.clock/90)+'%';
 q=el('fdg-score');if(q)q.textContent=m.home?`${m.scoreUs} : ${m.scoreThem}`:`${m.scoreThem} : ${m.scoreUs}`;
 q=el('fdg-teamstats');if(q)q.innerHTML=fdg6StatsHtml();q=el('fdg-herostats');if(q)q.innerHTML=fdg6HeroHtml();q=el('fdg-feed');if(q)q.innerHTML=fdg6Highlights();
 q=el('fdg-pause');if(q)q.textContent=l.paused?'▶ Reanudar':'Ⅱ Pausa';
 q=el('fdg-stage');if(q)q.textContent=l.done?'FINAL':l.half?'DESCANSO':l.clock<45?'PRIMERA PARTE':'SEGUNDA PARTE';
 q=el('fdg-halftime');if(q)q.hidden=!l.half;q=el('fdg-final');if(q)q.hidden=!l.done;
 q=el('fdg-skip');if(q)q.hidden=l.done;
 q=el('fdg6-current');if(q){const f=l.feed[0];q.textContent=f?`${f.minute}' · ${f.text}`:'El partido está en marcha.';q.classList.toggle('goal',f?.type==='goal');}
 document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('selected',l.mode==='full'&&+b.dataset.speed===l.speed));
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===l.mode));
}
function fdg6LiveView(){const m=S.match,p=S.player;
 if(!m||!m.started||m.live?.engine!==6)return fdgV5View();
 const l=m.live;
 return `<div class="fdg-live-page fdg6-page"><div class="v4-viewhead fdg-live-heading"><div><span class="v4-kicker">JORNADA ${S.round+1} · RETRANSMISIÓN SIMULADA</span><h1>El partido, desde dentro.</h1><p>5 minutos a velocidad normal. La simulación genera las estadísticas a partir de las jugadas.</p></div>${v4Tag(m.enter<0?'NO CONVOCADO':m.enter>l.clock?`BANQUILLO · ${m.enter}'`:'SEGUIMIENTO EN VIVO')}</div><section class="v4-panel fdg-live-stadium">${fdgScore()}<div class="fdg-timebar"><b id="fdg-clock">${Math.floor(l.clock)}'</b><div class="fdg-progress"><span id="fdg-progress-fill" style="width:${l.clock/90*100}%"></span></div><small id="fdg-stage">${l.done?'FINAL':l.half?'DESCANSO':l.clock<45?'PRIMERA PARTE':'SEGUNDA PARTE'}</small></div><div class="fdg-canvas-wrap"><canvas id="fdg-pitch" width="900" height="500" aria-label="Simulación de fútbol con jugadores, números, pelota y acciones" role="img"></canvas><div id="fdg6-current" class="fdg6-current">El partido está en marcha.</div><div class="fdg-legend"><span><i class="fdg-dot home"></i>${esc(S.club.name)}</span><span><i class="fdg-dot away"></i>${esc(m.opp)}</span><span><i class="fdg-ring"></i>Tu jugador</span></div></div><div class="fdg6-overlay" id="fdg-halftime" ${l.half?'':'hidden'}><div class="v4-kicker">45' · DESCANSO</div><h3>Primera parte completada</h3><p>Revisa el marcador, los remates y el xG antes de volver al campo.</p><button class="btn" onclick="Game.halfContinue()">▶ Jugar la segunda parte</button></div><div class="fdg6-overlay" id="fdg-final" ${l.done?'':'hidden'}><div class="v4-kicker">90' · FINAL</div><h3>El encuentro ha terminado</h3><p>Las jugadas y las estadísticas están cerradas. Puedes consultar el acta.</p><button class="btn" onclick="Game.liveClose()">Ver acta y prensa →</button></div><div class="fdg-controlbar"><div class="fdg-speed"><button id="fdg-pause" onclick="Game.livePause()" ${l.done||l.half?'disabled':''}>${l.paused?'▶ Reanudar':'Ⅱ Pausa'}</button>${[1,2,4].map(n=>`<button class="${l.mode==='full'&&l.speed===n?'selected':''}" data-speed="${n}" onclick="Game.liveSpeed(${n})">${n}×</button>`).join('')}<button data-mode="highlights" class="${l.mode==='highlights'?'selected':''}" onclick="Game.liveMode('highlights')">Momentos importantes</button></div><div class="fdg-endcontrols"><button id="fdg-skip" class="tinybtn" onclick="Game.liveSkip()" ${l.done?'hidden':''}>Resultado directo »</button></div></div></section><div class="fdg-live-columns"><section class="v4-panel"><div class="v4-paneltitle"><h3>Estadísticas colectivas</h3>${v4Tag('Acciones registradas')}</div><div id="fdg-teamstats">${fdg6StatsHtml()}</div></section><section class="v4-panel"><div class="v4-paneltitle"><h3>${esc(p.name)} · ${p.pos}</h3>${v4Tag('Tu futbolista')}</div><div id="fdg-herostats">${fdg6HeroHtml()}</div><div class="v4-paneltitle" style="margin-top:15px"><h3>Jugadas destacadas</h3></div><div class="fdg-live-feed" id="fdg-feed">${fdg6Highlights()}</div></section></div></div>`;
}
const fdgV5StopLive=fdgStopTicker;
const fdgV5Hero=fdgHeroActive;
fdgHeroActive=fdg6HeroLive;
v4MatchScreen=fdg6LiveView;
window.Game.playMatch=fdg6Start;
window.Game.livePause=function(){const l=S?.match?.live;return l?.engine===6?fdg6Toggle():fdgTogglePause();};
window.Game.liveSpeed=function(n){const l=S?.match?.live;return l?.engine===6?fdg6Speed(n):fdgSpeed(n);};
window.Game.liveSkip=function(){const l=S?.match?.live;return l?.engine===6?fdg6Skip():fdgSkip();};
window.Game.liveClose=function(){const l=S?.match?.live;return l?.engine===6?fdg6Close():fdgClose();};
window.Game.liveMode=fdg6Mode;
window.Game.halfContinue=fdg6ContinueHalf;
// Old v5 live matches in an existing save continue on the legacy visualizer.
if(S?.match?.live?.engine===6&&S.view==='match'&&!S.match.live.done){render();fdg6Resume();}