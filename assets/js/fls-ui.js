
/* Football Life Simulator — non-destructive presentation adapter (2026). */
(function(){
  'use strict';
  if(window.FLSUI && window.FLSUI.installed)return;
  var repo='https://raw.githubusercontent.com/JoseArroyave/football-logos/refs/heads/main/logos/spain/';
  var crests={
    'AD Alcorcón':'Alcorcón.svg','Algeciras CF':'Algeciras.svg','Antequera CF':'Antequera.svg',
    'CD Teruel':'Teruel.svg','CE Europa':'CE_Europa.svg','Rayo Majadahonda':'Rayo_Majadahonda.svg',
    'FC Cartagena':'FC_Cartagena.svg','Nàstic de Tarragona':'Gimnàstic_de_Tarragona.svg',
    'Hércules CF':'Hércules.svg','Juventud Torremolinos':'Juventud_Torremolinos.svg',
    'Real Jaén':'Real_Jaén_CF.svg','Real Murcia':'Real_Murcia.svg','Real Zaragoza':'Real_Zaragoza.svg',
    'SD Huesca':'Huesca.svg','CD Castellón':'Castellón.svg',
    'UD Almería':'Almería.svg','SD Eibar':'Eibar.svg','Girona FC':'Girona.svg',
    'Granada CF':'Granada.svg','Burgos CF':'Burgos_CF.svg','RCD Mallorca':'Mallorca.svg',
    'Sporting de Gijón':'Sporting_Gijón.svg','Real Oviedo':'Oviedo.svg','CE Sabadell':'Sabadell.svg',
    'Córdoba CF':'Córdoba.svg','CD Eldense':'CD_Eldense.svg','CD Tenerife':'Tenerife.svg',
    'UD Las Palmas':'Las_Palmas.svg','Real Valladolid':'Real_Valladolid.svg',
    'Celta Fortuna':'Celta.svg','CD Leganés':'Leganés.svg','Cádiz CF':'Cádiz_CF.svg',
    'FC Andorra':'FC_Andorra.svg','Real Sociedad B':'Real_Sociedad.svg','AD Ceuta':'Ceuta.svg',
    'Albacete BP':'Albacete.svg','Real Madrid':'Real_Madrid.svg',
    'Atlético de Madrid':'Atletico_Madrid.svg','FC Barcelona':'Barcelona.svg',
    'Real Betis':'Real_Betis.svg','Racing de Santander':'Racing_Santander.svg',
    'Deportivo Alavés':'Deportivo_Alavés.svg','Real Sociedad':'Real_Sociedad.svg',
    'Getafe CF':'Getafe.svg','Sevilla FC':'Sevilla.svg','Athletic Club':'Athletic_Club_Bilbao.svg',
    'RC Celta':'Celta.svg','CA Osasuna':'Osasuna.svg','Levante UD':'Levante.svg',
    'Rayo Vallecano':'Rayo_Vallecano.svg','RC Deportivo':'Deportivo_La_Coruña.svg',
    'Villarreal CF':'Villarreal.svg'
  };
  var flags={'España':'es','Inglaterra':'gb-eng','Italia':'it','Alemania':'de','Francia':'fr',
    'Portugal':'pt','Países Bajos':'nl','Bélgica':'be','Dinamarca':'dk','Escocia':'gb-sct',
    'Turquía':'tr','Austria':'at','Suiza':'ch','Noruega':'no','Suecia':'se','Polonia':'pl',
    'Chequia':'cz','Croacia':'hr','Grecia':'gr','Brasil':'br','Argentina':'ar','Uruguay':'uy',
    'México':'mx','Estados Unidos':'us','Colombia':'co','Chile':'cl','Japón':'jp',
    'Corea del Sur':'kr','Arabia Saudí':'sa','Australia':'au','Marruecos':'ma','Egipto':'eg',
    'Sudáfrica':'za'};
  var glyph={
    hub:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-8h6v8"/>',
    training:'<path d="M5 8v8M19 8v8M2 10v4M22 10v4M5 12h14"/>',
    life:'<path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11Z"/>',
    match:'<circle cx="12" cy="12" r="9"/><path d="m12 6 4 3-1.5 4.5h-5L8 9zM9.5 13.5 6 17m8.5-3.5L18 17M12 6V3"/>',
    player:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2c0-4 3-6 8-6s8 2 8 6v2"/>',
    league:'<path d="M4 20V10M10 20V5M16 20v-8M22 20V3M2 21h22"/>',
    agent:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13c5 3 13 3 18 0"/>',
    history:'<path d="M8 3h8v5a4 4 0 0 1-8 0zM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 12v5m-5 4h10m-5-4v4"/>',
    news:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h3M7 16h10M13 12h4"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.2 2.2m9.8 9.8 2.2 2.2m0-14.2-2.2 2.2M7.1 16.9l-2.2 2.2"/>'
  };
  function element(tag,cls,text){
    var e=document.createElement(tag);
    if(cls)e.className=cls;
    if(text!==undefined)e.textContent=String(text);
    return e;
  }
  function icon(name){return '<svg class="fls-navsvg" viewBox="0 0 24 24" aria-hidden="true">'+(glyph[name]||glyph.hub)+'</svg>';}
  function crest(name,large){
    var el=element('span','fls-crest'+(large?' fls-crest-lg':''));
    el.title=name;el.setAttribute('role','img');el.setAttribute('aria-label','Escudo de '+name);
    var fallback=element('span','fls-fallback',(name||'FC').split(/\s+/).map(function(s){return s[0]||'';}).join('').slice(0,3));
    el.appendChild(fallback);
    var file=crests[name];
    if(file){
      var img=element('img');
      img.src=repo+encodeURIComponent(file);
      img.alt='';
      img.loading=large?'eager':'lazy';
      img.decoding='async';
      img.addEventListener('error',function(){el.classList.add('fls-failed');});
      el.insertBefore(img,fallback);
    }else el.classList.add('fls-failed');
    return el;
  }
  function flag(country){
    var code=flags[country];if(!code)return null;
    var img=element('img','fls-flag');
    img.src='https://flagcdn.com/'+code+'.svg';img.alt='Bandera de '+country;
    img.title=country;img.loading='lazy';img.decoding='async';
    img.addEventListener('error',function(){img.remove();});
    return img;
  }
  function rename(){
    document.title='Football Life Simulator — Carrera de futbolista';
    document.querySelectorAll('.v4-brand strong').forEach(function(e){e.textContent='FOOTBALL LIFE';});
    document.querySelectorAll('.v4-brand small').forEach(function(e){e.textContent='SIMULATOR · CAREER MODE';});
    document.querySelectorAll('.v4-mobbrand strong,.v4-entry .brandname').forEach(function(e){e.textContent='FOOTBALL LIFE SIMULATOR';});
    document.querySelectorAll('.v4-entry .v4-top strong').forEach(function(e){if(e.textContent.indexOf('FUERA')>=0)e.textContent='FOOTBALL LIFE SIMULATOR';});
    document.querySelectorAll('.v4-entry .setuphero h1').forEach(function(e){e.textContent='FOOTBALL LIFE SIMULATOR';});
    document.querySelectorAll('.v4-entry .setuphero p').forEach(function(e){
      e.textContent='De la cantera al fútbol profesional. Crea tu futbolista, toma decisiones importantes y construye una carrera diferente en cada partida.';
    });
    document.querySelectorAll('.v4-brand .brandicon,.v4-mobbrand .brandicon,.v4-entry .brandicon').forEach(function(e){e.textContent='FL';});
  }
  function navigation(){
    document.querySelectorAll('.v4-navbtn,.v4-bottomnav button').forEach(function(button){
      var handler=button.getAttribute('onclick')||'';
      var match=handler.match(/Game\.tab\('([^']+)'\)/);
      if(!match)return;
      var span=button.querySelector('span');if(span)span.innerHTML=icon(match[1]);
      if(match[1]==='agent'){var label=button.querySelector('b,small');if(label)label.textContent='Mercado';}
      if(match[1]==='history'){var label2=button.querySelector('b,small');if(label2)label2.textContent='Carrera';}
    });
  }
  function clubline(){
    if(!S)return;
    var node=document.querySelector('.v4-clubline');if(!node)return;
    node.insertBefore(crest(S.club.name,false),node.firstChild);
    var details=node.querySelector('div');if(!details)return;
    var country=flag(S.club.country);
    if(country){
      var label=element('div','fls-clubchip');
      label.appendChild(country);
      label.appendChild(element('small','',S.club.country));
      details.appendChild(label);
    }
  }
  function home(){
    if(!S||S.view!=='hub'||activeTab!=='hub')return;
    var panel=document.querySelector('.v4-feature');if(!panel)return;
    var next=upcoming(),day=S.day&&typeof S.day.index==='number'?S.day.index:0;
    var phase=V4_DAYS[day]||V4_DAYS[0];
    panel.textContent='';
    panel.appendChild(element('div','v4-kicker','PRÓXIMO PARTIDO · JORNADA '+(S.round+1)));
    panel.appendChild(element('h2','','Todo preparado para competir.'));
    if(next&&next.pair){
      var fixture=element('div','fls-fixture');
      function team(name){
        var side=element('div','');
        side.appendChild(crest(name,true));
        side.appendChild(element('b','',name));
        return side;
      }
      fixture.appendChild(team(next.pair[0]));
      fixture.appendChild(element('span','fls-vs','VS'));
      fixture.appendChild(team(next.pair[1]));
      panel.appendChild(fixture);
    }else panel.appendChild(element('p','','El calendario de esta temporada ha terminado.'));
    var hint=element('div','fls-primaryhint');
    hint.appendChild(element('strong','','HOY · '+phase.name+'  '));
    hint.appendChild(document.createTextNode(phase.hint||''));
    panel.appendChild(hint);
    var cta=element('button','btn',day===2?'IR AL PARTIDO  →':'CONTINUAR MI SEMANA  →');
    cta.type='button';
    cta.addEventListener('click',function(){Game.openPhase(day);});
    panel.appendChild(cta);
    var grid=document.querySelector('.v4-homegrid');if(!grid)return;
    var note=element('section','v4-panel fls-news-card');
    var head=element('div','fls-newshead');
    head.appendChild(element('h3','','Noticias de tu carrera'));
    var go=element('button','','Ver todas');
    go.type='button';go.addEventListener('click',function(){Game.tab('news');});
    head.appendChild(go);
    note.appendChild(head);
    note.appendChild(element('p','',(S.inbox&&S.inbox[0]&&S.inbox[0].text)||'Tus actuaciones y decisiones aparecerán aquí cuando avance la temporada.'));
    var shortcuts=document.querySelector('.v4-shortcuts');
    if(shortcuts&&shortcuts.parentNode)shortcuts.parentNode.insertBefore(note,shortcuts.nextSibling);
    document.querySelectorAll('.v4-shortcuts strong').forEach(function(e){
      e.textContent=e.textContent.replace(/^[^a-zA-ZÁÉÍÓÚáéíóúÑñ]+/,'');
    });
  }
  function fixtures(){
    var big=document.querySelector('.v4-bigfixture');
    if(big){
      var teams=big.querySelectorAll(':scope > b');
      teams.forEach(function(node){
        node.insertBefore(crest(node.textContent.trim(),true),node.firstChild);
      });
    }
    var scoreboard=document.querySelector('.v4-scoreteams');
    if(scoreboard){
      scoreboard.querySelectorAll(':scope > b').forEach(function(node){
        node.insertBefore(crest(node.textContent.trim(),false),node.firstChild);
      });
    }
  }
  function player(){
    if(!S||S.view!=='hub'||activeTab!=='player')return;
    var top=document.querySelector('.v4-main .profiletop');if(!top)return;
    var chip=element('div','fls-clubchip');
    chip.appendChild(crest(S.club.name,false));
    var f=flag(S.club.country);if(f)chip.appendChild(f);
    chip.appendChild(element('span','','Club actual · '+S.club.name));
    top.parentNode.insertBefore(chip,top.nextSibling);
    var nation=S.player.nationality||'España';
    var nationality=element('div','fls-clubchip fls-nationality');
    var nationalityFlag=flag(nation);
    if(nationalityFlag)nationality.appendChild(nationalityFlag);
    nationality.appendChild(element('span','','Nacionalidad · '+nation));
    chip.parentNode.insertBefore(nationality,chip.nextSibling);
  }
  function post(){
    if(!S||S.view!=='post')return;
    var board=document.querySelector('.v4-post .scoreboard');
    if(!board)return;
    board.querySelectorAll('.teamname').forEach(function(label){
      var teamName=label.textContent.trim();
      label.parentNode.insertBefore(crest(teamName,true),label);
    });
  }
  function decorate(){
    rename();navigation();
    if(!S)return;
    var shell=document.querySelector('.v4-shell');
    if(shell)shell.dataset.flsView=S.view;
    clubline();home();fixtures();player();post();
  }
  var original=render;
  render=function(){var response=original.apply(this,arguments);try{decorate();}catch(err){console.warn('FLSUI decoration:',err);}return response;};
  window.FLSUI={installed:true,version:'1.0.0',crestUrl:function(name){return crests[name]?repo+encodeURIComponent(crests[name]):null;},flagUrl:function(country){return flags[country]?'https://flagcdn.com/'+flags[country]+'.svg':null;}};
  render();
})();
