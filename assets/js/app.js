/* Presentation controller: preserve scroll, compact navigation, fullscreen and safe resume. */
'use strict';
const FDG5={compact:store.getItem('fdg_compact_sidebar')==='1'};
const fdgPreviousRender=render;
render=function(){
 const scrollY=window.scrollY;
 const previousMain=document.querySelector('.v4-main');
 const mainScroll=previousMain?previousMain.scrollTop:0;
 fdgPreviousRender();
 const shell=document.querySelector('.v4-shell');
 if(shell){
  shell.classList.toggle('fdg-compact-nav',FDG5.compact);
  const topbar=document.querySelector('.v4-tools');
  if(topbar){
   const node=document.createElement('div');node.className='fdg-tools';
   node.innerHTML=`<button title="${FDG5.compact?'Expandir':'Compactar'} menú" aria-label="${FDG5.compact?'Expandir':'Compactar'} menú" onclick="Game.toggleNav()">☰</button><button title="Pantalla completa" aria-label="Activar o desactivar pantalla completa" onclick="Game.fullscreen()">⛶</button>`;
   topbar.prepend(node);
  }
 }
 // Rebuilding an entire view should never force the reader to the beginning.
 requestAnimationFrame(()=>{window.scrollTo({top:Math.min(scrollY,Math.max(0,document.documentElement.scrollHeight-innerHeight)),behavior:'instant'});const nextMain=document.querySelector('.v4-main');if(nextMain)nextMain.scrollTop=mainScroll;fdgDraw();});
 if(S?.view==='match'&&S.match?.live&&!S.match.live.done)fdgResumeTicker();
};
function fdgToggleNav(){FDG5.compact=!FDG5.compact;store.setItem('fdg_compact_sidebar',FDG5.compact?'1':'0');document.querySelector('.v4-shell')?.classList.toggle('fdg-compact-nav',FDG5.compact)}
async function fdgFullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else notify('Este navegador no permite la pantalla completa desde aquí.');}
 catch(e){notify('El navegador ha rechazado el modo de pantalla completa.');}
}
const fdgPreviousMatchScreen=v4MatchScreen;
v4MatchScreen=fdgLiveView;
window.Game.playMatch=fdgStartLive;
window.Game.livePause=fdgTogglePause;
window.Game.liveSpeed=fdgSpeed;
window.Game.liveSkip=fdgSkip;
window.Game.liveClose=fdgClose;
window.Game.toggleNav=fdgToggleNav;
window.Game.fullscreen=fdgFullscreen;
// Include updated navigation methods in the command bridge.
const fdgOldTab=window.Game.tab;
window.Game.tab=function(tab){if(S?.view==='match'&&S.match?.live&&!S.match.live.done){notify('Termina el partido antes de salir de la retransmisión.');return;}fdgOldTab(tab)};
// Restored autosaves from earlier versions remain supported (V4 schema unchanged).
if(S){if(S.match?.live&&S.view==='match'&&!S.match.live.done)fdgResumeTicker();render()}
else render();