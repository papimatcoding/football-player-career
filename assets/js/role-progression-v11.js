/* FUERA DE GUIÓN 11 — lightweight per-role mastery, separate from overall rating.
 * Existing localStorage saves keep the same key and their player data unchanged.
 */
'use strict';
const FDG11_ROLE_LIST={
 POR:[['portero','Portero'],['portero_libero','Portero líbero']],
 DFC:[['central_cobertura','Central de cobertura'],['central_anticipador','Central anticipador']],
 LI:[['lateral_defensivo','Lateral defensivo'],['lateral_ofensivo','Lateral ofensivo'],['lateral_invertido','Lateral invertido']],
 LD:[['lateral_defensivo','Lateral defensivo'],['lateral_ofensivo','Lateral ofensivo'],['lateral_invertido','Lateral invertido']],
 MCD:[['pivote','Pivote'],['organizador','Organizador'],['box_to_box','Todoterreno']],
 MC:[['organizador','Organizador'],['box_to_box','Todoterreno'],['pivote','Pivote']],
 MCO:[['mediapunta','Mediapunta'],['organizador','Organizador']],
 ED:[['extremo','Extremo'],['extremo_interior','Extremo interior']],
 EI:[['extremo','Extremo'],['extremo_interior','Extremo interior']],
 DC:[['delantero_avanzado','Delantero avanzado'],['cazagoles','Cazagoles'],['falso_nueve','Falso 9'],['delantero_presion','Delantero presionante']]
};

// Archetypes are original career specialisations, NOT EA player-role ratings.
// A choice changes two small technical tendencies; it never grants Role+ or Role++.
const FDG11_ARCHETYPES={
 POR:[
  {id:'guardameta',name:'Guardameta seguro',desc:'Lectura y blocaje',boost:{keeper:2,composure:2}},
  {id:'libero',name:'Portero líbero',desc:'Salida de balón y movilidad',boost:{pass:3,pace:2}}
 ],
 DFC:[
  {id:'muro',name:'Muro',desc:'Duelos y contundencia',boost:{tackle:3,composure:2}},
  {id:'anticipador',name:'Anticipador',desc:'Intervenir antes y corregir',boost:{pace:2,tackle:2}},
  {id:'constructor',name:'Central constructor',desc:'Primer pase y templanza',boost:{pass:3,composure:2}}
 ],
 LATERAL:[
  {id:'carrilero',name:'Carrilero',desc:'Recorrido y centros',boost:{pace:3,pass:2}},
  {id:'cierre',name:'Lateral de cierre',desc:'Robos y seguridad',boost:{tackle:3,composure:2}},
  {id:'interior',name:'Lateral interior',desc:'Asociarse por dentro',boost:{pass:3,technique:2}}
 ],
 MEDIO:[
  {id:'organizador',name:'Organizador',desc:'Circular y filtrar pases',boost:{pass:3,composure:2}},
  {id:'todoterreno',name:'Todoterreno',desc:'Ir y volver con intensidad',boost:{pace:2,tackle:2}},
  {id:'llegador',name:'Llegador',desc:'Aparecer para finalizar',boost:{shot:2,finishing:3}}
 ],
 EXTREMO:[
  {id:'desbordador',name:'Desbordador',desc:'Ganar metros por banda',boost:{pace:3,technique:2}},
  {id:'interior',name:'Extremo interior',desc:'Diagonal y remate colocado',boost:{shot:2,curve:3}},
  {id:'creador',name:'Creador abierto',desc:'Asistencia y último pase',boost:{pass:3,technique:2}}
 ],
 PUNTA:[
  {id:'finalizador',name:'Finalizador',desc:'Desmarque y remate',boost:{shot:3,finishing:2}},
  {id:'asociativo',name:'Falso nueve',desc:'Bajar y crear juego',boost:{pass:3,technique:2}},
  {id:'presionante',name:'Delantero presionante',desc:'Molestar la salida rival',boost:{pace:2,tackle:3}}
 ]
};
function fdg11ArchetypeOptions(pos){
 const group=pos==='POR'?'POR':pos==='DFC'?'DFC':
  ['LI','LD'].includes(pos)?'LATERAL':['MC','MCD','MCO'].includes(pos)?'MEDIO':
  ['ED','EI'].includes(pos)?'EXTREMO':'PUNTA';
 return FDG11_ARCHETYPES[group];
}
function fdg11Archetype(pos,key){
 const options=fdg11ArchetypeOptions(pos);
 return options.find(a=>a.id===key)||options[0];
}

function fdg11Roles(p){
 if(!p)return null;
 if(!p.roleTraining||typeof p.roleTraining!=='object')p.roleTraining={xp:0,level:1,points:0,mastery:{},selected:null};
 const r=p.roleTraining;
 if(!r.mastery||typeof r.mastery!=='object')r.mastery={};
 r.xp=Math.max(0,Number(r.xp)||0);r.level=Math.max(1,Math.floor(Number(r.level)||1));
 r.points=Math.max(0,Math.floor(Number(r.points)||0));
 const choices=FDG11_ROLE_LIST[p.pos]||[];
 if(!choices.some(([key])=>key===r.selected))r.selected=choices[0]?.[0]||null;
 if(!fdg11ArchetypeOptions(p.pos).some(a=>a.id===r.archetype))r.archetype=fdg11ArchetypeOptions(p.pos)[0].id;
 return r;
}
function fdg11RoleOptions(){return FDG11_ROLE_LIST[S?.player?.pos]||[];}
function fdg11RoleName(key){return fdg11RoleOptions().find(([k])=>k===key)?.[1]||key;}
function fdg11GrantXp(minutes,rating){
 const r=fdg11Roles(S?.player);if(!r||minutes<=0)return;
 r.xp+=Math.max(5,Math.round(minutes*.42+Math.max(0,rating-6)*7));
 const achieved=Math.floor(r.xp/115)+1;
 if(achieved>r.level){r.points+=achieved-r.level;r.level=achieved;}
 persist();
}
function fdg11ChooseRole(key){
 const r=fdg11Roles(S?.player);if(!r||!fdg11RoleOptions().some(x=>x[0]===key))return;
 r.selected=key;persist();render();
}
function fdg11UpgradeRole(key){
 const r=fdg11Roles(S?.player);if(!r||!fdg11RoleOptions().some(x=>x[0]===key))return;
 const now=r.mastery[key]||0,cost=now===0?1:now===1?2:Infinity;
 if(r.points<cost||now>=2)return;
 r.points-=cost;r.mastery[key]=now+1;persist();render();
 notify(fdg11RoleName(key)+(now===0?' + desbloqueado':' ++ desbloqueado'));
}

function fdg11ChooseArchetype(id){
 const p=S?.player,r=fdg11Roles(p);
 if(!r||!fdg11ArchetypeOptions(p.pos).some(a=>a.id===id))return;
 r.archetype=id;
 persist();render();
 notify('Arquetipo seleccionado: '+fdg11Archetype(p.pos,id).name);
}

function fdg11RolePanel(){
 const r=fdg11Roles(S?.player),options=fdg11RoleOptions();
 if(!r||!options.length)return '';
 const next=(r.level*115-r.xp);
 return `<section class="v4-panel fdg11-role-panel">
  <div class="v4-paneltitle"><h2>Especialización de roles</h2><span>Nivel ${r.level} · ${r.points} punto(s)</span></div>
  <p class="micro">Cada rol tiene su propia familiaridad: Base, + o ++. La media general no concede mejoras automáticas. Ganas XP jugando partidos; puedes subir de nivel sin completar un árbol enorme.</p>
  <div class="fdg11-role-progress"><div style="width:${Math.max(0,Math.min(100,100*(r.xp%115)/115))}%"></div></div>
  <p class="micro">${next} XP para el siguiente punto · Conseguir + cuesta 1 punto; ++ cuesta 2.</p>
  <div class="fdg11-archetypes">
   <div class="fdg11-archetypes-heading"><b>Tu arquetipo</b><small>Una especialidad activa · puedes cambiarla antes de jugar</small></div>
   <div class="fdg11-archetype-choices">
   ${fdg11ArchetypeOptions(S.player.pos).map(a=>{
    const chosen=a.id===r.archetype;
    return `<button type="button" class="fdg11-archetype-option ${chosen?'selected':''}" onclick="Game.archetypeChoose('${a.id}')" aria-pressed="${chosen?'true':'false'}">
     <strong>${esc(a.name)}</strong><small>${esc(a.desc)}</small>${chosen?'<span>Activo</span>':''}</button>`;
   }).join('')}
   </div>
  </div>
  <div class="fdg11-roles">
  ${options.map(([key,name])=>{
    const n=Math.max(0,Math.min(2,r.mastery[key]||0)),cost=n===0?1:n===1?2:99;
    return `<div class="fdg11-role-row">
      <div><b>${esc(name)}${n===1?' +':n===2?' ++':''}</b><small>${r.selected===key?'Rol equipado':n===0?'Familiaridad Base':'Especialización desbloqueada'}</small></div>
      <div class="fdg11-role-actions"><button class="tinybtn" ${r.selected===key?'disabled':''} onclick="Game.roleChoose('${key}')">${r.selected===key?'Equipado':'Equipar'}</button>
      <button class="tinybtn" ${n>=2||r.points<cost?'disabled':''} onclick="Game.roleUpgrade('${key}')">${n===0?'+ (1)':n===1?'++ (2)':'Máximo'}</button></div>
    </div>`;
  }).join('')}</div>
 </section>`;
}
const fdg11PreviousProfile=profile;
profile=function(){return fdg11PreviousProfile()+fdg11RolePanel();};
window.Game.roleChoose=fdg11ChooseRole;
window.Game.roleUpgrade=fdg11UpgradeRole;
window.Game.archetypeChoose=fdg11ChooseArchetype;
window.FDG11Roles={get:fdg11Roles,grant:fdg11GrantXp,options:fdg11RoleOptions,
 archetypes:fdg11ArchetypeOptions,archetype:fdg11Archetype};
