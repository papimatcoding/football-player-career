/* FUERA DE GUIÓN v5 — visual match simulation. No choices during the 90 minutes. */
'use strict';
const FDG_LIVE = {timer:null,last:0,frames:0,paint:0};
const FDG_FORMATION=[ [6,50,1],[24,16,2],[23,38,4],[23,62,5],[24,84,3],
  [46,20,6],[47,50,8],[46,80,10],[72,18,7],[76,50,9],[72,82,11] ];
const FDG_LIVE_ACTIONS={
  pass:['Mueven el balón con paciencia','Encuentran una línea de pase','Cambian la orientación del juego','Superan la primera presión'],
  shot:['Remate desde la frontal','Disparo cruzado desde dentro del área','Cabeceo tras centro lateral','Ocasión a la contra','Remate a balón parado'],
  save:['El portero evita el gol','Gran estirada del guardameta','El disparo acaba en las manos del portero'],
  miss:['El remate se marcha fuera','El balón roza el poste','El defensa tapona el disparo'],
  foul:['Falta en el centro del campo','El árbitro señala una infracción','El juego se detiene tras una disputa'],
  corner:['Saque de esquina a favor','El despeje provoca un córner']
};
function fdgStartLive(){
  const m=S?.match;if(!m||m.started)return;
  m.started=true; m.minute=0;m.tactics=m.tactics||'balance';
  m.live={clock:0,speed:1,paused:false,done:false,next:2.1,poss:[1,1],stats:[{shots:0,on:0,passes:0,corners:0,fouls:0,xg:0},{shots:0,on:0,passes:0,corners:0,fouls:0,xg:0}],feed:[{minute:0,text:'¡Comienza el partido!',type:'normal'}],ball:{x:50,y:50,tx:50,ty:50,side:0},carrier:0,players:[],turn:0,weather:pick(['Despejado','Nublado','Lluvia ligera','Viento suave']),lastSave:0};
  // Teams always have eleven numbered markers; your player has a visible ring when on the pitch.
  for(let team=0;team<2;team++)for(let i=0;i<11;i++){
    const [xx,yy,n]=FDG_FORMATION[i];let x=team===0?xx:100-xx;
    m.live.players.push({team,i,n,x,y:yy,tx:x,ty:yy});
  }
  persist();render();fdgResumeTicker();
}
function fdgResumeTicker(){
  if(FDG_LIVE.timer){clearInterval(FDG_LIVE.timer);FDG_LIVE.timer=null;}
  if(!S?.match?.live||S.match.live.done||S.view!=='match')return;
  FDG_LIVE.last=performance.now();
  FDG_LIVE.timer=setInterval(fdgTick,80);
}
function fdgStopTicker(){if(FDG_LIVE.timer){clearInterval(FDG_LIVE.timer);FDG_LIVE.timer=null;}}
function fdgHeroIndex(){let p=S.player.pos;return {POR:0,DFC:3,LI:1,LD:4,MCD:6,MC:5,MCO:7,EI:8,DC:9,ED:10}[p]??6}
function fdgHeroActive(min){return S.match.enter>=0&&min>=S.match.enter&&!S.match.sentOff}
function fdgEmit(text,kind='normal'){
  const l=S.match.live;l.feed.unshift({minute:Math.min(90,Math.floor(l.clock)),text,type:kind});l.feed=l.feed.slice(0,32);
}
function fdgSimMoment(){
  const m=S.match,l=m.live,minute=l.clock,p=S.player;
  const boost=clamp((S.club.power-getClub(m.opp).power)/48,-.22,.22)+(m.home?.055:-.055);
  const side=Math.random()<(.52+boost)?0:1;const onBall=l.stats[side],defence=l.stats[1-side];
  l.turn++; l.poss[side]++;onBall.passes+=int(7,19);
  const attacking=side===0,active=fdgHeroActive(minute),role=v4Role(),heroIsPart=attacking&&active&&Math.random()<(role==='ATA'?.36:role==='MED'?.35:role==='DEF'?.15:.045);
  let px=side===0?rand(47,91):rand(9,53),py=rand(12,88),carrier=int(5,10);
  l.carrier=side*11+carrier;
  for(const z of l.players){
    let normal=FDG_FORMATION[z.i];let attackX=side===z.team?(z.team===0?9:-9):(z.team===0?-6:6);
    let x=(z.team===0?normal[0]:100-normal[0])+attackX;
    z.tx=clamp(x+rand(-5,5),5,95);z.ty=clamp(normal[1]+rand(-9,9),7,93);
  }
  const carrierP=l.players[l.carrier];carrierP.tx=px;carrierP.ty=py;l.ball.tx=px;l.ball.ty=py;l.ball.side=side;
  if(heroIsPart&&p.pos!=='POR'){
    const hero=l.players[fdgHeroIndex()]; hero.tx=clamp(px+(attacking?-3:3),5,95);hero.ty=clamp(py+rand(-8,8),7,93);
    m.stats.passes+=int(1,4);
  }
  // Pressing, recycling, fouls, and shot creation are independent match actions.
  const event=Math.random();
  if(event<.10){onBall.fouls++;fdgEmit(`${attacking?S.club.name:m.opp}: ${pick(FDG_LIVE_ACTIONS.foul)}`);if(!attacking&&active&&role==='DEF'&&Math.random()<.15){m.stats.tackles++;}return}
  if(event<.30){
    if(attacking&&active&&['MCD','DFC','LI','LD','MC'].includes(p.pos)&&Math.random()<.42){m.stats.tackles++;fdgEmit(`${p.name} intercepta y recupera la pelota`,'hero')}
    else if(attacking&&heroIsPart){fdgEmit(`${p.name} participa en la circulación de ${S.club.name}`,'hero')}
    else fdgEmit(`${attacking?S.club.name:m.opp}: ${pick(FDG_LIVE_ACTIONS.pass)}`);
    return;
  }
  // Approximate xG per shot based on shot location and power.
  const xg=clamp(rand(.04,.30)+(side===0?boost:-boost)*.11,.03,.42);
  onBall.shots++;onBall.xg+=xg;
  if(Math.random()<.17){onBall.corners++;fdgEmit(`${attacking?S.club.name:m.opp}: ${pick(FDG_LIVE_ACTIONS.corner)}`)}
  const hit=Math.random()<clamp(.40+xg*.55,.26,.73);const scored=hit&&Math.random()<clamp(xg*1.45,.04,.62);
  if(hit)onBall.on++;
  if(attacking&&heroIsPart&&role==='ATA')m.stats.shots++;
  const shooter=attacking&&heroIsPart&&role==='ATA'&&Math.random()<.61;
  const creator=attacking&&heroIsPart&&!shooter&&Math.random()<.52;
  if(scored){
    if(attacking){m.scoreUs++;if(shooter){m.stats.goals++;fdgEmit(`¡GOOOL! ${p.name} define la jugada de ${S.club.name}`,'goal')}else if(creator){m.stats.assists++;fdgEmit(`¡GOOOL de ${S.club.name}! Asistencia de ${p.name}`,'goal')}else fdgEmit(`¡GOOOL! Marca ${S.club.name}`,'goal')}
    else{m.scoreThem++;if(active&&p.pos==='POR'&&Math.random()<.12)m.stats.errors++;fdgEmit(`¡GOL de ${m.opp}! La jugada termina dentro de la red`,'rivalgoal')}
    l.ball.tx=attacking?100:0;l.ball.ty=50;
  }else if(hit){
    if(!attacking&&active&&p.pos==='POR'){m.stats.saves++;fdgEmit(`¡PARADÓN de ${p.name}! Desbarata la ocasión de ${m.opp}`,'hero')}
    else fdgEmit(`${attacking?S.club.name:m.opp}: ${pick(FDG_LIVE_ACTIONS.save)}`);
  }else fdgEmit(`${attacking?S.club.name:m.opp}: ${pick(FDG_LIVE_ACTIONS.miss)}`);
  if(attacking&&active&&role==='ATA'&&Math.random()<.09)m.stats.errors++;
  fdgUpdateRating();
}
function fdgUpdateRating(){
 const m=S.match,st=m.stats,l=m.live;if(!fdgHeroActive(l.clock)){if(m.enter<0)m.rating=0;return}
 const played=Math.max(1,l.clock-(m.enter||0));
 const pen=(st.errors||0)*.34;
 m.rating=clamp(6.35+st.goals*1.15+st.assists*.75+st.saves*.15+st.tackles*.13+Math.min(.33,st.passes*.007)-pen+(m.scoreUs>m.scoreThem?.18:m.scoreUs<m.scoreThem?-.12:0)+rand(-.07,.07),5.1,9.9);
}
function fdgTick(){
 const m=S?.match,l=m?.live;if(!m||!l||l.done||S.view!=='match'){fdgStopTicker();return;}
 const now=performance.now(),dt=Math.min(.28,(now-FDG_LIVE.last)/1000);FDG_LIVE.last=now;
 if(!l.paused){
   l.clock=Math.min(90,l.clock+dt*l.speed*1.4);
   while(l.clock>=l.next&&!l.done){fdgSimMoment();l.next+=rand(1.65,3.75)}
   if(l.clock>=90){fdgConclude();}
 }
 for(const z of l.players){z.x+=(z.tx-z.x)*Math.min(1,dt*2.4);z.y+=(z.ty-z.y)*Math.min(1,dt*2.4)}
 l.ball.x+=(l.ball.tx-l.ball.x)*Math.min(1,dt*3.2);l.ball.y+=(l.ball.ty-l.ball.y)*Math.min(1,dt*3.2);
 FDG_LIVE.frames++;if(FDG_LIVE.frames%3===0)fdgDraw();
 if(FDG_LIVE.frames%5===0)fdgSyncDOM();
 if(Math.floor(l.clock/5)>l.lastSave){l.lastSave=Math.floor(l.clock/5);persist()}
}
function fdgConclude(){
 const m=S.match,l=m.live;if(l.done)return;l.clock=90;l.done=true;l.paused=true;m.minute=90;
 fdgUpdateRating();fdgEmit(`Final del encuentro: ${S.club.name} ${m.scoreUs} - ${m.scoreThem} ${m.opp}`,'fulltime');
 fdgStopTicker();persist();fdgSyncDOM();
}
function fdgTogglePause(){const l=S?.match?.live;if(!l||l.done)return;l.paused=!l.paused;FDG_LIVE.last=performance.now();fdgSyncDOM()}
function fdgSpeed(x){const l=S?.match?.live;if(!l)return;l.speed=x;fdgSyncDOM()}
function fdgSkip(){const l=S?.match?.live;if(!l)return;while(l.next<90){l.clock=l.next;fdgSimMoment();l.next+=rand(1.65,3.75)}l.clock=90;fdgConclude();fdgDraw();fdgSyncDOM()}
function fdgClose(){if(!S?.match?.live?.done)return;fdgStopTicker();finishMatch(true)}
function fdgScore(){const m=S.match;return `<div class="fdg-live-score"><b>${esc(m.home?S.club.name:m.opp)}</b><strong id="fdg-score">${m.home?m.scoreUs:m.scoreThem} : ${m.home?m.scoreThem:m.scoreUs}</strong><b>${esc(m.home?m.opp:S.club.name)}</b></div>`}
function fdgLiveView(){
 let m=S.match,u=upcoming(),p=S.player;
 if(!m)return `<div class="v4-viewhead"><div><span class="v4-kicker">DÍA DE PARTIDO · J${S.round+1}</span><h1>Las luces se encienden.</h1><p>Un encuentro que verás avanzar en directo, sin interrumpir el juego para tomar decisiones.</p></div></div><section class="v4-panel"><div class="v4-bigfixture"><b>${esc(u?.home?S.club.name:u?.opp||'—')}</b><strong>VS</strong><b>${esc(u?.home?u?.opp||'—':S.club.name)}</b></div><div class="v4-compactmetrics"><div><small>Tu estado</small><b>${Math.round(p.fitness)}%</b></div><div><small>Confianza</small><b>${Math.round(p.trust)}</b></div><div><small>Rival</small><b>${u?getClub(u.opp).power:'—'}</b></div></div><button class="btn" onclick="Game.startMatch()">Consultar convocatoria →</button></section>`;
 if(!m.started){return `<div class="v4-viewhead"><div><span class="v4-kicker">PREVIA · J${S.round+1}</span><h1>${m.enter===0?'Sales de titular.':m.enter>0?'Empiezas en el banquillo.':'No entras en la convocatoria.'}</h1><p>El equipo saldrá al campo de todos modos. Tu rol depende del entrenador, la forma y las últimas actuaciones.</p></div></div><section class="v4-panel">${fdgScore()}<div class="fdg-intro"><span>${p.pos} · ${overall(p)} OVR</span><span>${m.enter===0?'Titular':m.enter>0?`Suplente · previsión ${m.enter}'`:'Sin minutos'}</span></div><h3>Consigna para el vestuario</h3><div class="fdg-tactics"><button class="${m.tactics==='calm'?'selected':''}" onclick="Game.tactic('calm')">Controlar y tener paciencia</button><button class="${m.tactics==='balance'?'selected':''}" onclick="Game.tactic('balance')">Equilibrio</button><button class="${m.tactics==='attack'?'selected':''}" onclick="Game.tactic('attack')">Presionar y atacar</button></div><p class="micro">La consigna afecta ligeramente al riesgo colectivo. Durante el encuentro solo observarás.</p><button class="btn" onclick="Game.playMatch()">▶ Ver el partido en vivo</button><button class="tinybtn" style="margin-left:8px" onclick="Game.back()">Volver</button></section>`}
 const l=m.live;
 if(!l){return `<section class="v4-panel">Preparando la retransmisión... <button class="btn" onclick="Game.playMatch()">Comenzar</button></section>`}
 const playing=fdgHeroActive(l.clock);const noMinutes=m.enter<0;
 return `<div class="fdg-live-page"><div class="v4-viewhead fdg-live-heading"><div><span class="v4-kicker">EN DIRECTO · ${esc(S.club.name)} · ${esc(leagueLabel())}</span><h1>La jornada, en movimiento.</h1><p>${l.done?'90 minutos disputados. Revisa el partido y continúa cuando quieras.':'El reloj avanza y el equipo juega sin interrupciones.'}</p></div>${v4Tag(l.done?'FINAL':noMinutes?'SIN CONVOCAR':playing?'EN EL CÉSPED':`EN EL BANQUILLO · ${m.enter}'`)}</div><section class="v4-panel fdg-live-stadium">${fdgScore()}<div class="fdg-timebar"><b id="fdg-clock">${Math.floor(l.clock)}'</b><div class="fdg-progress"><span id="fdg-progress-fill" style="width:${l.clock/90*100}%"></span></div><small>${esc(l.weather)} · ${m.home?'Local':'Visitante'}</small></div><div class="fdg-canvas-wrap"><canvas id="fdg-pitch" width="900" height="520" role="img" aria-label="Campo de fútbol animado con 22 jugadores, balón y tu futbolista marcado"></canvas><div class="fdg-legend"><span><i class="fdg-dot home"></i>${esc(S.club.name)}</span><span><i class="fdg-dot away"></i>${esc(m.opp)}</span><span><i class="fdg-ring"></i>Tu jugador</span></div></div><div class="fdg-controlbar"><div class="fdg-speed"><button id="fdg-pause" onclick="Game.livePause()" ${l.done?'disabled':''}>${l.paused?'▶ Continuar':'Ⅱ Pausa'}</button>${[1,2,4].map(x=>`<button class="${l.speed===x?'selected':''}" data-speed="${x}" onclick="Game.liveSpeed(${x})">${x}×</button>`).join('')}</div><div class="fdg-endcontrols"><button class="tinybtn" ${l.done?'disabled':''} onclick="Game.liveSkip()">Ir al final »</button>${l.done?'<button class="btn" onclick="Game.liveClose()">Ver acta y resumen →</button>':''}</div></div></section><div class="fdg-live-columns"><section class="v4-panel"><div class="v4-paneltitle"><h3>Estadísticas de los equipos</h3><span class="v4-badge">En vivo</span></div><div id="fdg-teamstats">${fdgStatMarkup()}</div></section><section class="v4-panel"><div class="v4-paneltitle"><h3>${esc(p.name)} · ${p.pos}</h3>${v4Tag(!fdgHeroActive(l.clock)?'Sin nota':`Nota ${m.rating.toFixed(1)}`)}</div><div id="fdg-herostats">${fdgHeroMarkup()}</div><div class="fdg-live-feed" id="fdg-feed">${fdgFeedMarkup()}</div></section></div></div>`;
}
function fdgStatMarkup(){const l=S.match.live; if(!l)return '';const [my,enemy]=l.stats;const [u,r]=S.match.home?[my,enemy]:[enemy,my];const total=l.poss[0]+l.poss[1]||1;const pc=Math.round(100*(S.match.home?l.poss[0]:l.poss[1])/total);const rows=[['Posesión',pc+'%',(100-pc)+'%'],['Disparos',u.shots,r.shots],['A puerta',u.on,r.on],['xG estimado',u.xg.toFixed(2),r.xg.toFixed(2)],['Pases',u.passes,r.passes],['Córners',u.corners,r.corners],['Faltas',u.fouls,r.fouls]];return rows.map(([name,left,right])=>`<div class="fdg-statrow"><b>${left}</b><span>${name}</span><b>${right}</b></div>`).join('')}
function fdgHeroMarkup(){const m=S.match,l=m.live,mins=m.enter<0?0:Math.max(0,Math.floor(l.clock)-m.enter),st=m.stats;return `<div class="fdg-hero-grid">${[['Minutos',mins],['Nota',mins?m.rating.toFixed(1):'—'],['Goles',st.goals],['Asistencias',st.assists],['Pases',st.passes],['Remates',st.shots],['Recuperaciones',st.tackles],['Paradas',st.saves]].map(([x,y])=>`<div><small>${x}</small><b>${y}</b></div>`).join('')}</div>`}
function fdgFeedMarkup(){return S.match.live.feed.slice(0,8).map(e=>`<div class="fdg-feed-line ${e.type}"><span>${e.minute}'</span><p>${esc(e.text)}</p></div>`).join('')}
function fdgSyncDOM(){const m=S?.match,l=m?.live;if(!l||S.view!=='match')return;const q=id=>document.getElementById(id);if(q('fdg-clock'))q('fdg-clock').textContent=Math.floor(l.clock)+"'";if(q('fdg-progress-fill'))q('fdg-progress-fill').style.width=l.clock/90*100+'%';if(q('fdg-score'))q('fdg-score').textContent=m.home?`${m.scoreUs} : ${m.scoreThem}`:`${m.scoreThem} : ${m.scoreUs}`;if(q('fdg-teamstats'))q('fdg-teamstats').innerHTML=fdgStatMarkup();if(q('fdg-herostats'))q('fdg-herostats').innerHTML=fdgHeroMarkup();if(q('fdg-feed'))q('fdg-feed').innerHTML=fdgFeedMarkup();if(q('fdg-pause'))q('fdg-pause').textContent=l.paused?'▶ Continuar':'Ⅱ Pausa';document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.speed)===l.speed));if(l.done&&!q('fdg-done')){ // Re-render only on the final whistle, preserving position via app.js.
 render();fdgDraw();}}
function fdgDraw(){let canvas=document.getElementById('fdg-pitch'),l=S?.match?.live;if(!canvas||!l)return;const ctx=canvas.getContext('2d');if(!ctx)return;const W=900,H=520,pad=34,scx=x=>pad+x*(W-2*pad)/100,scy=y=>pad+y*(H-2*pad)/100;
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#186e4c';ctx.fillRect(0,0,W,H);
 for(let j=0;j<10;j++){ctx.fillStyle=j%2?'#237d56':'#206f4d';ctx.fillRect(pad+j*(W-2*pad)/10,pad,(W-2*pad)/10,H-2*pad)}
 ctx.strokeStyle='#b5dfc380';ctx.lineWidth=2;ctx.strokeRect(pad,pad,W-2*pad,H-2*pad);ctx.beginPath();ctx.moveTo(W/2,pad);ctx.lineTo(W/2,H-pad);ctx.stroke();ctx.beginPath();ctx.arc(W/2,H/2,55,0,7);ctx.stroke();ctx.beginPath();ctx.arc(W/2,H/2,3,0,7);ctx.fillStyle='#dcf5de';ctx.fill();
 for(const x of [pad,W-pad]){ctx.strokeRect(x===pad?pad:W-pad-120,H/2-120,120,240);ctx.strokeRect(x===pad?pad:W-pad-40,H/2-65,40,130);ctx.fillStyle='#ffffff90';ctx.fillRect(x===pad?pad-10:W-pad, H/2-40,10,80)}
 for(const z of l.players){let x=scx(z.x),y=scy(z.y),hero=z.team===0&&z.i===fdgHeroIndex()&&fdgHeroActive(l.clock);
   ctx.beginPath();ctx.arc(x+1.5,y+2,13,0,7);ctx.fillStyle='#06281990';ctx.fill();if(hero){ctx.beginPath();ctx.arc(x,y,17,0,7);ctx.lineWidth=3;ctx.strokeStyle='#fffad0';ctx.stroke()}
   ctx.beginPath();ctx.arc(x,y,11.5,0,7);ctx.fillStyle=z.team===0?'#d4ff77':'#ffb879';ctx.fill();ctx.strokeStyle=z.team===0?'#0f422d':'#61371c';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#10231f';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(hero?String(S.player.pos==='POR'?1:z.n):String(z.n),x,y+.8);
 }
 ctx.beginPath();ctx.arc(scx(l.ball.x),scy(l.ball.y),5.5,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#11271d';ctx.stroke();
}