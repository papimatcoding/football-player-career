/* Football Life Simulator V4 · Navigation and semantic polish.
   UI-only adapter; no gameplay, save, simulation or router changes. */
(function(){
  'use strict';
  if(window.FLS_PRECISION?.installed)return;
  function apply(){
    const root=document.querySelector('.v4-shell');
    const inCareer=!!root && !!window.FLSUI;
    if(!inCareer)return;
    root.classList.add('fls-v4');
    const main=root.querySelector('.v4-main');
    if(main){
      main.id='fls-main-content';
      main.setAttribute('tabindex','-1');
      main.setAttribute('aria-label','Contenido de Football Life Simulator');
    }
    const mobile=root.querySelector('.v4-mobbrand strong');
    if(mobile){
      mobile.textContent='FOOTBALL LIFE';
      mobile.title='Football Life Simulator';
    }
    root.querySelectorAll('.v4-navbtn,.v4-bottomnav button').forEach(function(button){
      if(button.classList.contains('active'))button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
      const label=button.querySelector('b,small')?.textContent?.trim();
      if(label && !button.hasAttribute('aria-label'))button.setAttribute('aria-label',label);
      button.setAttribute('type','button');
    });
    const steps=root.querySelector('.v4-steps');
    if(steps){
      steps.setAttribute('role','group');
      steps.setAttribute('aria-label','Etapas de la jornada');
      steps.querySelectorAll('.v4-step').forEach(function(button,i){
        if(button.classList.contains('current'))button.setAttribute('aria-current','step');
        else button.removeAttribute('aria-current');
        button.setAttribute('type','button');
        const label=button.querySelector('b')?.textContent?.trim();
        if(label)button.setAttribute('aria-label','Etapa '+(i+1)+': '+label);
      });
    }
    root.querySelectorAll('.fls-fixture,.v4-bigfixture').forEach(function(fixture){
      const names=[...fixture.querySelectorAll(':scope > div b,:scope > b')].map(el=>el.textContent.trim()).filter(Boolean);
      if(names.length===2){
        fixture.setAttribute('role','group');
        fixture.setAttribute('aria-label','Partido: '+names[0]+' contra '+names[1]);
      }
    });
    const progress=root.querySelector('.v4-progressline');
    if(progress && typeof S!=='undefined' && S?.match){
      progress.setAttribute('role','progressbar');
      progress.setAttribute('aria-label','Progreso del partido');
      progress.setAttribute('aria-valuemin','0');
      progress.setAttribute('aria-valuemax','90');
      progress.setAttribute('aria-valuenow',String(Math.min(90,Math.max(0,Math.round(S.match.minute||0)))));
    }
    const score=root.querySelector('.fdg11-scoreboard');
    if(score){
      score.setAttribute('role','group');
      score.setAttribute('aria-label','Marcador en directo');
    }
    const news=root.querySelector('.fls-v3-frontpage');
    if(news){
      news.setAttribute('aria-label','Noticias de la carrera');
    }
    root.querySelectorAll('.v4-panel .btn,.v4-main .pick,.v4-main .v4-option,.v4-main .v4-drill').forEach(function(button){
      if(button.tagName==='BUTTON' && !button.getAttribute('type'))button.setAttribute('type','button');
    });
  }
  const previous=render;
  render=function(){
    const result=previous.apply(this,arguments);
    try{apply();}catch(error){console.warn('FLS precision UI:',error);}
    return result;
  };
  window.FLS_PRECISION={installed:true,version:'4.0.0'};
  render();
})();