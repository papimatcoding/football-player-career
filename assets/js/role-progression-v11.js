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
function fdg11Roles(p){
 if(!p)return null;
 if(!p.roleTraining||typeof p.roleTraining!=='object')p.roleTraining={xp:0,level:1,points:0,mastery:{},selected:null};
 const r=p.roleTraining;
 if(!r.mastery||typeof r.mastery!=='object')r.mastery={};
 r.xp=Math.max(0,Number(r.xp)||0);r.level=Math.max(1,Math.floor(Number(r.level)||1));
 r.points=Math.max(0,Math.floor(Number(r.points)||0));
 const choices=FDG11_ROLE_LIST[p.pos]||[];
 if(!choices.some(([key])=>key===r.selected))r.selected=choices[0]?.[0]||null;
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
function fdg11RolePanel(){
 const r=fdg11Roles(S?.player),options=fdg11RoleOptions();
 if(!r||!options.length)return '';
 const next=(r.level*115-r.xp);
 return `<section class="v4-panel fdg11-role-panel">
  <div class="v4-paneltitle"><h2>Especialización de roles</h2><span>Nivel ${r.level} · ${r.points} punto(s)</span></div>
  <p class="micro">Cada rol tiene su propia familiaridad: Base, + o ++. La media general no concede mejoras automáticas. Ganas XP jugando partidos; puedes subir de nivel sin completar un árbol enorme.</p>
  <div class="fdg11-role-progress"><div style="width:${Math.max(0,Math.min(100,100*(r.xp%115)/115))}%"></div></div>
  <p class="micro">${next} XP para el siguiente punto · Conseguir + cuesta 1 punto; ++ cuesta 2.</p>
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
window.FDG11Roles={get:fdg11Roles,grant:fdg11GrantXp,options:fdg11RoleOptions};
