/* FUERA DE GUIÓN 9 — continuous broadcast presentation.
 * Compatible with previous serialized matches. New fixtures are tagged v9;
 * the V6 event/accounting engine still owns goals, cards, xG, results and saves.
 * Visual coordinates are world-normalized (0..100), mirrored after half-time.
 */
'use strict';
const FDG9={frames:0,lastNow:0,lastStage:'',lastHero:false};
const fdg9C=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const fdg9Mix=(a,b,t)=>a+(b-a)*fdg9C(t,0,1);
const fdg9Smooth=t=>{t=fdg9C(t,0,1);return t*t*(3-2*t)};
const fdg9P=(x,y)=>({x,y});
const fdg9D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const fdg9Current=()=>!!(S?.match?.live?.engine===6&&S.match.live.v9===true);
const fdg9R=(seed,salt)=>{const v=Math.sin((seed+37)*91.17+salt*17.29)*43758.545;return v-Math.floor(v)};
const fdg9SeedName=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0};
const FDG9_FIRST={
 es:['Álvaro','Iker','Hugo','Sergio','Jorge','Alejandro','Martí','Joel','Pau','Adrián','Eric','Nico','Marc','Raúl','Dani','Rubén'],
 dk:['Mikkel','Andreas','Emil','Frederik','Magnus','Oliver','Rasmus','Lasse','Christian','Mathias','Jonas','Victor','Nikolaj','Tobias'],
 de:['Lukas','Jonas','Leon','Felix','Maximilian','Julian','Tim','Florian','Niklas','Timo','Paul','Moritz','Lennart'],
 en:['Oliver','Harry','Jacob','George','Noah','James','Charlie','Leo','Archie','William','Jack','Alfie','Sam'],
 fr:['Lucas','Hugo','Enzo','Théo','Mathis','Noah','Raphaël','Antoine','Maxime','Baptiste','Yanis'],
 pt:['João','Diogo','Gonçalo','Tiago','Rafael','Miguel','Tomás','André','Martim','Rodrigo'],
 it:['Luca','Matteo','Andrea','Marco','Davide','Alessandro','Niccolò','Federico','Gabriele'],
 nl:['Daan','Sem','Luuk','Bram','Thijs','Jesse','Koen','Joris','Sven','Milan'],
 se:['Erik','Lukas','Emil','Oscar','Albin','Viktor','Anton','Axel','Simon','Elias'],
 br:['Gabriel','Matheus','Lucas','Pedro','Bruno','Rafael','Guilherme','João','Thiago','Felipe'],
 ar:['Julián','Tomás','Franco','Mateo','Santiago','Facundo','Lautaro','Nicolás','Agustín','Enzo'],
 tr:['Emre','Arda','Kerem','Burak','Yusuf','Mehmet','Can','Oğuz','Mert','Barış'],
 jp:['Haruto','Ren','Sota','Yuto','Riku','Kaito','Daiki','Takumi','Yuma','Hiroto'],
 ma:['Youssef','Achraf','Amine','Omar','Hamza','Ayoub','Ilyas','Anas','Bilal','Zakaria'],
 eg:['Ahmed','Mohamed','Omar','Karim','Mahmoud','Mostafa','Youssef','Amr','Hossam','Ibrahim','Tarek'],
 za:['Sipho','Thabo','Siyabonga','Lethabo','Kabelo','Bongani','Tshepo','Sibusiso','Themba','Lebohang','Andile'],
 pl:['Jakub','Piotr','Kacper','Michał','Mateusz','Wojciech','Jan','Filip','Bartosz','Paweł'],
 ng:['Chinedu','Tunde','Emeka','Samuel','Chukwu','Ifeanyi','Daniel','Victor','Musa','Ibrahim']
};
const FDG9_LAST={
 es:['García','López','Martínez','Sánchez','Fernández','Ruiz','Navarro','Vidal','Pérez','Moreno','Soler','Rovira','Torres'],
 dk:['Nielsen','Jensen','Hansen','Andersen','Christensen','Pedersen','Larsen','Rasmussen','Mikkelsen','Poulsen'],
 de:['Müller','Schneider','Schmidt','Weber','Fischer','Klein','Wagner','Becker','Hoffmann','Schulz'],
 en:['Smith','Walker','Brown','Wilson','Taylor','Johnson','White','Hughes','Bennett','Clarke','Evans'],
 fr:['Martin','Bernard','Dubois','Petit','Laurent','Girard','Moreau','Lefebvre','Roux','Faure'],
 pt:['Silva','Santos','Ferreira','Pereira','Costa','Oliveira','Rodrigues','Sousa','Carvalho','Almeida'],
 it:['Rossi','Romano','Conti','Ferrari','Ricci','Marino','Gallo','Moretti','Costa','Rinaldi'],
 nl:['De Jong','Jansen','De Vries','Bakker','Visser','Smit','Mulder','Van Dijk','Bos'],
 se:['Andersson','Johansson','Karlsson','Nilsson','Eriksson','Larsson','Olsson','Lindberg'],
 br:['Silva','Santos','Oliveira','Souza','Costa','Pereira','Lima','Ribeiro','Almeida'],
 ar:['González','Rodríguez','Fernández','López','Martínez','Pérez','Romero','Álvarez','Díaz'],
 tr:['Yılmaz','Kaya','Demir','Çelik','Şahin','Yıldız','Öztürk','Arslan'],
 jp:['Sato','Suzuki','Takahashi','Tanaka','Watanabe','Ito','Yamamoto','Nakamura'],
 ma:['El Amrani','Benali','Bennani','Alaoui','Berrada','El Idrissi','Amrabat','Ziyech'],
 eg:['Hassan','Ibrahim','Fathy','Abdelrahman','Ali','Sayed','Mahmoud','Mostafa','El Sayed','Ashraf'],
 za:['Mokoena','Ndlovu','Mahlangu','Khumalo','Dlamini','Nkosi','Mabena','Zulu','Maseko','Mthembu'],
 pl:['Kowalski','Nowak','Wiśniewski','Zieliński','Lewandowski','Wójcik','Kowalczyk','Kamiński'],
 ng:['Okafor','Eze','Musa','Adebayo','Obi','Balogun','Ibrahim','Okonkwo','Olayinka']
};
function fdg9Language(country){let c=String(country||'').toLowerCase();if(/egipto/.test(c))return'eg';if(/sudáfrica|sudafrica/.test(c))return'za';if(/polonia/.test(c))return'pl';if(/nigeria/.test(c))return'ng';if(/dinamarca/.test(c))return'dk';if(/alemania|austria|suiza/.test(c))return'de';if(/inglaterra|escocia|irlanda|gales|australia|canadá|estados unidos/.test(c))return'en';if(/francia|bélgica/.test(c))return'fr';if(/portugal/.test(c))return'pt';if(/italia/.test(c))return'it';if(/países bajos|holanda/.test(c))return'nl';if(/suecia|noruega|finlandia/.test(c))return'se';if(/brasil/.test(c))return'br';if(/argentina|uruguay|chile|colombia|méxico/.test(c))return'ar';if(/turquía/.test(c))return'tr';if(/japón/.test(c))return'jp';if(/marruecos/.test(c))return'ma';return'es'}
function fdg9HeroNumber(){if(!S?.player)return 10;const p=S.player;if(!Number.isInteger(p.v9Number)||p.v9Number<1||p.v9Number>99){p.v9Number=({POR:1,DFC:4,LI:3,LD:2,MCD:6,MC:8,MCO:10,EI:11,DC:9,ED:7})[p.pos]||10;}return p.v9Number;}
function fdg9RosterNames(teamName,country){const seed=fdg9SeedName(teamName+String(S.seasonNo)+String(S.year));const lang=fdg9Language(country),first=FDG9_FIRST[lang],last=FDG9_LAST[lang];let used=new Set();return Array.from({length:11},(_,i)=>{let t=0,n;do{let n1=first[Math.floor(fdg9R(seed+i*17+t,2)*first.length)],n2=last[Math.floor(fdg9R(seed+i*37+t,11)*last.length)];n=n1+' '+n2;t++;}while(used.has(n)&&t<30);used.add(n);return n;});}
function fdg9LineupData(){const m=S.match;if(!m)return null;const home=m.home?S.club.name:m.opp,away=m.home?m.opp:S.club.name;const rivalCountry=META?.[m.opp]?.country||'España';const baseHome=m.home?S.club.country:rivalCountry;const baseAway=m.home?rivalCountry:S.club.country;let us=fdg9RosterNames(S.club.name,S.club.country),them=fdg9RosterNames(m.opp,rivalCountry);const heroIndex=fdgHeroIndex(),num=fdg9HeroNumber(),nums=FDG6_NUM.slice();if(m.enter===0){us[heroIndex]=S.player.name;}else{us[heroIndex]=us[heroIndex]||'Canterano';}
 if(m.enter===0&&nums[heroIndex]!==num){const collided=nums.indexOf(num);nums[heroIndex]=num;if(collided>=0&&collided!==heroIndex)nums[collided]=18;}
 const shirtUs=m.enter===0?nums:FDG6_NUM.slice(),shirtThem=FDG6_NUM.slice();return {home,away,teams:m.home?[{name:home,people:us,nums:shirtUs,hero:m.enter===0},{name:away,people:them,nums:shirtThem,hero:false}]:[{name:home,people:them,nums:shirtThem,hero:false},{name:away,people:us,nums:shirtUs,hero:m.enter===0}],heroNumber:num};}
function fdg9LineupHTML(){const m=S?.match;if(!m||m.started)return'';let r=fdg9LineupData();if(!r)return'';const positions=['POR','LD','DFC','DFC','LI','MC','MCD','MC','ED','DC','EI'];let tb=(t,j)=>`<div class="fdg9-team-roster"><div class="fdg9-roster-team"><span class="fdg9-clubdisc ${j?'rival':''}">⚽</span><b>${esc(t.name)}</b><small>4-3-3</small></div>${t.people.map((name,i)=>`<div class="fdg9-roster-row ${t.hero&&i===fdgHeroIndex()?'hero':''}"><span class="fdg9-roster-no">${t.nums[i]}</span><span class="fdg9-roster-name">${esc(name)}</span><small>${positions[i]}</small></div>`).join('')}</div>`;
 return `<section class="v4-panel fdg9-lineups"><div class="fdg9-lineup-top"><span class="v4-kicker">ALINEACIONES CONFIRMADAS · JORNADA ${S.round+1}</span><h3>Los protagonistas del encuentro</h3><p>Futbolistas ficticios generados para esta temporada. Posiciones, dorsales y clubes adaptados a la convocatoria.</p></div><div class="fdg9-rosters">${r.teams.map(tb).join('')}</div>${m.enter>0?`<div class="fdg9-lineup-bench">🟨 <strong>${esc(S.player.name)} · nº ${r.heroNumber}</strong> comienza en el banquillo. Entrada prevista: ${m.enter}'.</div>`:m.enter<0?`<div class="fdg9-lineup-bench">${esc(S.player.name)} no disputará minutos esta jornada.</div>`:''}</section>`;}
// The 90-minute event ledger is authoritative. Each pair of adjacent events
// generates a CONTINUOUS connecting possession, never a random-position snap.
function fdg9AttackDir(side){return side===0?1:-1;}
function fdg9Goal(side){return side===0?99:1;}
function fdg9EventEnd(e){const d=fdg9AttackDir(e.side),x=fdg9Goal(e.side),r=fdg9R(e.id,8);
 if(e.kind==='restart')return fdg9P(50+d*4,50);
 if(e.kind==='offside'||e.kind==='foul'||e.kind==='tackle')return fdg9P(e.x,e.y);
 if(['shot','direct','penalty','corner','cross'].includes(e.kind)&&e.result!=='cross'){
  if(e.result==='goal')return fdg9P(x,50+(r-.5)*7);
  if(e.result==='saved')return fdg9P(x-d*4,42+r*16);
  if(e.result==='blocked')return fdg9P(fdg9C(e.x+d*7,2,98),fdg9C(e.y+(r-.5)*17,5,95));
  return fdg9P(x,r<.5?14+r*28:71+r*25);
 }
 if(e.kind==='corner'||e.kind==='cross'||e.kind==='direct')return fdg9P(fdg9C(e.x+d*10,4,96),46+(r-.5)*19);
 if(e.kind==='indirect'||e.kind==='pass')return fdg9P(fdg9C(e.x+d*7,5,95),fdg9C(e.y+(r-.5)*13,5,95));
 return fdg9P(e.x,e.y);
}
function fdg9Actor(e){if(!e)return 9;if(e.hero&&e.side===0&&fdg6HeroLive(e.t))return fdgHeroIndex();const nums=FDG6_NUM;const ni=nums.indexOf(e.number);if(ni>0)return ni;
 return ['shot','penalty','direct'].includes(e.kind)?9:e.kind==='corner'?8:6;}
function fdg9Path(a,b,t,curve=0){let u=fdg9Smooth(t),x=fdg9Mix(a.x,b.x,u),y=fdg9Mix(a.y,b.y,u);return fdg9P(x,y+Math.sin(u*Math.PI)*curve);}
function fdg9Duration(list,i){if(!list[i])return .32;const gap=(list[i+1]?.t??list[i].t+2)-list[i].t;return fdg9C(gap*.67,.12,.40);}
function fdg9Pose(l,clock=l.clock){const list=l.events||[];let idx=0;while(idx<list.length&&list[idx].t+fdg9Duration(list,idx)<clock)idx++;const e=list[idx],prev=idx>0?list[idx-1]:null;const prevEnd=prev?fdg9EventEnd(prev):fdg9P(50,50),prevTime=prev?prev.t+fdg9Duration(list,idx-1):0;let ball=prevEnd,side=e?.side??prev?.side??0,stage='transition',kick=null,kind=e?.kind||'pass',p=0;
 if(!e)return {ball,side:prev?.side??0,stage:'finished',event:prev,progress:1,actor:9,flight:false};
 const actionStart=e.t,setupKinds=['restart','corner','penalty','direct','indirect'],setup=setupKinds.includes(e.kind),preparation=setup?Math.max(prevTime,actionStart-.39):actionStart;
 if(clock<preparation){const window=Math.max(.03,preparation-prevTime),u=fdg9C((clock-prevTime)/window,0,1);const target=fdg9P(e.x,e.y);let mid=fdg9P(fdg9Mix(prevEnd.x,target.x,.52),fdg9Mix(prevEnd.y,target.y,.44)+(fdg9R(e.id,5)-.5)*12);if(u<.52)ball=fdg9Path(prevEnd,mid,u/.52,0);else ball=fdg9Path(mid,target,(u-.52)/.48,0);stage='build';p=u;}
 else if(clock<actionStart){ball=fdg9P(e.x,e.y);stage='setup';p=fdg9C((clock-preparation)/Math.max(.03,actionStart-preparation));}
 else {p=fdg9C((clock-actionStart)/fdg9Duration(list,idx));stage='execute';let end=fdg9EventEnd(e),origin=fdg9P(e.x,e.y);
  if(['corner','cross'].includes(e.kind)&&e.result!=='cross'){
   let reception=fdg9P(e.side===0?86:14,fdg9C(43+fdg9R(e.id,6)*14,8,92));
   ball=p<.66?fdg9Path(origin,reception,p/.66,2.5):fdg9Path(reception,end,(p-.66)/.34,0);
  }else if(e.kind==='direct'&&e.result==='cross')ball=fdg9Path(origin,end,p,-4);
  else ball=fdg9Path(origin,end,p,(['shot','direct','penalty'].includes(e.kind)?(e.y<50?-2:2):0));
 }
 ball.x=fdg9C(ball.x);ball.y=fdg9C(ball.y);return {ball,side,event:e,stage,progress:p,actor:fdg9Actor(e),flight:stage==='execute'&&['shot','direct','penalty','corner','cross','pass','indirect'].includes(e.kind),kind};}
function fdg9Formation(l,pose){const all=[[],[]],ball=pose.ball,att=pose.side,def=1-att,d=fdg9AttackDir(att);const t=l.clock;
 for(let team=0;team<2;team++)for(let i=0;i<11;i++){
  let [fX,fY]=FDG6_FORM[i],home=team===0?fX:100-fX,teamDir=fdg9AttackDir(team),attacking=team===att;
  const drift=(ball.x-50)*(i===0?.018:i<=4?.22:i<=7?.29:.36);
  let x=home+drift+(attacking?teamDir*(i>=8?5:i>=5?2:0):teamDir*(i>=8?-4:0));
  let y=fY+(ball.y-50)*(i===0?.08:i<=4?.22:i<=7?.28:.19);
  if(i===0){x=(team===0?4:96)+(ball.x-50)*.025;y=50+(ball.y-50)*.10;}
  // Constant but small movement: attacking lanes and passing support stay alive.
  if(i!==0){x+=Math.sin(t*.8+i*1.8+team)*((i>=5)?2.6:1.1);y+=Math.sin(t*1.05+i*2.1+team)*((i>=5)?3.2:1.1);}
  all[team][i]=fdg9P(fdg9C(x,3,97),fdg9C(y,5,95));
 }
 const e=pose.event;
 if(e){
  if(pose.stage==='setup'||(pose.stage==='execute'&&['penalty','corner','direct','indirect','restart'].includes(e.kind))){
   if(e.kind==='penalty'){
    let spot=e.side===0?87:13;
    all[att][pose.actor]=fdg9P(spot-d*3.5,50);
    all[def][0]=fdg9P(def===0?2.7:97.3,50);
    for(let team=0;team<2;team++)for(let i=1;i<11;i++)if(!(team===att&&i===pose.actor)){
     const n=i+(team===att?1:0);all[team][i]=fdg9P(fdg9C(50+d*(team===att?16+n%4*2:17+n%4*2)),10+(i-1)*8);
    }
   }else if(e.kind==='corner'){
    all[att][pose.actor]=fdg9P(e.x-d*1.2,e.y<50?6:94);all[def][0]=fdg9P(def===0?3:97,50);
    let ix=0;for(let i=1;i<=10;i++)if(i!==pose.actor){all[att][i]=fdg9P(att===0?78+(i%3)*3:22-(i%3)*3,18+(ix++%8)*8);}
    for(let i=1;i<=10;i++)all[def][i]=fdg9P(att===0?82+(i%3)*2:18-(i%3)*2,15+(i-1)*8);
   }else if(e.kind==='direct'||e.kind==='indirect'){
    all[att][pose.actor]=fdg9P(fdg9C(e.x-d*2.5),e.y+3);
    for(let i=1;i<=4;i++)all[def][i]=fdg9P(fdg9C(e.x+d*9),fdg9C(e.y+(i-2.5)*5));
    for(let i=5;i<=10;i++)all[att][i]=fdg9P(att===0?74+(i%3)*3:26-(i%3)*3,13+(i-5)*13);
   }else if(e.kind==='restart'){
    all[att][9]=fdg9P(50-d*1.5,50);all[att][6]=fdg9P(50-d*8,50);
    for(let team=0;team<2;team++)for(let i=0;i<11;i++)if(!(team===att&&(i===9||i===6))){let v=all[team][i];v.x=team===0?Math.min(v.x,49):Math.max(v.x,51);}
   }
  }else{
   const actor=pose.actor;
   const close=pose.stage==='execute'?fdg9P(e.x,e.y):ball;
   let carrier=all[att][actor];carrier.x=fdg9C(close.x-d*(pose.flight?3:1));carrier.y=fdg9C(close.y+1,5,95);
   // Receiver supports a passing lane; other attackers open up instead of all chasing the ball.
   const receiver=(actor===9?10:9),base=all[att][receiver];base.x=fdg9C(ball.x+d*(receiver===9?12:9),4,96);base.y=fdg9C(ball.y+(receiver===9?-11:12),6,94);
   const defenders=[1,2,3,4,5,6,7,8,9,10].map(i=>({i,d:fdg9D(all[def][i],ball)})).sort((a,b)=>a.d-b.d);
   for(let j=0;j<2;j++){const pl=all[def][defenders[j].i],factor=j===0?.64:.40;pl.x=fdg9Mix(pl.x,ball.x-d*(j===0?3:7),factor);pl.y=fdg9Mix(pl.y,ball.y+(j===0?-2:6),factor);}
  }
  if(e.kind==='offside'&&pose.stage==='execute')for(let i=1;i<=4;i++)all[def][i].x=fdg9C(e.x-d*4);
 }
 return all;
}
function fdg9DrawPitch(ctx,W,H){const left=38,top=34,w=884,h=572,k=w/105;let x=m=>left+m*k,y=m=>top+m*k;
 ctx.fillStyle='#102b27';ctx.fillRect(0,0,W,H);for(let i=0;i<14;i++){ctx.fillStyle=i%2?'#186f49':'#1b7d52';ctx.fillRect(left+i*w/14,top,w/14+1,h)};
 ctx.save();ctx.strokeStyle='#e0f9ebca';ctx.lineWidth=1.65;ctx.strokeRect(left,top,w,h);
 ctx.beginPath();ctx.moveTo(left+w/2,top);ctx.lineTo(left+w/2,top+h);ctx.moveTo(left+w/2+9.15*k,top+h/2);ctx.arc(left+w/2,top+h/2,9.15*k,0,Math.PI*2);ctx.stroke();
 for(let s=0;s<2;s++){
  const sign=s===0?1:-1,goalX=s===0?left:left+w;
  ctx.strokeRect(sign===1?goalX:goalX-16.5*k,top+(68-40.32)*k/2,16.5*k,40.32*k);
  ctx.strokeRect(sign===1?goalX:goalX-5.5*k,top+(68-18.32)*k/2,5.5*k,18.32*k);
  ctx.fillStyle='#e0f9eb';ctx.beginPath();ctx.arc(goalX+sign*11*k,top+h/2,2.8,0,Math.PI*2);ctx.fill();
  // Semicircular arc outside the penalty area, 9.15m from spot.
  const spot=goalX+sign*11*k;
  const ar=Math.acos((16.5-11)/9.15);
  ctx.beginPath();ctx.arc(spot,top+h/2,9.15*k,s===0?-ar:Math.PI-ar,s===0?ar:Math.PI+ar);ctx.stroke();
  ctx.strokeStyle='#d8ecf5';ctx.strokeRect(s===0?goalX-9:goalX,top+h/2-3.66*k,9,7.32*k);ctx.strokeStyle='#e0f9ebca';
 }
 const r=1*k;for(let i=0;i<2;i++)for(let j=0;j<2;j++){let xx=i?left+w:left,yy=j?top+h:top;ctx.beginPath();ctx.arc(xx,yy,r,(i?Math.PI/2:0)+(j?Math.PI*1.5:0),(i?Math.PI:Math.PI/2)+(j?Math.PI*1.5:0));ctx.stroke();}
 ctx.restore();return {x:p=>left+(p/100)*w,y:p=>top+(p/100)*h,left,top,w,h};}
function fdg9SetNumbers(l){let idx=fdgHeroIndex(),n=fdg9HeroNumber();const isOn=fdg6HeroLive(l.clock)&&!l.v7SubPause;
 for(let p of l.players){if(p.team!==0)continue;if(p.i===idx&&isOn){p.n=n;continue;}const regular=FDG6_NUM[p.i];p.n=regular===n?18:regular;}
}
function fdg9Paint(dt){const l=S?.match?.live,canvas=document.getElementById('fdg-pitch');if(!l||!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;const W=960,H=640;
 if(canvas.width!==W)canvas.width=W;if(canvas.height!==H)canvas.height=H;
 const tr=fdg9DrawPitch(ctx,W,H),screen=p=>({x:tr.x(l.clock>=45.02?100-p.x:p.x),y:tr.y(p.y)});
 const scene=fdg9Pose(l),targets=fdg9Formation(l,scene);fdg9SetNumbers(l);
 const speed=34*Math.max(1,l.speed||1),time=Math.min(Math.max(dt,0),.06);
 for(let p of l.players){let a=targets[p.team]?.[p.i];if(!a)continue;
  const dx=a.x-p.x,dy=a.y-p.y,len=Math.hypot(dx,dy);
  // Strictly bounded motion per rendered frame, no coordinate resets or snaps.
  const amount=l.paused?0:Math.min(len,speed*time);
  if(len>.0001){p.x+=dx/len*amount;p.y+=dy/len*amount;}
  const v=screen(p),hero=p.team===0&&p.i===fdgHeroIndex()&&fdg6HeroLive(l.clock)&&!l.v7SubPause;
  ctx.beginPath();ctx.ellipse(v.x+1.5,v.y+5,11,4,0,0,Math.PI*2);ctx.fillStyle='#05251ba8';ctx.fill();
  if(hero){ctx.beginPath();ctx.arc(v.x,v.y,18,0,Math.PI*2);ctx.strokeStyle='#ffe77e';ctx.lineWidth=3.6;ctx.stroke();}
  ctx.beginPath();ctx.arc(v.x,v.y,11.5,0,Math.PI*2);ctx.fillStyle=p.team===0?'#daf18b':'#ffaf91';ctx.fill();ctx.strokeStyle=p.team===0?'#35553c':'#9f533e';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#18332b';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.n,v.x,v.y+.5);
 }
 if(scene.event?.kind==='offside'&&scene.stage==='execute'){
  let u=screen(fdg9P(scene.event.x-fdg9AttackDir(scene.side)*4,50)).x;ctx.setLineDash([6,6]);ctx.strokeStyle='#fff28f';ctx.beginPath();ctx.moveTo(u,tr.top);ctx.lineTo(u,tr.top+tr.h);ctx.stroke();ctx.setLineDash([]);
 }
 // Ball path is exactly continuous at both ends of every generated possession.
 const b=screen(scene.ball),lift=scene.flight?Math.sin(Math.PI*scene.progress)*5:0;
 ctx.beginPath();ctx.ellipse(b.x+1,b.y+4,6,3,0,0,7);ctx.fillStyle='#09271caa';ctx.fill();
 ctx.beginPath();ctx.arc(b.x,b.y-lift,5.8,0,Math.PI*2);ctx.fillStyle='#fffef1';ctx.fill();ctx.strokeStyle='#20382d';ctx.lineWidth=1.5;ctx.stroke();
 if(l.v7Banner?.type==='goal'&&performance.now()<l.v7Banner.until){ctx.fillStyle='#092f24e8';ctx.fillRect(332,22,296,62);ctx.fillStyle='#f4ffd0';ctx.font='bold 26px system-ui';ctx.textAlign='center';ctx.fillText('¡GOOOOL!',480,62);}
 FDG9.lastStage=scene.stage;
}
function fdg9BenchFeed(l){let rows=l.feed.filter(x=>x.type==='goal'||x.type==='ref'&&/tarjeta amarilla|tarjeta roja|expuls|segunda amarilla/i.test(x.text));return rows.length?rows.slice(0,16).map(x=>`<div class="fdg9-moment ${x.type==='goal'?'goal':'card'}"><span>${x.minute}'</span><strong>${x.type==='goal'?'⚽':'🟨'} ${esc(x.text)}</strong></div>`).join(''):'<p class="fdg9-wait">Sin goles ni tarjetas hasta ahora.</p>';}
function fdg9BenchScreen(){let l=S.match.live;return `<div class="fdg9-bench-moments" id="fdg9-bench-moments">${fdg9BenchFeed(l)}</div>`;}
const fdg9LegacyPaint=fdg6Paint;
fdg6Paint=function(dt){if(fdg9Current())return fdg9Paint(dt);return fdg9LegacyPaint(dt);};
const fdg9OldScreen=v4MatchScreen;
v4MatchScreen=function(){const m=S?.match;let html=fdg9OldScreen();if(!m)return html;
 if(!m.started){const lineups=fdg9LineupHTML();return html.includes('<section class="v4-panel"')?html.replace('<section class="v4-panel"',lineups+'<section class="v4-panel"'):html+lineups;}
 if(!fdg9Current())return html;
 html=html.replace(/SIMULADOR 8\.0/g,'SIMULADOR 9.0').replace('<div id="fdg7-bench-line">Los dos equipos están compitiendo.</div>','<div id="fdg7-bench-line">'+fdg9BenchScreen()+'</div>');
 html=html.replace('Mientras esperas ves las ocasiones y el marcador.','Mientras esperas, solo se muestran los goles y las tarjetas.');
 if(m.enter<0)html=html.replace('Te preparas para entrar','Retransmisión del equipo').replace('Cuando el entrenador te llame, el partido se detendrá para mostrar tu entrada al campo.','Tu futbolista no participará hoy.');
 html=html.replace('Simulación de fútbol con jugadores, números, pelota y acciones','Campo táctico con balón continuo, jugadores y dorsales estables');
 return html;
};
const fdg9OldSync=fdg6Sync;
fdg6Sync=function(force){fdg9OldSync(force);if(!fdg9Current())return;let l=S.match.live;
 let holder=document.getElementById('fdg7-bench-line');if(holder){const v=fdg9BenchScreen();if(holder.innerHTML!==v)holder.innerHTML=v;}
 let role=document.getElementById('fdg7-role');if(role&&S.match.enter>0&&l.clock<S.match.enter)role.textContent=`BANQUILLO · Nº ${fdg9HeroNumber()} · ENTRAS ${S.match.enter}'`;
 const observing=(S.match.enter<0||S.match.enter>0&&!l.v7SubShown)&&l.v7Following==='bench';
 let pitch=document.getElementById('fdg7-pitch-area'),bench=document.getElementById('fdg7-bench');
 if(pitch)pitch.classList.toggle('fdg7-only-events',observing);if(bench)bench.hidden=!observing;
 let watching=document.getElementById('fdg7-watch-controls');if(watching&&S.match.enter<0)watching.hidden=false;
 if(observing){let f=document.getElementById('fdg-feed');if(f)f.innerHTML=fdg9BenchFeed(l);}
 let event=document.getElementById('fdg8-action');if(event){let scene=fdg9Pose(l),e=scene.event;event.textContent=scene.stage==='setup'?'PREPARANDO · '+(FDG8_LABEL[e.kind]||'REANUDACIÓN'):scene.stage==='execute'?(FDG8_LABEL[e?.kind]||'JUGADA'):'POSESIÓN · '+(scene.side===0?'TU EQUIPO':'RIVAL');}
};
const fdg9OldApply=fdg6Apply;
fdg6Apply=function(e){
 const live=S?.match?.live,active=fdg9Current(),before=active?{goals:S.match.stats.goals,assists:S.match.stats.assists}:null;
 fdg9OldApply(e);
 if(!active||!e||!live?.feed?.length)return;
 const latest=live.feed[0];if(!latest||Math.abs(latest.minute-Math.ceil(e.t))>1)return;
 const rivalCountry=META?.[S.match.opp]?.country||'España';
 const our=fdg9RosterNames(S.club.name,S.club.country),their=fdg9RosterNames(S.match.opp,rivalCountry);
 if(e.result==='goal'&&latest.type==='goal'){
   const actor=fdg9Actor(e),names=e.side===0?our:their;
   const heroScored=e.side===0&&S.match.stats.goals>(before?.goals||0);
   const heroAssist=e.side===0&&S.match.stats.assists>(before?.assists||0);
   let scorer=heroScored?S.player.name:names[heroAssist&&actor===fdgHeroIndex()?9:actor]||names[9];
   if(!latest.text.includes('Marca '+scorer)&&!latest.text.includes(scorer+' marca'))latest.text+=' Gol de '+scorer+'.';
 }
 if(e.kind==='foul'&&['yellow','red'].includes(e.result)&&latest.type==='ref'){
   const team=1-e.side,arr=team===0?our:their,idx=2+Math.floor(fdg9R(e.id,3)*5);
   const club=team===0?S.club.name:S.match.opp;
   latest.text+=' Amonestado: '+arr[idx]+' ('+club+').';
 }
};
const fdg9OldPlay=window.Game.playMatch;
window.Game.playMatch=function(){const m=S?.match;if(!m||m.started)return fdg9OldPlay();fdg9HeroNumber();fdg9OldPlay();const l=S?.match?.live;if(!l||l.engine!==6||l.presentation!==7)return;
 l.v9=true;l.v9Version='continuous-possession';l.v7HeroNumber=fdg9HeroNumber();l.mode='full';l.speed=1;
 if(m.enter!==0){l.v7Following='bench';if(m.enter<0)l.mode='highlights';}fdg9SetNumbers(l);persist();render();fdg6Resume();};
// During existing V7/V8 saves, retain the original renderer until the next fixture.
if(fdg9Current()&&S?.view==='match'){render();fdg6Resume();}
window.FDG9={pose:fdg9Pose,formation:fdg9Formation,drawPitch:fdg9DrawPitch,heroNumber:fdg9HeroNumber,rosters:fdg9LineupData,version:9};