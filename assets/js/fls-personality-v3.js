/* Football Life Simulator V3 · Matchday editorial identity.
   Presentation only: no mutations of S, no new storage keys, no gameplay changes. */
(function(){
 'use strict';
 if(window.FLS_PERSONALITY?.installed)return;
 const colors={
  'FC Barcelona':['#284d95','#912f54'],
  'Real Madrid':['#b6adcd','#e4c87f'],
  'CE Sabadell':['#287bb2','#bed7eb'],
  'Atlético de Madrid':['#bc3548','#254fa3'],
  'Athletic Club':['#a8323f','#e9eeee'],
  'Real Betis':['#298a68','#e6ece7'],
  'Sevilla FC':['#a63140','#e7e9ec'],
  'Valencia CF':['#f0c879','#292e40'],
  'Villarreal CF':['#d1b43f','#22354c'],
  'Arsenal FC':['#aa3443','#d9c5a3'],
  'Chelsea FC':['#255bab','#bbdbf1'],
  'Liverpool FC':['#b92d47','#ecd7c1'],
  'Manchester City':['#6eacd1','#e8edf0'],
  'Manchester United':['#a52d38','#e4c46c'],
  'Bayern Múnich':['#a6294b','#2b4c8c'],
  'Borussia Dortmund':['#c3a92b','#282e38'],
  'Paris Saint-Germain':['#252f70','#b33a55'],
  'Olympique de Marseille':['#5ba2c8','#e6f0f7'],
  'Inter de Milán':['#25539d','#283249'],
  'AC Milan':['#a63a4b','#222836'],
  'Juventus':['#d8dbdf','#343a43'],
  'Celtic FC':['#37916c','#e3ebe4'],
  'Rangers FC':['#2c57a9','#bd3546'],
  'FC Copenhague':['#4772ad','#eff3f8'],
  'Brøndby IF':['#d3b43a','#294980'],
  'Boca Juniors':['#2e58a0','#e7bc4f'],
  'River Plate':['#bb3744','#f5f5f5'],
  'Flamengo':['#bc3440','#2a3037'],
  'Palmeiras':['#26775c','#e1e8e2'],
  'Inter Miami CF':['#d796b1','#272e39']
 };
 const phaseTitles=[
  ['La semana se construye antes del pitido.','ENTRENAMIENTO · PRIMER ACTO'],
  ['Hay decisiones que no se toman en el campo.','VIDA PERSONAL · SEGUNDO ACTO'],
  ['El siguiente capítulo se escribe en el césped.','DÍA DE PARTIDO · TERCER ACTO']
 ];
 function node(tag,cls,content){
  const e=document.createElement(tag);if(cls)e.className=cls;
  if(content!==undefined)e.textContent=String(content);
  return e;
 }
 function append(parent,child){if(parent)parent.appendChild(child);return child;}
 function logo(team,large){
  if(window.FLSUI&&typeof window.FLSUI.crestUrl==='function'){
   const e=node('span','fls-v3-crest'+(large?' fls-v3-crest-lg':''));e.title=team;
   const url=window.FLSUI.crestUrl(team);
   if(url){
    const img=node('img');img.src=url;img.alt='';img.loading='lazy';img.decoding='async';
    img.addEventListener('error',()=>{img.remove();e.textContent=String(team||'FC').split(/\s+/).map(w=>w[0]||'').join('').slice(0,3).toUpperCase();});
    e.appendChild(img);
   }else e.textContent=String(team||'FC').split(/\s+/).map(w=>w[0]||'').join('').slice(0,3).toUpperCase();
   return e;
  }
  return node('span','fls-v3-crest',(team||'FC').slice(0,2));
 }
 function clubAccent(){
  if(!S)return;
  const team=S.club.parent||S.club.name;
  const palette=colors[team]||['#4b839b','#4e7289'];
  const root=document.querySelector('.v4-shell');
  if(!root)return;
  root.style.setProperty('--fls-club-primary',palette[0]);
  root.style.setProperty('--fls-club-secondary',palette[1]);
  root.dataset.flsClub=team;
 }
 function stageCopy(){
  const p=S.player||{};
  if(p.injured>0)return {title:'La recuperación también forma parte de una carrera.',body:'La lesión sigue activa. Prioriza volver en condiciones antes de buscar más minutos.',type:'medical'};
  if(p.fitness<50)return {title:'La forma física puede decidir el próximo partido.',body:'Tu condición está baja. Prepararte con cabeza importa tanto como tu media.',type:'fitness'};
  if(p.trust<50)return {title:'Todavía tienes que ganarte la confianza del míster.',body:'Las decisiones y tu rendimiento pueden abrirte más oportunidades.',type:'trust'};
  if(S.stage==='academy')return {title:'El primer equipo todavía está por conquistar.',body:'La cantera es tu escaparate: cada semana cuenta para conseguir oportunidades.',type:'academy'};
  if(S.watchlist?.length)return {title:'Hay clubes siguiendo tu evolución.',body:'Los ojeadores valoran minutos, actuaciones y regularidad. Nada está garantizado.',type:'scouts'};
  return {title:'Tu sitio se gana semana a semana.',body:'El próximo encuentro es otra oportunidad para consolidarte.',type:'regular'};
 }
 function topIdentity(){
  if(!S)return;
  const brand=document.querySelector('.v4-brand');
  if(brand&&!brand.querySelector('.fls-v3-brandline')){
   append(brand.querySelector('div:last-child'),node('span','fls-v3-brandline','THE CAREER EDITION'));
  }
  const toolbar=document.querySelector('.v4-toolbar');
  if(toolbar&&!toolbar.querySelector('.fls-v3-issue')){
   const subtitle=node('span','fls-v3-issue','EDICIÓN '+String(S.seasonNo).padStart(2,'0')+'  /  J'+String(S.round+1).padStart(2,'0'));
   toolbar.insertBefore(subtitle,toolbar.querySelector('.v4-tools'));
  }
 }
 function homepage(){
  if(!S||S.view!=='hub'||activeTab!=='hub')return;
  const p=S.player,up=upcoming(),day=S.day?.index??0;
  const welcome=document.querySelector('.v4-welcome');
  if(welcome){
   welcome.classList.add('fls-v3-welcome');
   const kicker=welcome.querySelector('.v4-kicker');if(kicker)kicker.textContent='CAPÍTULO '+String(S.seasonNo).padStart(2,'0')+'  /  '+S.year+'—'+(S.year+1);
   const heading=welcome.querySelector('h1');
   if(heading){heading.classList.add('fls-v3-hello');const part=heading.querySelector('.v4-em');if(part)part.textContent='. Todo empieza aquí.';}
   const meta=node('span','fls-v3-player-tag',(S.stage==='academy'?'PROMESA DE CANTERA':'FUTBOLISTA PROFESIONAL')+'  ·  '+p.pos);
   welcome.appendChild(meta);
  }
  const panel=document.querySelector('.v4-feature');if(!panel)return;
  panel.classList.add('fls-v3-matchday');
  panel.dataset.flsPhase=String(day);
  const title=panel.querySelector('h2');
  const label=panel.querySelector('.v4-kicker');
  if(label)label.textContent='MATCHDAY JOURNAL  /  '+(up?(up.home?'EN CASA':'A DOMICILIO'):'CALENDARIO')+'  ·  JORNADA '+(S.round+1);
  if(title)title.textContent=phaseTitles[Math.min(2,Math.max(0,day))][0];
  const stamp=node('div','fls-v3-stamp');
  stamp.appendChild(node('span','', 'FL / '+String(S.seasonNo).padStart(2,'0')));
  stamp.appendChild(node('span','',phaseTitles[Math.min(2,Math.max(0,day))][1]));
  panel.insertBefore(stamp,panel.firstChild);
  const fixture=panel.querySelector('.fls-fixture');
  if(fixture){
   fixture.classList.add('fls-v3-versus');
   const sideNames=[...fixture.querySelectorAll(':scope > div b')].map(n=>n.textContent.trim());
   fixture.querySelectorAll(':scope > div').forEach((item,i)=>{
    const tiny=node('small','fls-v3-team-label',i===0?'LOCAL':'VISITANTE');
    item.insertBefore(tiny,item.querySelector('b'));
   });
   const vs=fixture.querySelector('.fls-vs');if(vs){vs.textContent='VS';vs.appendChild(node('small','',String(S.round+1).padStart(2,'0')));}
   fixture.setAttribute('aria-label',(sideNames[0]||'Equipo local')+' contra '+(sideNames[1]||'equipo visitante'));
  }
  const hint=panel.querySelector('.fls-primaryhint');if(hint)hint.classList.add('fls-v3-agenda');
  const cta=panel.querySelector('button.btn');
  if(cta){
   cta.classList.add('fls-v3-maincta');
   cta.textContent=day===2?'ENTRAR EN EL PARTIDO':'CONTINUAR EL CAPÍTULO';
   cta.appendChild(node('span','fls-v3-cta-arrow','↗'));
  }
  const numbers=document.querySelector('.v4-numbers');
  if(numbers){
   numbers.classList.add('fls-v3-season-stats');
   append(numbers,node('div','fls-v3-stats-footer','TU REGISTRO  /  TEMPORADA '+S.year+'—'+(S.year+1)));
  }
  const shortcuts=document.querySelector('.v4-shortcuts');
  if(shortcuts)shortcuts.classList.add('fls-v3-shortcuts');
  const news=document.querySelector('.fls-news-card');
  if(news){
   news.classList.add('fls-v3-frontpage');
   news.querySelector('h3').textContent='El vestuario habla';
   const excerpt=news.querySelector('p');
   if(excerpt){
    const full=excerpt.textContent;
    if(full.length>196)excerpt.textContent=full.slice(0,193).trimEnd()+'…';
   }
   const pre=node('span','fls-v3-news-label','LA GACETA  /  '+(S.inbox?.length?'ÚLTIMA HORA':'SIN NOVEDADES'));
   news.insertBefore(pre,news.firstChild);
  }
  const moment=stageCopy();
  const rail=node('section','fls-v3-narrative fls-v3-narrative-'+moment.type);
  const numeral=node('div','fls-v3-narrative-num',String(S.round+1).padStart(2,'0'));
  rail.appendChild(numeral);
  const words=node('div','fls-v3-narrative-copy');
  words.appendChild(node('span','fls-v3-eyebrow','LO QUE ESTÁ EN JUEGO'));
  words.appendChild(node('h3','',moment.title));
  words.appendChild(node('p','',moment.body));
  rail.appendChild(words);
  if(shortcuts&&shortcuts.parentNode)shortcuts.parentNode.insertBefore(rail,shortcuts);
 }
 function playerFile(){
  if(!S||S.view!=='hub'||activeTab!=='player')return;
  const grid=document.querySelector('.fls-profile-grid');if(!grid)return;
  const p=S.player||{};
  const head=node('header','fls-v3-pagehead fls-v3-player-head');
  const copy=node('div','');
  append(copy,node('span','fls-v3-eyebrow','EL EXPEDIENTE  /  '+String(S.seasonNo).padStart(2,'0')));
  append(copy,node('h1','',p.name));
  append(copy,node('p','','Una carrera se construye en el campo y en todo lo que ocurre fuera.'));
  head.appendChild(copy);
  const number=typeof fdg9HeroNumber==='function'?fdg9HeroNumber():'—';
  const right=node('div','fls-v3-player-number');
  right.appendChild(node('small','','DORSAL'));
  right.appendChild(node('b','',number));
  head.appendChild(right);
  grid.parentNode.insertBefore(head,grid);
  const card=document.querySelector('.fls-profile-card');
  if(card){
   card.classList.add('fls-v3-dossier');
   const brow=card.querySelector('.eyebrow');
   if(brow)brow.textContent='IDENTIDAD  /  FUTBOLISTA';
   const badge=node('div','fls-v3-dossier-badge');
   badge.appendChild(logo(S.club.name,false));
   badge.appendChild(node('span','',S.stage==='academy'?'CANTERA  /  '+(S.club.parent||S.club.name):'PRIMER EQUIPO  /  '+S.club.name));
   card.insertBefore(badge,card.querySelector('.profiletop'));
  }
  const attr=[...document.querySelectorAll('.fls-player-view .card')].find(c=>c.querySelectorAll('.skill').length>0);
  if(attr){
   attr.classList.add('fls-v3-attributes');
   const best=Object.keys(p.attrs||{}).filter(x=>p.pos==='POR'||x!=='porteria').sort((a,b)=>p.attrs[b]-p.attrs[a])[0];
   if(best){
    const msg=node('div','fls-v3-skillhero');
    append(msg,node('span','fls-v3-eyebrow','TU PUNTO FUERTE'));
    append(msg,node('strong','',ATTRS[best]||best));
    append(msg,node('b','',Math.round(p.attrs[best])));
    const first=attr.querySelector('.skill');
    if(first)attr.insertBefore(msg,first);
   }
  }
 }
 function transferDesk(){
  if(!S||S.view!=='hub'||activeTab!=='agent')return;
  const main=document.querySelector('.v4-main');if(!main)return;
  const scout=Array.isArray(S.watchlist)?S.watchlist.slice().sort((a,b)=>objectiveProgress(b).progress-objectiveProgress(a).progress)[0]:null;
  const intro=node('header','fls-v3-pagehead fls-v3-agent-head');
  const left=node('div','');
  append(left,node('span','fls-v3-eyebrow','OFICINA DE REPRESENTACIÓN  /  INFORME '+String(S.round+1).padStart(2,'0')));
  append(left,node('h1','','Tu carrera está en movimiento.'));
  append(left,node('p','','Reputación, minutos y rendimiento. Cada oferta se gana.'));
  intro.appendChild(left);
  if(scout){
   const badge=node('div','fls-v3-agent-radar');
   badge.appendChild(logo(scout.name,true));
   const block=node('div','');
   append(block,node('span','fls-v3-eyebrow','CLUB QUE TE SIGUE'));
   append(block,node('strong','',scout.name));
   const percent=Math.round(Math.min(1,Math.max(0,objectiveProgress(scout).progress))*100);
   append(block,node('small','',percent+'% de requisitos cumplidos'));
   badge.appendChild(block);
   intro.appendChild(badge);
  }else{
   const label=node('div','fls-v3-agent-empty');
   label.appendChild(node('strong','','SIN OFERTAS TODAVÍA'));
   label.appendChild(node('small','','La temporada acaba de empezar.'));
   intro.appendChild(label);
  }
  main.insertBefore(intro,main.firstChild);
 }
 function newsroom(){
  if(!S||S.view!=='hub'||activeTab!=='news')return;
  const main=document.querySelector('.v4-main');if(!main)return;
  const wrap=node('div','fls-v3-newsroom-brand');
  append(wrap,node('span','fls-v3-eyebrow','FOOTBALL LIFE  /  THE CAREER FILES'));
  append(wrap,node('h2','','LA GACETA'));
  append(wrap,node('p','','Crónicas, decisiones y momentos que construyen tu historia.'));
  const head=main.querySelector('.v4-viewhead');if(head)main.insertBefore(wrap,head);
  const feed=main.querySelector('.v4-feed');
  if(feed)feed.querySelectorAll('.v4-feeditem').forEach((item,i)=>{
   item.classList.add('fls-v3-story-item');
   item.insertBefore(node('span','fls-v3-story-index',String(i+1).padStart(2,'0')),item.firstChild);
  });
 }
 function seasonChapter(){
  if(!S||S.view!=='season')return;
  const main=document.querySelector('.v4-main');if(!main)return;
  const wrap=node('div','fls-v3-season-hero');
  wrap.appendChild(logo(S.club.name,true));
  const group=node('div','');
  append(group,node('span','fls-v3-eyebrow','FINAL DE CAPÍTULO  /  TEMPORADA '+S.seasonNo));
  append(group,node('h2','','El próximo escudo puede ser el tuyo.'));
  append(group,node('p','','Decide dónde escribirás el siguiente capítulo de tu carrera.'));
  wrap.appendChild(group);
  main.insertBefore(wrap,main.firstChild);
 }
 function postReport(){
  if(!S||S.view!=='post'||!S.lastResult)return;
  const main=document.querySelector('.v4-main');if(!main)return;
  const r=S.lastResult;
  const focus=r.minutes===0?'Una jornada vista desde fuera.':r.rating>=8?'Una noche para recordar.':r.rating<5.7?'La próxima respuesta se da sobre el césped.':'El siguiente partido ya importa.';
  const band=node('section','fls-v3-post-report');
  append(band,node('span','fls-v3-eyebrow','ACTA N.º '+String(S.round+1).padStart(2,'0')+'  /  EL DÍA DESPUÉS'));
  append(band,node('strong','',focus));
  append(band,node('small','','Tu nota: '+(r.minutes?r.rating.toFixed(1):'—')+'  ·  '+r.minutes+' minutos  ·  '+r.goals+' goles  ·  '+r.assists+' asistencias'));
  const first=main.querySelector('.v4-post .sectionhead');
  if(first)first.insertAdjacentElement('afterend',band);
 }
 function draftIntro(){
  if(S&&S.view!=='draft')return;
  const hero=document.querySelector('.setuphero');if(!hero)return;
  hero.classList.add('fls-v3-draft-hero');
  hero.insertBefore(node('span','fls-v3-eyebrow','EDICIÓN 001 / EL PRIMER CONTRATO'),hero.firstChild);
 }
 function decorate(){
  draftIntro();
  if(!S)return;
  clubAccent();topIdentity();homepage();playerFile();transferDesk();newsroom();seasonChapter();postReport();
 }
 const previous=render;
 render=function(){const result=previous.apply(this,arguments);try{decorate();}catch(error){console.warn('FLS Personality layer:',error);}return result;};
 window.FLS_PERSONALITY={installed:true,version:'3.0.0',teamColors:(team)=>colors[team]||null};
 render();
})();