/* FUERA DE GUIÓN 10 — event-first football broadcast.
 * A finite sequence of possessions is the ONE source of both box score and animation.
 * 2D storyboard, not a FIFA-like physical simulation. Saves before v10 are not migrated.
 */
'use strict';
const FDG10={version:10,rosterCache:new Map()};
const f10Clamp=(x,a=0,b=100)=>Math.min(b,Math.max(a,x));
const f10Lerp=(a,b,t)=>a+(b-a)*t;
const f10Ease=t=>t*t*(3-2*t);
const f10Pick=a=>a[Math.floor(Math.random()*a.length)];
const f10Rand=(a,b)=>a+(b-a)*Math.random();
const f10Dir=s=>s===0?1:-1;
const f10XY=(x,y)=>({x:f10Clamp(x,1,99),y:f10Clamp(y,2,98)});
const f10Rel=(s,x,y)=>f10XY(s===0?x:100-x,y);
const F10_SHIRTS=[1,2,4,5,3,6,8,10,7,9,11];
function f10ChooseActor(side,x,y,kind,heroChance=.13){
 const attack=x*(side===0?1:-1)+(side===0?0:100);
 let pool=kind==='penalty'?[9]:kind==='corner'?[8,10]:attack<35?[1,2,3,4,5,6]:attack<65?[5,6,7,1,4,8,10]:[8,9,10,7,5];
 const i=fdgHeroIndex(),candidate=pool.includes(i)&&side===0&&fdg6HeroLive(f10BuildTime||0)&&Math.random()<heroChance;
 return candidate?i:f10Pick(pool);
}
let f10BuildTime=0;
// A possession uses coherent from -> to points, rather than independently random event coordinates.
function f10Generate(){
 const list=[];let t=.30,side=Math.random()<.51?0:1,ball=f10Rel(side,24,50),lastSide=side;
 const strength=(S.club.power-getClub(S.match.opp).power)/120;
 const heroN=fdg9HeroNumber();
 const push=(kind,a,b,props={},dt=.39)=>{
  if(t>=89.3||list.length>=290)return null;
  f10BuildTime=t;
  const actor=props.actor??f10ChooseActor(side,a.x,a.y,kind,kind==='pass'?.18:.22);
  const e={id:list.length,t:+t.toFixed(3),side,kind,from:{...a},to:{...b},x:+a.x.toFixed(2),y:+a.y.toFixed(2),result:props.result||'completed',number:actor===fdgHeroIndex()&&side===0?heroN:F10_SHIRTS[actor],hero:side===0&&actor===fdgHeroIndex()&&fdg6HeroLive(t),actorIndex:actor,v10:true,...props};
  e.hero=side===0&&e.actorIndex===fdgHeroIndex()&&fdg6HeroLive(t);
  list.push(e);t+=dt;ball={...b};lastSide=side;return e;
 };
 // start in two consecutive halves (field direction is flipped on screen, not in data).
 let kickoff=true,pendingRestart=false,secondHalf=false;
 while(t<88.8&&list.length<280){
  if(!secondHalf&&t>=45){secondHalf=true;side=1-side;ball=f10XY(50,50);kickoff=true;pendingRestart=false;t=Math.max(45.23,t);}
  const advantage=f10Clamp(.5+strength+(S.match.home?.027:-.027),.25,.75);
  if(!kickoff){side=Math.random()<(side===0?advantage:1-advantage)*.25+.26?1-side:side;}
  if(kickoff||pendingRestart){
   const start=f10XY(50,50),end=f10Rel(side,46,49+f10Rand(-6,6));
   push('restart',start,end,{result:'kickoff',actor:9,deadball:true},.44);
   pendingRestart=false;kickoff=false;
  }else if(lastSide!==side){
   // Possession changes where the ball was lost (no pitch teleportation).
   push('tackle',ball,ball,{result:'won',actor:6},.34);
  }
  let progress=side===0?ball.x:100-ball.x;
  if(progress>79||progress<15){
   // A dead-ball or goalkeeper restart is explicitly marked: the pitch is not in live play.
   const restart=f10Rel(side,28+f10Rand(-4,7),f10Rand(26,74));
   push('restart',restart,f10Rel(side,34,f10Rand(30,70)),{result:'goal-kick',deadball:true},.52);
   progress=35;
  }
  const steps=2+Math.floor(f10Rand(0,3.6));
  for(let i=0;i<steps&&t<88.3;i++){
   const from={...ball},xp=side===0?from.x:100-from.x;
   const dx=f10Rand(5,13),destination=f10Rel(side,f10Clamp(xp+dx,11,88),f10Clamp(from.y+f10Rand(-17,17),8,92));
   const actor=f10ChooseActor(side,from.x,from.y,'pass',.23);
   push('pass',from,destination,{passes:1,completed:1,actor,result:'completed',receiverIndex:(xp<48?[5,6,7]:[8,9,10,7]).filter(i=>i!==actor)[Math.floor(Math.random()*(xp<48?[5,6,7]:[8,9,10,7]).filter(i=>i!==actor).length)]},f10Rand(.30,.48));
  }
  if(t>=88.3)break;
  const from={...ball},xp=side===0?from.x:100-from.x;
  const r=Math.random();
  if(r<.085){
   push('offside',from,from,{result:'whistle',actor:9},.44);
   side=1-side;
   push('indirect',from,f10Rel(side,Math.max(23,100-xp+5),f10Clamp(from.y+f10Rand(-6,6),7,93)),{deadball:true,actor:5},.50);
   continue;
  }
  if(r<.20){
   const hard=Math.random();let result=hard<.02?'red':hard<.22?'yellow':'foul';
   const foul=push('foul',from,from,{result,actor:6,defenderIndex:Math.floor(f10Rand(1,11))},.38);
   const isPen=xp>84&&Math.random()<.12;
   const kind=isPen?'penalty':xp>68&&Math.random()<.50?'direct':'indirect';
   const dest=kind==='indirect'?f10Rel(side,f10Clamp(xp+8,12,90),f10Clamp(from.y+f10Rand(-10,10),8,92)):f10Rel(side,99,50+f10Rand(-7,7));
   if(kind==='indirect'){push(kind,from,dest,{result:'completed',actor:6,deadball:true},.46);continue;}
   const scorer=kind==='penalty'?9:f10Pick([7,8,9,10]);const xg=kind==='penalty'?.77:.08;
   const outcome=Math.random()<xg*.86?'goal':f10Pick(['saved','wide','blocked','cross']);
   push(kind,kind==='penalty'?f10Rel(side,87,50):from,outcome==='goal'?f10Rel(side,99,50+f10Rand(-4,4)):outcome==='wide'?f10Rel(side,99,11+Math.random()*20):dest,{result:outcome,xg:outcome==='cross'?0:xg,actor:scorer,scorerHero:side===0&&scorer===fdgHeroIndex()&&fdg6HeroLive(t),assistHero:false,deadball:true},.55);
   if(outcome==='goal'){side=1-side;pendingRestart=true;}else if(outcome==='saved'||outcome==='wide') {side=1-side;ball=f10Rel(side,12,50);pendingRestart=false;}
   continue;
  }
  if(r<.30&&xp>57){
   // Corner is a restart, not automatically a shot. A separate header can follow.
   const corner=f10Rel(side,99,from.y<50?2:98),target=f10Rel(side,88,f10Rand(35,65));
   push('corner',corner,target,{result:'cross',actor:f10Pick([7,8,10]),deadball:true},.52);
   if(Math.random()<.34){
    const scorer=f10Pick([2,3,8,9,10]),xg=.09,result=Math.random()<.095?'goal':f10Pick(['saved','wide','blocked']);
    push('shot',target,result==='goal'?f10Rel(side,99,50+f10Rand(-4,4)):f10Rel(side,98,50+f10Rand(-20,20)),{result,xg,actor:scorer,scorerHero:side===0&&scorer===fdgHeroIndex()&&fdg6HeroLive(t),assistHero:side===0&&fdg6HeroLive(t)&&list.at(-1)?.hero&&list.at(-1)?.actorIndex!==scorer},.44);
    if(result==='goal'){side=1-side;pendingRestart=true;}
   }else{side=1-side;}
   continue;
  }
  if(r<.76&&xp>53){
   let scorer=f10Pick([7,8,9,10,5]),quality=f10Clamp(.04+(xp-54)*.0045+(1-Math.abs(from.y-50)/65)*.035,.025,.31);
   const outcome=Math.random()<quality*(1+(side===0?strength:-strength))?'goal':Math.random()<.46?'saved':Math.random()<.43?'blocked':'wide';
   let target= outcome==='goal'?f10Rel(side,99,50+f10Rand(-3,3)):outcome==='blocked'?f10Rel(side,Math.min(98,xp+5),from.y+f10Rand(-9,9)):f10Rel(side,99,outcome==='wide'?f10Pick([f10Rand(10,29),f10Rand(72,90)]):f10Rand(35,65));
   const last=list.at(-1),assistHero=side===0&&last?.kind==='pass'&&last?.side===side&&last.hero&&last.actorIndex!==scorer&&fdg6HeroLive(t);
   push('shot',from,target,{result:outcome,xg:+quality.toFixed(3),actor:scorer,scorerHero:side===0&&scorer===fdgHeroIndex()&&fdg6HeroLive(t),assistHero},.48);
   if(outcome==='goal'){side=1-side;pendingRestart=true;}
   else if(outcome==='wide'||outcome==='saved'){side=1-side;ball=f10Rel(side,10,50);}
   else if(outcome==='blocked')side=1-side;
   continue;
  }
  // Controlled possession loss: the new owner receives the ball where it was intercepted.
  side=1-side;
  t+=f10Rand(.11,.30);
 }
 return list.filter(e=>e.t<89.9);
}
// Preserve old match events. Only new fixtures use the chain-based ledger.
fdg6Generate=f10Generate;
// ---------- Nationality-aware, stable XI and bench ----------
const F10_COUNTRIES=['España','Dinamarca','Alemania','Inglaterra','Francia','Portugal','Italia','Países Bajos','Suecia','Noruega','Polonia','Brasil','Argentina','Marruecos','Nigeria','Egipto','Japón','Turquía','Sudáfrica','Uruguay','Croacia','Bélgica'];
const F10_EXTRAS={
 dk:[['Søren','Mads','Malthe','Valdemar','Villads','Noah','August','Kasper','Sebastian','Morten'],['Holm','Bach','Madsen','Berg','Kjær','Thomsen','Bruun','Vestergaard']],
 es:[['Iván','Unai','Gerard','Pol','Guillem','Ander','David','Manu','Mario','Óscar'],['Alcoba','Ramos','Castro','Molina','Serrano','Gil','Alonso','Méndez']],
 en:[['Alfie','Ethan','Liam','Mason','Logan','Thomas','Oscar','Freddie'],['Harrison','Parker','Green','Turner','Roberts','Carter']],
 de:[['Finn','Johannes','Anton','Kilian','Jan','Mats','Lennard'],['Richter','Koch','Wolf','Schwarz','Neumann','Zimmermann']],
 fr:[['Kylian','Adrien','Clément','Nolan','Malo','Sacha','Elias'],['Leroy','Lemaire','Caron','Chevalier','Robert','Garnier']],
 pt:[['Afonso','Rúben','Francisco','Dinis','Nuno','Vasco'],['Mendes','Pinto','Gomes','Lopes','Teixeira']],
 se:[['Olle','Hugo','Ludvig','Nils','Vilgot','Melvin'],['Svensson','Bergström','Lindström','Lundberg']],
 br:[['Vitor','Caio','Arthur','Enzo','Davi','Renan'],['Nascimento','Barbosa','Moreira','Rocha']],
 ma:[['Soufiane','Rayan','Nabil','Abdel','Ismail','Nassim'],['Bouzidi','Tazi','Benkirane','Chafik']],
 ng:[['Tobi','Chidi','Uche','Olamide','Ikechukwu'],['Onyeka','Akinola','Adeyemi','Ogunleye']]
};

const F10_LOCALES={
 no:{first:['Erling','Martin','Kristoffer','Sander','Henrik','Marius','Tobias','Eirik','Sverre','Sondre','Håkon','Magnus'],last:['Hansen','Johansen','Olsen','Larsen','Andresen','Solberg','Aas','Berg','Haugen','Nilsen']},
 hr:{first:['Luka','Ivan','Matej','Marko','Nikola','Josip','Ante','Dino','Lovro','Filip','Petar'],last:['Horvat','Kovačić','Babić','Marić','Perić','Jurić','Novak','Janković','Radić','Božić']},
 sn:{first:['Mamadou','Ousmane','Ibrahima','Cheikh','Pape','Moussa','Abdoulaye','Idrissa','Amadou','Lamine'],last:['Diop','Sarr','Ndiaye','Ba','Faye','Fall','Diallo','Sow','Gueye','Cissé']},
 ko:{first:['Min-jun','Ji-ho','Hyun-woo','Seung-ho','Jun-seo','Jae-min','Do-yun','Woo-jin','Jun-ho'],last:['Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Han','Lim']},
 cz:{first:['Jan','Jakub','Tomáš','Adam','Václav','Filip','Matěj','Ondřej','Martin','Pavel'],last:['Novák','Svoboda','Dvořák','Černý','Procházka','Kučera','Veselý','Horák','Král']},
 ar:{first:['Omar','Abdullah','Fahad','Khalid','Saud','Nasser','Mohammed','Yasser','Salem','Faisal'],last:['Al-Qahtani','Al-Harbi','Al-Dosari','Al-Shehri','Al-Ghamdi','Al-Otaibi','Al-Hassan','Al-Salem']}
};
function f10Locale(nation){return ({'Noruega':'no','Croacia':'hr','Senegal':'sn','Corea del Sur':'ko','Chequia':'cz','Arabia Saudí':'ar'})[nation]||fdg9Language(nation)}

function f10Nationality(local,seed,i){
 const blends={'Dinamarca':['Suecia','Noruega','Alemania','España','Francia','Nigeria','Polonia'],España:['Argentina','Uruguay','Marruecos','Francia','Portugal','Brasil','Nigeria'],Inglaterra:['Irlanda','Francia','Nigeria','España','Alemania','Portugal'],Alemania:['Polonia','Turquía','Dinamarca','Francia','España'],Francia:['Marruecos','Bélgica','Portugal','Senegal','España'],Portugal:['Brasil','España','Francia'],Italia:['Argentina','Brasil','España','Francia']};
 let mix=blends[local]||['España','Brasil','Francia','Alemania','Nigeria','Argentina'];
 const x=fdg9R(seed+i*19,47),localWeight=.64;
 return x<localWeight?local:mix[Math.floor(fdg9R(seed+i*31,9)*mix.length)];
}
function f10Flag(country){return FLAGS[country]||({'Nigeria':'🇳🇬','Uruguay':'🇺🇾','Croacia':'🇭🇷','Senegal':'🇸🇳','Irlanda':'🇮🇪','Bélgica':'🇧🇪','Noruega':'🇳🇴','Polonia':'🇵🇱'}[country])||'🌍'}
function f10Roster(team,country){
 const seed=fdg9SeedName(team+'|'+S.year+'|'+S.seasonNo),used=new Set(),usedFirst=new Set();
 return Array.from({length:16},(_,i)=>{
  let nation=f10Nationality(country,seed,i),lang=f10Locale(nation),extras=F10_EXTRAS[lang]||[[],[]],native=F10_LOCALES[lang];
  let first=[...(native?.first||FDG9_FIRST[lang]||FDG9_FIRST.es),...extras[0]],last=[...(native?.last||FDG9_LAST[lang]||FDG9_LAST.es),...extras[1]];
  let label='',given='';for(let a=0;a<100;a++){
   const f=first[(Math.floor(fdg9R(seed+i*311,4)*first.length)+a)%first.length];
   const l=last[(Math.floor(fdg9R(seed+i*137,17)*last.length)+a*3)%last.length];
   label=f+' '+l;given=f;
   if(!used.has(label)&&(!usedFirst.has(f)||a>=first.length))break;
  }
  used.add(label);usedFirst.add(given);return {name:label,nation,flag:f10Flag(nation),number:([1,2,4,5,3,6,8,10,7,9,11,12,14,15,17,18][i]),position:(['POR','LD','DFC','DFC','LI','MC','MCD','MC','ED','DC','EI','POR','DFC','MC','ED','DC'][i])};
 });
}
function f10Lineups(){
 const m=S.match;if(!m)return null;
 if(!m.v10Roster){const themCountry=META?.[m.opp]?.country||S.club.country||'España';
  m.v10Roster=[f10Roster(S.club.name,S.club.country),f10Roster(m.opp,themCountry)];}
 const arr=m.v10Roster;const heroIdx=fdgHeroIndex(),shirt=fdg9HeroNumber();
 if(m.enter===0){arr[0][heroIdx]={...arr[0][heroIdx],name:S.player.name,nation:S.player.nationality||'España',flag:f10Flag(S.player.nationality||'España'),number:shirt,position:S.player.pos,hero:true};}
 else{arr[0][14]={...arr[0][14],name:S.player.name,nation:S.player.nationality||'España',flag:f10Flag(S.player.nationality||'España'),number:shirt,position:S.player.pos,hero:true};}
 // No duplicate number in the same club's matchday roster.
 for(let i=0;i<arr[0].length;i++)if(!arr[0][i].hero&&arr[0][i].number===shirt)arr[0][i].number=18;
 if(arr[0].filter(p=>p.number===18).length>1){for(let i=11;i<arr[0].length;i++)if(!arr[0][i].hero&&arr[0][i].number===18)arr[0][i].number=29;}
 return arr;
}
fdg9LineupHTML=function(){let m=S?.match;if(!m||m.started)return'';let rosters=f10Lineups();if(!rosters)return'';
 const teams=m.home?[rosters[0],rosters[1]]:[rosters[1],rosters[0]];const names=m.home?[S.club.name,m.opp]:[m.opp,S.club.name];
 let html=teams.map((team,k)=>`<div class="fdg9-team-roster"><div class="fdg9-roster-team"><span class="fdg9-clubdisc ${k?'rival':''}">⚽</span><b>${esc(names[k])}</b><small>4-3-3</small></div>${team.slice(0,11).map(p=>`<div class="fdg9-roster-row ${p.hero?'hero':''}"><span class="fdg9-roster-no">${p.number}</span><span class="fdg10-flag" title="${esc(p.nation)}">${p.flag}</span><span class="fdg9-roster-name">${esc(p.name)}</span><small>${p.position}</small></div>`).join('')}</div>`).join('');
 const sub=m.enter>0?`<div class="fdg9-lineup-bench"><strong>${f10Flag(S.player.nationality||'España')} ${esc(S.player.name)} · nº ${fdg9HeroNumber()}</strong> · Suplente. Entrada prevista: ${m.enter}'</div>`:m.enter<0?`<div class="fdg9-lineup-bench">${esc(S.player.name)} no participa hoy.</div>`:'';
 return `<section class="v4-panel fdg9-lineups"><div class="fdg9-lineup-top"><span class="v4-kicker">ALINEACIONES · JORNADA ${S.round+1}</span><h3>Los protagonistas</h3><p>Plantillas ficticias con nacionalidades y dorsales persistentes durante la temporada.</p></div><div class="fdg9-rosters">${html}</div>${sub}</section>`;
};
// ---------- The renderer: visible possession stages, no random side-to-side ball warp ----------
function f10Snapshot(l){const es=l.events||[],clock=l.clock;let index=0;
 while(index<es.length-1&&es[index+1].t<=clock)index++;
 const e=es[index],next=es[index+1];if(!e)return null;
 const gap=Math.max(.25,(next?.t??e.t+.6)-e.t),u=f10Clamp((clock-e.t)/gap,0,1);
 const from=e.from||f10XY(e.x,e.y),to=e.to||from,setup=e.deadball||['penalty','direct','indirect','corner','restart'].includes(e.kind);
 const start=setup?.29:.09,end=setup?.77:.81;
 const act=f10Clamp((u-start)/(end-start),0,1),t=f10Ease(act);
 const ball={x:f10Lerp(from.x,to.x,t),y:f10Lerp(from.y,to.y,t)};
 const play=!setup||u>=start;let label=(FDG6_KINDS[e.kind]||'Jugada');
 const roster=S?.match?.v10Roster?.[e.side]||[];
 const actor=roster[e.actorIndex]?.name?.split(' ').at(-1)||'Jugador';
 if(e.kind==='pass')label='Pase de '+actor+(e.receiverIndex!==undefined&&roster[e.receiverIndex]?' a '+roster[e.receiverIndex].name.split(' ').at(-1):'');
 if(e.kind==='shot')label='Remate de '+actor+(e.result==='saved'?' · detiene el portero':e.result==='blocked'?' · bloqueado':'');
 if(e.kind==='tackle')label='Recuperación de '+(e.side===0?'tu equipo':'el rival');
 if(e.kind==='penalty')label='Penalti · '+actor;
 if(e.kind==='corner')label='Córner · '+actor;
 if(e.kind==='direct')label='Falta directa · '+actor;
 if(e.result==='goal'&&u>.77)label='⚽ ¡GOOOL!';
 return {e,u,play,ball,from,to,act,setup,label,side:e.side,clock};
}
function f10Shape(l,s){const e=s.e,ball=s.ball,dir=f10Dir(e.side),teams=[[],[]];
 for(let team=0;team<2;team++)for(let i=0;i<11;i++){
  const [fx,fy]=FDG6_FORM[i];const sideDir=f10Dir(team),att=team===e.side;
  let x=(team===0?fx:100-fx)+(ball.x-50)*(i===0?.035:i<5?.22:i<8?.32:.47);
  let y=fy+(ball.y-50)*(i===0?.07:i<5?.23:i<8?.32:.39);
  x+=sideDir*(att?(i>=8?4:i>=5?1:0):i>=8?-3:0);
  if(i===0){x=team===0?4:96;y=50+(ball.y-50)*.08;}
  else if(att){
   // Width, overlaps and late box runs depend on the attack's stage.
   const sweep=Math.sin(s.act*Math.PI);
   if(i>=8){x+=sideDir*7*sweep;y+=(i===8?-7:i===10?7:0)*sweep;}
   else if(i>=5){x+=sideDir*4*sweep;y+=(i===5?-4:i===7?4:0)*sweep;}
   else if(i===1||i===4){x+=sideDir*3.5*sweep;}
  }else if(i>=5){x-=sideDir*2.5*Math.sin(s.act*Math.PI);}
  teams[team][i]=f10XY(x,y);
 }
 const actor=e.actorIndex??fdgHeroIndex();
 const isSet=e.deadball&&['penalty','direct','indirect','corner','restart'].includes(e.kind);
 if(isSet){
  if(e.kind==='penalty'){
   teams[e.side][actor]=f10XY(e.from.x-dir*3.5,50);teams[1-e.side][0]=f10XY(dir===1?97:3,50);
   for(let team=0;team<2;team++)for(let i=1;i<11;i++)if(!(team===e.side&&i===actor))teams[team][i]=f10XY(50+dir*(17+i%3*2),10+(i-1)*8);
  }else if(e.kind==='corner'){
   teams[e.side][actor]=f10XY(e.from.x-dir*1.5,e.from.y<50?4:96);
   for(let team=0;team<2;team++)for(let i=1;i<11;i++)if(!(team===e.side&&i===actor))teams[team][i]=f10XY((dir===1?84:16)+dir*(i%4)*2,12+((i*7)%10)*8);
  }else if(e.kind==='direct'||e.kind==='indirect'){
   teams[e.side][actor]=f10XY(e.from.x-dir*2.6,e.from.y);
   for(let i=1;i<5;i++)teams[1-e.side][i]=f10XY(e.from.x+dir*8,e.from.y+(i-2.5)*4);
  }else if(e.kind==='restart'){
   teams[e.side][9]=f10XY(50-dir*2,50);teams[e.side][6]=f10XY(50-dir*8,50);
  }
 }else{
  // The receiver is ahead of a pass; marker tracks behind, no 22-player swarm.
  teams[e.side][actor]=f10XY(f10Lerp(e.from.x,e.to.x,s.act*.78)-dir*1.2,f10Lerp(e.from.y,e.to.y,s.act*.78));
  const receiver=e.receiverIndex??(actor===9?8:9);
  if(e.kind==='pass'&&receiver!==actor)teams[e.side][receiver]=f10XY(e.to.x+dir*1.2,e.to.y);
  let defenders=[1,2,3,4,5,6,7,8,9,10].sort((a,b)=>Math.hypot(teams[1-e.side][a].x-ball.x,teams[1-e.side][a].y-ball.y)-Math.hypot(teams[1-e.side][b].x-ball.x,teams[1-e.side][b].y-ball.y));
  for(let k=0;k<2;k++){let p=teams[1-e.side][defenders[k]];p.x=f10Lerp(p.x,ball.x-dir*(k?8:4),k?.32:.52);p.y=f10Lerp(p.y,ball.y,k?.32:.52);}
 }
 return teams;
}
// Native canvas dimensions and CSS aspect ratio MUST match. Keeping a square pitch unit avoids squashed players.
function f10Paint(dt){const l=S?.match?.live,canvas=document.getElementById('fdg-pitch');if(!l?.v10||!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;const W=980,H=670;
 if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
 const s=f10Snapshot(l);if(!s)return;let marginX=36,marginY=36,scale=Math.min((W-2*marginX)/105,(H-2*marginY)/68);
 const X=x=>marginX+x/100*105*scale,Y=y=>marginY+y/100*68*scale;
 ctx.fillStyle='#0b2a24';ctx.fillRect(0,0,W,H);let pitchW=105*scale,pitchH=68*scale;
 for(let n=0;n<12;n++){ctx.fillStyle=n%2?'#16744c':'#197e51';ctx.fillRect(marginX+n*pitchW/12,marginY,pitchW/12+.6,pitchH);}
 ctx.strokeStyle='#c9f0dfc9';ctx.lineWidth=1.8;ctx.strokeRect(marginX,marginY,pitchW,pitchH);ctx.beginPath();ctx.moveTo(X(50),Y(0));ctx.lineTo(X(50),Y(100));ctx.stroke();
 ctx.beginPath();ctx.arc(X(50),Y(50),9.15*scale,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(X(50),Y(50),2,0,7);ctx.fillStyle='#e8f9ee';ctx.fill();
 for(const dir of [-1,1]){let left=dir===-1?marginX:marginX+pitchW;
  ctx.strokeRect(dir===-1?left:left-16.5*scale,Y(50)-20.16*scale,16.5*scale,40.32*scale);
  ctx.strokeRect(dir===-1?left:left-5.5*scale,Y(50)-9.16*scale,5.5*scale,18.32*scale);
  ctx.fillStyle='white';ctx.beginPath();ctx.arc(left-dir*11*scale,Y(50),2.5,0,7);ctx.fill();
  ctx.strokeStyle='#b8d7e0';ctx.strokeRect(dir===-1?left-9:left,Y(50)-3.66*scale,9,7.32*scale);ctx.strokeStyle='#c9f0dfc9';
 }
 ctx.save();ctx.beginPath();ctx.rect(marginX,marginY,pitchW,pitchH);ctx.clip();
 const shapes=f10Shape(l,s),step=Math.min(Math.max(dt,0),.05)*21*(l.speed||1);
 if(!l.v10Pos)l.v10Pos=l.players.map(p=>({x:p.x,y:p.y}));
 // Draw all players as proper CIRCLES: no ellipses distorted by CSS scaling.
 for(const p of l.players){const target=shapes[p.team][p.i],state=l.v10Pos[p.team*11+p.i];if(!target)continue;
  const dx=target.x-state.x,dy=target.y-state.y,dist=Math.hypot(dx,dy),move=l.paused?0:Math.min(dist,step);if(dist>0.001){state.x+=dx/dist*move;state.y+=dy/dist*move;}
  const flipped=l.clock>=45.03?100-state.x:state.x,px=X(flipped),py=Y(state.y),hero=p.team===0&&p.i===fdgHeroIndex()&&fdg6HeroLive(l.clock);
  const num=hero?fdg9HeroNumber():F10_SHIRTS[p.i]===fdg9HeroNumber()&&p.team===0?18:F10_SHIRTS[p.i];
  ctx.beginPath();ctx.arc(px+1.2,py+2.8,9.4,0,7);ctx.fillStyle='#03231a88';ctx.fill();
  if(hero){ctx.strokeStyle='#fff5a1';ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,py,15,0,7);ctx.stroke();}
  ctx.beginPath();ctx.arc(px,py,10.5,0,7);ctx.fillStyle=p.team===0?'#e3f29a':'#fda88f';ctx.fill();ctx.lineWidth=1.4;ctx.strokeStyle=p.team===0?'#304b39':'#7d3e32';ctx.stroke();
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 10px system-ui';ctx.fillStyle='#18342a';ctx.fillText(num,px,py+.5);
 }
 if(s.e.kind==='offside'&&s.u>.09){let x=X(l.clock>=45.03?100-s.from.x:s.from.x);ctx.setLineDash([5,6]);ctx.strokeStyle='#ffe88d';ctx.beginPath();ctx.moveTo(x,marginY);ctx.lineTo(x,marginY+pitchH);ctx.stroke();ctx.setLineDash([]);}
 const bx=X(l.clock>=45.03?100-s.ball.x:s.ball.x),by=Y(s.ball.y),lift=s.play?Math.sin(Math.PI*s.act)*(s.e.kind==='shot'||s.e.kind==='corner'?5:2):0;
 ctx.beginPath();ctx.ellipse(bx+2,by+4,5,2,0,0,7);ctx.fillStyle='#051e18aa';ctx.fill();ctx.beginPath();ctx.arc(bx,by-lift,5.2,0,7);ctx.fillStyle='white';ctx.fill();ctx.strokeStyle='#133f2e';ctx.stroke();ctx.restore();
 ctx.fillStyle='#0b3028dd';ctx.beginPath();ctx.roundRect(45,43,Math.min(410,Math.max(155,s.label.length*8+23)),29,8);ctx.fill();ctx.fillStyle='#f3ffec';ctx.font='800 13px system-ui';ctx.textAlign='left';ctx.fillText(s.label,57,62);
 if(s.e.result==='goal'&&s.u>.83){ctx.fillStyle='#dffb8e';ctx.font='900 27px system-ui';ctx.textAlign='center';ctx.fillText('⚽ GOL',W/2,H-35);}
}
const f10OldPaint=fdg6Paint;
fdg6Paint=function(dt){if(S?.match?.live?.v10)return f10Paint(dt);return f10OldPaint(dt);};
const f10OldApply=fdg6Apply;
fdg6Apply=function(e){
 if(e?.v10){
  // Never invent credits: scorer and assist are explicitly attached to a valid open-play action.
  if(['shot','penalty','direct'].includes(e.kind)) e.hero=e.side===0&&e.scorerHero===true;
  e.assistHero=Boolean(e.side===0&&e.assistHero&&e.kind==='shot');
 }
 f10OldApply(e);
};
const f10OldPlay=window.Game.playMatch;
window.Game.playMatch=function(){if(!S?.match||S.match.started)return f10OldPlay();f10Lineups();f10OldPlay();const l=S.match?.live;if(l?.engine===6&&l.v9){l.v10=true;l.v10Version=1;l.v10Pos=l.players.map(p=>({x:p.x,y:p.y}));persist();render();fdg6Resume();}};
const f10OldSync=fdg6Sync;
fdg6Sync=function(force){f10OldSync(force);if(!S?.match?.live?.v10)return;let l=S.match.live,scene=f10Snapshot(l),el=document.getElementById('fdg8-action');if(el&&scene)el.textContent=scene.label;const title=document.querySelector('.fdg-live-heading .v4-kicker');if(title)title.textContent=title.textContent.replace(/SIMULADOR [0-9]+\.0/,'SIMULADOR 10.0');};
// In older CSS an unrelated giant '10' was hard-coded in the hero background.
const f10OldRender=render;
render=function(){f10OldRender();const hero=document.querySelector('.hero');if(hero&&S?.player){hero.style.setProperty('--hero-shirt',`"${fdg9HeroNumber()}"`);} };
if(S?.match?.live?.v10&&S.view==='match'){render();fdg6Resume();}
window.FDG10={generate:f10Generate,snapshot:f10Snapshot,roster:f10Roster,shape:f10Shape,version:10};
// Optional nationality for new careers; existing saves default to Spain.
const f10OldSetup=setup;
setup=function(){
 let html=f10OldSetup();
 const label='<div class="field"><label>Pie dominante</label>';
 const nationalities=['España','Dinamarca','Inglaterra','Francia','Alemania','Portugal','Italia','Brasil','Argentina','Marruecos','Nigeria','Uruguay','Japón','Países Bajos','Suecia'];
 if(html.includes(label))html=html.replace(label,`<div class="field"><label for="fdg10-nationality">Nacionalidad</label><select id="fdg10-nationality">${nationalities.map(n=>`<option value="${n}">${f10Flag(n)} ${n}</option>`).join('')}</select></div>`+label);
 return html;
};
const f10OldCreate=window.Game.create;
window.Game.create=function(){const nation=document.getElementById('fdg10-nationality')?.value||'España';f10OldCreate();if(S?.player){S.player.nationality=nation;persist();}};
// One match-specific squad is the source for lineups and goalscorer labels.
fdg9RosterNames=function(team,country){
 if(S?.match){const r=f10Lineups();if(r){if(team===S.club.name)return r[0].map(x=>x.name);if(team===S.match.opp)return r[1].map(x=>x.name);}}
 return f10Roster(team,country).map(x=>x.name);
};
if(!S)render();
// A trustworthy text-only broadcast is always available when the 2D view is not useful.
const f10OldMatchScreen=v4MatchScreen;
v4MatchScreen=function(){let html=f10OldMatchScreen();if(!S?.match?.live?.v10)return html;
 html=html.replace('class="fdg-controlbar"',`class="fdg10-mode-controls"><button class="tinybtn" onclick="Game.v10View()" id="fdg10-view-toggle">${S.match.live.v10Text?'⚽ Ver campo 2D':'☷ Solo narración'}</button><span>Las jugadas y estadísticas comparten la misma acta.</span></div><div class="fdg-controlbar"`);
 html=html.replace('<canvas id="fdg-pitch"','<div class="fdg10-text-story" id="fdg10-text-story"></div><canvas id="fdg-pitch"');
 return html;
};
window.Game.v10View=function(){let l=S?.match?.live;if(!l?.v10)return;l.v10Text=!l.v10Text;persist();render();fdg6Resume();};
const f10PriorSync=fdg6Sync;
fdg6Sync=function(force){f10PriorSync(force);const l=S?.match?.live;if(!l?.v10)return;
 const wrap=document.querySelector('.fdg-canvas-wrap');wrap?.classList.toggle('fdg10-text-mode',!!l.v10Text);
 const story=document.getElementById('fdg10-text-story');if(story&&l.v10Text){
  const items=l.feed.filter(e=>e.type==='goal'||e.type==='chance'||e.type==='ref'||e.type==='half').slice(0,13);
  story.innerHTML=items.map(e=>`<div class="fdg10-story-row"><strong>${e.minute}'</strong><span>${esc(e.text)}</span></div>`).join('')||'<div class="fdg10-empty">Partido en curso. Sin ocasiones importantes.</div>';
 }
};