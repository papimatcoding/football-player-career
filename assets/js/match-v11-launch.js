/* FUERA DE GUIÓN 11 — legacy-compatible loader for the standalone MatchLab engine.
 * Never touches the existing save key; already started V6/V10 games still use
 * their historical event ledger and painter.
 */
'use strict';
window.FDG11Career={
 state:()=>S,
 render:()=>render(),
 save:()=>persist(),
 finish:()=>finishMatch(true),
 club:name=>getClub(name),
 roster:()=>f10Lineups(),
 number:()=>fdg9HeroNumber(),
 heroOldIndex:()=>fdgHeroIndex(),
 updateRating:()=>fdgUpdateRating(),
 oldStop:()=>{fdg6Stop();fdgStopTicker();},
 role:()=>window.FDG11Roles
};
(function(){
 const originalScreen=v4MatchScreen;
 v4MatchScreen=function(){
  return S?.match?.live?.engine===11&&window.FDG11?.screen?
    window.FDG11.screen():originalScreen();
 };
 const originalPlay=window.Game.playMatch;
 window.Game.playMatch=function(){
  if(S?.match?.started)return originalPlay();
  if(window.FDG11?.start)return window.FDG11.start();
  notify('El motor MatchLab se está cargando. Vuelve a pulsar Jugar.');
 };
 for(const [key,method] of [['livePause','pause'],['liveSpeed','speed'],['liveSkip','skip'],
   ['liveClose','close'],['halfContinue','continueHalf']]){
  const legacy=window.Game[key];
  window.Game[key]=function(...args){
   if(S?.match?.live?.engine===11)return window.FDG11?.[method]?.(...args);
   return legacy?.(...args);
  };
 }
 const originalResume=fdgResumeTicker;
 fdgResumeTicker=function(){
  if(S?.match?.live?.engine===11)return window.FDG11?.resume?.();
  return originalResume();
 };
 const originalRender=render;
 render=function(){
  originalRender();
  if(S?.match?.live?.engine===11){
   requestAnimationFrame(()=>window.FDG11?.afterRender?.());
  }
 };
 import('./match-v11.js?v=11.4').then(mod=>{
  window.FDG11=mod.installFDG11(window.FDG11Career);
  if(S?.match?.live?.engine===11&&S.view==='match'){
   window.FDG11.restore();
  }
 }).catch(err=>{
  console.error('No se ha podido cargar el motor MatchLab de carrera:',err);
  notify('No se pudo cargar MatchLab. Sigue disponible el sistema anterior al finalizar o actualizar.');
 });
})();
