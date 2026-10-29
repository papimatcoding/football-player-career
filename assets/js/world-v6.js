/* FUERA DE GUIÓN 6 — contextual press, lightly simulated global football world,
   seasonal market windows. No reliance on external news feeds or network calls. */
'use strict';
const FDG6_SAVE_BACKUP='fuera_de_guion_backup_antes_de_v6';
try{if(store.getItem(SAVE_KEY)&&!store.getItem(FDG6_SAVE_BACKUP))store.setItem(FDG6_SAVE_BACKUP,store.getItem(SAVE_KEY));}catch(e){}
const FDG6_MEDIA={
 España:[['MARCA','es'],['AS','es'],['Mundo Deportivo','es'],['SPORT','es']],
 Inglaterra:[['BBC Sport','en'],['Sky Sports','en']],
 'Reino Unido':[['BBC Sport','en'],['Sky Sports','en']],
 Francia:[["L’Équipe",'fr'],['RMC Sport','fr']],
 Portugal:[['A Bola','pt'],['O Jogo','pt']],
 Alemania:[['kicker','de'],['Sport Bild','de']],
 Italia:[['La Gazzetta dello Sport','it'],['Corriere dello Sport','it']],
 Argentina:[['Olé','es']],Brasil:[['ge.globo','pt']],
 Países_Bajos:[['Voetbal International','nl']]
};
const FDG6_QUESTIONS={
 goal:{q:'Has marcado {goals} {noun} contra {rival}. ¿Qué significa para ti después de este resultado?',a:[['Lo más importante es ayudar al equipo a ganar.',{chemistry:4,trust:3,rep:1},'Pones al equipo por delante de las cifras.'],['Es un premio al trabajo en los entrenamientos.',{focus:4,trust:2},'Tu dedicación ocupa los titulares.'],['Quiero ser decisivo cada semana.',{rep:5,focus:-2,trust:-1},'La ambición aumenta la atención sobre ti.']]},
 assist:{q:'Has dado {assists} {noun} frente a {rival}. ¿Te sientes más cómodo en este sistema?',a:[['El juego colectivo nos hace mejores.',{chemistry:4,trust:2},'Tu respuesta agrada al vestuario.'],['He trabajado mucho la visión y el último pase.',{focus:4,rep:2},'Destacas tu evolución técnica.'],['Tengo calidad para asumir más responsabilidad.',{rep:4,trust:-2},'Los periodistas especulan con tu protagonismo.']]},
 debut:{q:'Acabas de disputar tus primeros minutos con {club}. ¿Cómo has vivido el debut?',a:[['Es un sueño, pero tengo que seguir aprendiendo.',{trust:4,morale:5},'La afición valora tu humildad.'],['Quiero más oportunidades para demostrar mi nivel.',{rep:3,focus:2,trust:-1},'Tu ambición llama la atención.'],['Gracias al club y a mis compañeros.',{chemistry:5,morale:3},'Una respuesta que refuerza el vestuario.']]},
 great:{q:'Tu nota de {rating} ha sido una de las mejores del encuentro ante {rival}. ¿Es tu momento?',a:[['He tenido un buen día gracias a mis compañeros.',{chemistry:5,trust:2},'El equipo respalda tu discurso.'],['Estoy encontrando mi mejor nivel.',{morale:4,rep:3},'Tu confianza se contagia a la grada.'],['Llevo semanas trabajando para llegar a esto.',{focus:5,rep:2},'Explicas tu progreso sin exageraciones.']]},
 poor:{q:'La actuación ante {rival} no ha sido buena. ¿Qué crees que ha fallado?',a:[['Me hago responsable; corregiré mis errores.',{trust:4,focus:5,morale:-1},'Tu autocrítica evita polémicas.'],['Es un mal día y hay que mirar adelante.',{morale:3,focus:2},'Tratas de pasar página.'],['El sistema no me ayudó demasiado.',{rep:2,trust:-6,chemistry:-3},'Tus palabras incomodan al entrenador.']]},
 loss:{q:'El equipo ha perdido {us}-{them} contra {rival}. ¿Qué lectura haces del encuentro?',a:[['Nos faltó precisión; toca entrenar más.',{focus:4,trust:2},'Das un diagnóstico deportivo.'],['Tenemos que estar unidos en estos momentos.',{chemistry:5,morale:2},'El vestuario agradece el mensaje.'],['No podemos competir así.',{rep:2,chemistry:-3,trust:-2},'La crítica genera debate.']]},
 win:{q:'Victoria por {us}-{them} ante {rival}. ¿Qué ha sido determinante?',a:[['La organización defensiva y el trabajo sin balón.',{trust:3,chemistry:3},'El cuerpo técnico aprecia el análisis.'],['No dejamos de buscar el gol.',{rep:2,morale:2},'La afición conecta con tu optimismo.'],['Hoy salió el plan preparado por el entrenador.',{trust:4,focus:2},'El técnico agradece el reconocimiento.']]},
 keeper:{q:'Has detenido {saves} remates frente a {rival}. ¿Cómo has visto a la defensa?',a:[['Nos hemos ayudado en cada acción.',{chemistry:5,trust:2},'Defiendes a tus compañeros.'],['Trabajo estos reflejos todas las semanas.',{focus:4,rep:2},'La preparación individual gana protagonismo.'],['Tuvimos que sufrir demasiado.',{rep:2,chemistry:-3},'Tu crítica provoca preguntas incómodas.']]},
 red:{q:'Has terminado expulsado ante {rival}. ¿Qué explicación das al vestuario?',a:[['Me equivoqué y pido disculpas.',{trust:5,chemistry:3,focus:2},'Asumes el error con madurez.'],['Fue una entrada sin mala intención.',{morale:1,trust:-2},'El club esperaba mayor autocrítica.'],['No comparto la decisión arbitral.',{rep:3,trust:-5},'La polémica crece en los medios.']]},
 bench:{q:'Has vuelto a quedarte sin minutos contra {rival}. ¿Cómo afrontas la competencia por tu puesto?',a:[['Entrenaré para estar preparado.',{trust:4,focus:3},'El cuerpo técnico valora tu paciencia.'],['Quiero hablar de mi papel con el entrenador.',{focus:4,trust:1},'Pides claridad sin confrontación.'],['No estoy satisfecho con la situación.',{rep:2,trust:-3,morale:-2},'Tus palabras generan rumores.']]}
};
function fdg6Market(){
 if(!S?.schedule?.length)return {open:false,name:'Fuera de mercado',days:0};
 const f=S.round/S.schedule.length;
 if(f<.13||f>.92)return {open:true,name:'Ventana de verano',days:Math.round((f<.13?.13-f:1-f)*S.schedule.length)};
 if(f>=.45&&f<=.53)return {open:true,name:'Ventana de invierno',days:Math.round((.53-f)*S.schedule.length)};
 return {open:false,name:f<.45?'Hasta invierno':'Hasta verano',days:0};
}
function fdg6Media(){let c=S.club.country||'España',options=FDG6_MEDIA[c]||FDG6_MEDIA.España;return fdg6Pick(options);}
function fdg6PressPrepare(){
 if(!S||S.view!=='post'||!S.lastResult)return;
 const key=`${S.year}/${S.seasonNo}/${S.round}`;
 if(S.pressV6?.key===key)return;
 const r=S.lastResult,m=S.match,apps=S.stats.apps;
 let what=null;
 if(m?.sentOff)what='red';
 else if(r.goals>0)what='goal';
 else if(r.assists>0)what='assist';
 else if(r.minutes>0&&apps===1)what='debut';
 else if(r.save>=5&&S.player.pos==='POR')what='keeper';
 else if(r.rating>=8.1)what='great';
 else if(r.minutes>20&&r.rating<=5.85)what='poor';
 else if(r.minutes===0&&S.stats.apps>2&&Math.random()<.28)what='bench';
 else if(r.minutes>30&&r.us<r.them&&Math.random()<.27)what='loss';
 else if(r.minutes>30&&r.us>r.them&&Math.random()<.22)what='win';
 // An unknown teenager doesn't get a microphone after every uneventful fixture.
 let chance=(what==='goal'||what==='red'||what==='debut')?.95:what==='great'||what==='assist'||what==='keeper'?.80:what==='poor'?.70:what==='bench'?.50:.47;
 if(S.stage==='academy')chance*=.68;
 const type=what&&Math.random()<chance?what:null;
 if(!type){S.pressV6={key,type:null,answered:true};return;}
 const [media,lang]=fdg6Media(),source=FDG6_QUESTIONS[type];
 const params={rival:r.opp,club:S.club.name,goals:r.goals,noun:r.goals===1?'gol':'goles',assists:r.assists,saves:r.save,us:r.us,them:r.them,rating:r.rating.toFixed(1)};
 const question=source.q.replace(/\{(\w+)\}/g,(_,x)=>String(params[x]??''));
 S.pressV6={key,type,media,lang,question,choices:source.a,answered:false};persist();
}
function fdg6PressChoice(idx){fdg6PressPrepare();let press=S?.pressV6;if(!press||press.answered||!press.choices[idx])return;let [label,effect,consequence]=press.choices[idx];mutate(effect);press.answered=true;press.selected=idx;press.answer=label;press.consequence=consequence;S.pressAnswered=true;note(`Zona mixta · ${press.media}: ${consequence}`);fdg6WorldInit();S.worldNews.unshift({key:`press-${press.key}`,round:S.round+1,season:S.seasonNo,category:'protagonista',media:press.media,lang:press.lang,title:`${S.player.name} habla tras el ${S.lastResult.us}-${S.lastResult.them} contra ${S.lastResult.opp}`,text:`«${label}» · ${consequence}`});S.worldNews=S.worldNews.slice(0,100);persist();render();notify(consequence);}
function fdg6WorldInit(){if(!S)return;if(!Array.isArray(S.worldNews))S.worldNews=[];if(!S.worldSeeded){S.worldSeeded=true;S.worldNews.unshift({key:`hello-${S.year}-${S.seasonNo}`,round:S.round+1,season:S.seasonNo,category:'global',media:'Redacción deportiva',lang:'es',title:'Comienza una temporada llena de historias',text:'La competición avanza en todos los países. Las noticias de esta sección son ficción del simulador.'});}}
function fdg6WorldWeek(){
 fdg6WorldInit();const key=`${S.year}-${S.seasonNo}-${S.round}`;
 if(S.lastWorldWeek===key)return;S.lastWorldWeek=key;
 const choices=Object.keys(META).filter(n=>!META[n].youth&&META[n].power>70);
 const a=fdg6Pick(choices),b=fdg6Pick(choices.filter(x=>x!==a)), market=fdg6Market();
 const tabs=['global','liga','mercado'];let entries=[];
 const table=sortedTable();let leader=table[0],bottom=table.at(-1);
 if(leader&&S.round>2)entries.push({category:'liga',media:'Redacción local',lang:'es',title:`${leader.name} marca el ritmo de ${leagueLabel()}`,text:`Lidera la clasificación con ${leader.pts} puntos tras ${leader.p} partidos. ${bottom.name} necesita reaccionar.`});
 if(market.open)entries.push({category:'mercado',media:'Mercado internacional',lang:'es',title:`El mercado de ${market.name.toLowerCase()} concentra las miradas`,text:`Los clubes ultiman su planificación. ${a} y ${b} aparecen en los rumores del entorno futbolístico; ninguna operación está confirmada.`});
 else entries.push({category:'global',media:'Fútbol mundial',lang:'es',title:`${a} prepara un tramo exigente de la temporada`,text:`El cuerpo técnico revisa la rotación y el estado físico de la plantilla. La próxima ventana será otro punto de inflexión.`});
 if(Math.random()<.50&&S.watchlist?.length){let w=fdg6Pick(S.watchlist);entries.push({category:'protagonista',media:'Redacción del representante',lang:'es',title:`${w.name} mantiene bajo observación a ${S.player.name}`,text:`El informe sigue condicionado por los minutos, la nota media y los objetivos deportivos. Interés no equivale a oferta.`});}
 if(Math.random()<.38){entries.push({category:'global',media:'Panorama internacional',lang:'es',title:`${b} debate un cambio de plan para la segunda vuelta`,text:'El calendario, la forma física y las decisiones tácticas condicionarán sus resultados. La información forma parte del universo ficticio del juego.'});}
 for(let i=entries.length-1;i>=0;i--)S.worldNews.unshift({...entries[i],key:`${key}-${i}`,season:S.seasonNo,round:S.round+1});
 S.worldNews=S.worldNews.slice(0,100);
}
function fdg6News(){fdg6WorldInit();const market=fdg6Market(),current=S.newsFilter||'all';
 const filters=[['all','Todas'],['protagonista','Sobre mí'],['liga','Mi liga'],['mercado','Fichajes'],['global','Internacional']];
 const items=S.worldNews.filter(x=>current==='all'||x.category===current).slice(0,32);
 return `<div class="v4-viewhead"><div><span class="v4-kicker">FUERA DE GUIÓN · REDACCIÓN</span><h1>El fútbol no se detiene.</h1><p>Tu carrera y las demás ligas siguen evolucionando. Titulares ficticios de un universo simulado.</p></div>${v4Tag(market.open?market.name:'Mercado cerrado')}</div><div class="fdg6-newsfilters">${filters.map(([id,label])=>`<button onclick="Game.newsFilter('${id}')" class="${current===id?'selected':''}">${label}</button>`).join('')}</div><div class="fdg6-newslist">${items.length?items.map(x=>`<article class="v4-panel fdg6-article"><div class="fdg6-articlehead"><b>${esc(x.media)}</b><span>${esc(x.lang.toUpperCase())} · T${x.season} · J${x.round}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join(''):'<section class="v4-panel"><p>Todavía no hay noticias en esta categoría.</p></section>'}</div><p class="micro">Medios y noticias utilizados únicamente como ambientación ficticia. No son informaciones, declaraciones ni acuerdos reales.</p>`;
}
function fdg6Post(){
 fdg6PressPrepare();const r=S.lastResult,m=S.match,p=S.player;if(!r)return '';
 const x=S.pressV6,show=x&&!x.answered&&x.type,market=fdg6Market();
 const outcome=r.us>r.them?'VICTORIA':r.us<r.them?'DERROTA':'EMPATE';
 return `<div class="fdg6-post"><div class="v4-viewhead"><div><span class="v4-kicker">ACTA FINAL · JORNADA ${S.round+1}</span><h1>${outcome==='VICTORIA'?'Tres puntos para el equipo.':outcome==='EMPATE'?'Reparto de puntos.':'Hay que reaccionar.'}</h1><p>${esc(S.club.name)} ${r.us} – ${r.them} ${esc(r.opp)} · ${outcome}</p></div>${v4Tag(outcome)}</div><div class="v4-compactmetrics"><div><small>Tu nota</small><b>${r.minutes?r.rating.toFixed(1):'—'}</b></div><div><small>Minutos</small><b>${r.minutes}</b></div><div><small>Goles + asist.</small><b>${r.goals+r.assists}</b></div><div><small>Clasificación</small><b>${sortedTable().findIndex(z=>z.name===S.club.name)+1}º</b></div></div>${show?`<section class="v4-panel fdg6-press"><span class="v4-kicker">ZONA MIXTA · ${esc(x.media)} · ${x.lang==='es'?'ESPAÑOL':'TRADUCIDO AL ESPAÑOL'}</span><h2>${esc(x.question)}</h2><div class="v4-choices">${x.choices.map((a,i)=>`<button class="v4-option" onclick="Game.pressV6(${i})"><b>«${esc(a[0])}»</b><small>${esc(a[2])}</small></button>`).join('')}</div></section>`:`<section class="v4-panel fdg6-no-press"><h3>${x?.type?'Declaraciones realizadas':'Hoy no hay comparecencia de prensa'}</h3><p>${x?.consequence?esc(x.consequence):'No hay una noticia deportiva que justifique una entrevista esta jornada. El fútbol también transcurre sin titulares.'}</p></section>`}<section class="v4-panel fdg6-next"><div><h3>¿Qué viene ahora?</h3><p>${market.open?market.name+' en marcha. ':''}El equipo recuperará fuerzas y preparará el próximo encuentro. Tu progreso se conserva automáticamente.</p></div><button class="btn" onclick="Game.next()">${S.round+1>=S.schedule.length?'Terminar temporada':'Siguiente jornada'} →</button></section></div>`;
}
const fdg6OriginalNext=window.Game.next;
window.Game.next=function(){if(S?.view==='post'){fdg6WorldInit();const prevKey=`${S.year}-${S.seasonNo}-${S.round}`;fdg6OriginalNext();if(S&&S.stage!=='draft'){fdg6WorldWeek();persist();}}};
const fdg6OriginalNews=v4News;
v4News=fdg6News;
v4Post=fdg6Post;
window.Game.pressV6=fdg6PressChoice;
window.Game.newsFilter=function(type){S.newsFilter=type;render();};
const FDG6_CONTEXT=[
 {kind:'training',test:()=>S.lastResult?.goals>0,text:'El entrenador prepara un ejercicio de desmarques después de tus goles ante {rival}. El reto es repetir los movimientos sin caer en fuera de juego.',title:'Repetir lo que funcionó',opts:[['Trabajar temporización',{trust:4,focus:3,fitness:-3},'Mejoras tus tiempos de carrera.'],['Practicar la definición',{focus:4,fitness:-4},'Mantienes el acierto de cara a puerta.'],['Relajarte después del éxito',{morale:3,trust:-2},'Disfrutas el reconocimiento, pero bajas el ritmo.']]},
 {kind:'training',test:()=>S.lastResult?.assists>0,text:'El vídeo del último partido muestra tu asistencia. Los técnicos quieren profundizar en las líneas de pase.',title:'La asistencia bajo la lupa',opts:[['Analizar rivales y apoyos',{focus:6,trust:2},'Lees mejor los espacios.'],['Repetir último pase',{trust:3,fitness:-3},'Pules la ejecución.'],['Elegir ejercicios físicos',{fitness:-6,trust:2},'Ganas intensidad, pero trabajas menos con balón.']]},
 {kind:'training',test:()=>S.lastResult?.rating>0&&S.lastResult.rating<5.7,text:'El analista ha preparado una selección de tus errores ante {rival}. El vídeo es incómodo, pero útil.',title:'Analizar una mala actuación',opts:[['Reconocer tus errores',{focus:6,trust:3},'Sales con un plan de mejora.'],['Solicitar ejemplos del equipo',{chemistry:3,focus:4},'Analizas alternativas colectivas.'],['Defender cada jugada',{trust:-5,focus:-2},'No consigues aprovechar la sesión.']]},
 {kind:'life',test:()=>S.lastResult?.goals>0&&S.player.rep>10,text:'Tras tu gol, un pequeño medio local te propone una entrevista. El club te recomienda medir tus palabras.',title:'Micrófonos después del gol',opts:[['Hablar de tus compañeros',{chemistry:4,rep:2},'La entrevista cae bien en el vestuario.'],['Centrarte en tu evolución',{focus:3,rep:3},'Reafirmas tus objetivos.'],['Exagerar tu importancia',{rep:5,trust:-4},'Tu confianza provoca críticas.']]},
 {kind:'life',test:()=>S.lastResult?.minutes===0&&S.stats.apps>2,text:'El banquillo contra {rival} te ha dejado frustrado. Tu representante pregunta si quieres hablar con el cuerpo técnico.',title:'El peso de no jugar',opts:[['Pedir un plan de minutos',{focus:4,trust:2},'Clarificas tu papel en la plantilla.'],['Seguir entrenando en silencio',{trust:3,morale:-1},'Demuestras paciencia.'],['Pedir una salida inmediata',{trust:-5,rep:2},'Tu petición genera tensión.']]},
 {kind:'life',test:()=>fdg6Market().open&&S.watchlist?.length>0,text:'La {window} está abierta. Tu agente recibe llamadas, pero recuerda que el interés no equivale a un contrato.',title:'Rumores durante el mercado',opts:[['Concentrarme en el club',{trust:4,focus:3},'Reduces el ruido.'],['Escuchar informes discretamente',{rep:2,focus:1},'Entiendes qué buscan los clubes.'],['Filtrar mi interés',{rep:4,trust:-5},'El vestuario se incomoda.']]}
];
const fdg6PriorEvent=v4EventFor;
v4EventFor=function(day){
 v4Init();let kind=day===0?'training':'life';if(S.day.events[kind])return S.day.events[kind];
 const pool=FDG6_CONTEXT.filter(e=>e.kind===kind&&e.test()&&!(S.eventHistory||[]).slice(-28).includes('v6:'+e.title));
 if(pool.length&&Math.random()<.79){const e=fdg6Pick(pool);return S.day.events[kind]={id:'v6:'+e.title,title:e.title,text:v4Token(e.text.replace('{window}',fdg6Market().name)),choices:e.opts};}
 return fdg6PriorEvent(day);
};
// The existing v4 storage key and version=3 format are intentionally unchanged.
if(S){fdg6WorldInit();persist();render();}