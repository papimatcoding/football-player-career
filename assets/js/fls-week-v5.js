/* Football Life Simulator V5 — weekly journey / actual activity outcomes.
   DOM decoration only; career data, game actions and storage are unchanged. */
(function(){
  'use strict';
  if(window.FLS_WEEK?.installed)return;
  var phaseTitles=[
    ['ENTRENAMIENTO','Campo de entrenamiento','LUNES—MIÉRCOLES'],
    ['VIDA Y VESTUARIO','Fuera del césped','JUEVES—VIERNES'],
    ['PARTIDO','Día de partido','FIN DE SEMANA']
  ];
  var icons={
    finish:'↗',tech:'◇',pass:'⤳',def:'◈',gym:'▤',keeper:'◉',recover:'✦',
    rest:'☾',family:'♡',physio:'✚',mates:'◎',social:'◌',sponsor:'✧',extra:'⇧'
  };
  var labels={fitness:'Físico',trust:'Confianza',morale:'Moral',focus:'Concentración',chemistry:'Química',rep:'Reputación',money:'Saldo'};
  function el(tag,cls,copy){
    var n=document.createElement(tag);
    if(cls)n.className=cls;
    if(copy!==undefined)n.textContent=String(copy);
    return n;
  }
  function clampPct(v){return Math.min(100,Math.max(0,Number(v)||0));}
  function effect(value,key){
    if(typeof value!=='number'||value===0)return null;
    var clean=key==='money'?Math.round(value).toLocaleString('es-ES')+' €':String(value);
    return (value>0?'+':'')+clean+' '+(labels[key]||key);
  }
  function status(kind){
    var activity=!!S.week?.[kind];
    var resolved=S.day?.answers?.[kind]!==undefined;
    var skipped=!!S.day?.skipped?.[kind];
    return {activity:activity,resolved:resolved,skipped:skipped,total:(activity?1:0)+(resolved?1:0)};
  }
  function phaseRail(current){
    var wrap=el('section','fls-v5-rail');
    wrap.setAttribute('aria-label','Itinerario semanal');
    var left=el('div','fls-v5-rail-intro');
    left.appendChild(el('span','fls-v5-overline','EL CAMINO AL PARTIDO'));
    left.appendChild(el('strong','',String(S.round+1).padStart(2,'0')+' / '+(S.club?.parent||S.club?.name||'TU CLUB')));
    wrap.appendChild(left);
    var stages=el('div','fls-v5-rail-stages');
    phaseTitles.forEach(function(row,i){
      var step=el('div','fls-v5-rail-stage');
      var done=S.day.index>i||(current===i&&i<2&&status(i===0?'training':'life').total===2);
      var ongoing=S.day.index===i&&!done;
      step.classList.toggle('is-done',done);
      step.classList.toggle('is-current',ongoing);
      step.classList.toggle('is-future',!done&&!ongoing);
      var disc=el('span','fls-v5-rail-disc',done?'✓':String(i+1).padStart(2,'0'));
      step.appendChild(disc);
      var copy=el('span','fls-v5-rail-label');
      copy.appendChild(el('strong','',row[0]));
      copy.appendChild(el('small','',ongoing?'EN CURSO':done?'COMPLETADA':row[2]));
      step.appendChild(copy);
      if(ongoing)step.setAttribute('aria-current','step');
      stages.appendChild(step);
    });
    wrap.appendChild(stages);
    return wrap;
  }
  function scoreStatus(phase){
    var kind=phase===0?'training':'life';
    var name=phase===0?'Sesión':'Actividad';
    var state=status(kind);
    var board=el('section','fls-v5-preparation');
    board.setAttribute('aria-label','Preparación de la jornada');
    var intro=el('div','fls-v5-preparation-top');
    var copy=el('div','');
    copy.appendChild(el('span','fls-v5-overline','PROGRESO DE HOY'));
    var strong=el('strong','fls-v5-preparation-heading',state.total===2?'Listo para continuar':state.total===0?'Tu día empieza aquí':'A un paso de avanzar');
    copy.appendChild(strong);
    intro.appendChild(copy);
    intro.appendChild(el('span','fls-v5-preparation-count',state.total+' / 2'));
    board.appendChild(intro);
    var progress=el('div','fls-v5-preparation-track');
    progress.setAttribute('role','progressbar');
    progress.setAttribute('aria-label','Tareas completas de este día');
    progress.setAttribute('aria-valuemin','0');
    progress.setAttribute('aria-valuemax','2');
    progress.setAttribute('aria-valuenow',String(state.total));
    var fill=el('span','');
    fill.style.width=String(state.total*50)+'%';
    progress.appendChild(fill);
    board.appendChild(progress);
    var checks=el('div','fls-v5-preparation-tasks');
    var task1=el('span',state.activity?'is-complete':'is-pending',(state.activity?'✓':'○')+' '+(state.skipped?name+' omitida':name+(state.activity?' realizada':' pendiente')));
    var task2=el('span',state.resolved?'is-complete':'is-pending',(state.resolved?'✓':'○')+' '+(state.resolved?'Situación resuelta':'Situación pendiente'));
    checks.appendChild(task1);checks.appendChild(task2);board.appendChild(checks);
    if(state.total===2)board.classList.add('is-ready');
    return board;
  }
  function narrative(phase){
    var p=S.player||{},f=Number(p.fitness),m=Number(p.morale),t=Number(p.trust);
    if(phase===0){
      if(p.injured>0)return 'Parte médico activo. El trabajo regenerativo es tu alternativa durante la lesión.';
      if(f<45)return 'Llegas con las piernas cargadas. El tipo de sesión afectará a tu condición.';
      if(t<45)return 'El cuerpo técnico sigue tu evolución. Esta semana tienes margen para ganarte su confianza.';
      return 'Una buena sesión suma a tu desarrollo. Decide cuánto esfuerzo quieres asumir.';
    }
    if(m<42)return 'El estado de ánimo está bajo. Elige cómo cuidar tu equilibrio fuera del campo.';
    if(f<48)return 'Has acumulado desgaste. Tu tiempo libre puede ayudarte a llegar con mejores piernas.';
    return 'La convivencia, el descanso y la reputación también forman parte de tu carrera.';
  }
  function addPhase(phase){
    if(S.view!=='hub'||activeTab!==(phase===0?'training':'life'))return;
    var main=document.querySelector('.v4-main'),head=main?.querySelector('.v4-viewhead');
    if(!main||!head)return;
    main.classList.add('fls-v5-day','fls-v5-day-'+phase);
    var rail=phaseRail(phase);
    head.insertAdjacentElement('afterend',rail);
    /* An inactive day shows the archive/locked view: never imply tasks are actionable. */
    if(S.day?.index!==phase){main.classList.add('fls-v5-inactive-day');return;}
    var stats=main.querySelector('.v4-compactmetrics');
    if(stats){
      stats.classList.add('fls-v5-stats');
      stats.querySelectorAll(':scope > div').forEach(function(box,i){
        var k=phase===0?['fitness','trust','focus'][i]:['morale','chemistry',null][i];
        if(!k)return;
        box.classList.add('fls-v5-stat');
        var label=el('div','fls-v5-stat-track');
        label.setAttribute('aria-hidden','true');
        var bar=el('span','');
        bar.style.width=clampPct(S.player[k])+'%';
        bar.classList.toggle('is-low',S.player[k]<45);
        label.appendChild(bar);box.appendChild(label);
      });
      stats.insertAdjacentElement('afterend',scoreStatus(phase));
    }
    var grid=main.querySelector('.v4-traininggrid');
    if(!grid)return;
    grid.classList.add('fls-v5-choice-grid');
    var pack=el('div','fls-v5-editorial-note');
    pack.appendChild(el('span','fls-v5-note-rule',''));
    pack.appendChild(el('p','',narrative(phase)));
    grid.insertAdjacentElement('beforebegin',pack);
    var activity=grid.querySelector('section:first-child');
    var eventCard=grid.querySelector('.v4-event');
    if(activity)activity.classList.add('fls-v5-activity-panel');
    if(eventCard)eventCard.classList.add('fls-v5-event-panel');
    var source=phase===0?TRAININGS.filter(function(t){return t.id!=='keeper'||S.player.pos==='POR';}):LIFE;
    grid.querySelectorAll('.v4-drill').forEach(function(button,i){
      var item=source[i];if(!item)return;
      button.classList.add('fls-v5-activity');
      var icon=el('span','fls-v5-activity-icon',icons[item.id]||'◇');
      icon.setAttribute('aria-hidden','true');
      button.insertBefore(icon,button.firstChild);
      var extra=el('span','fls-v5-effects');
      var count=0;
      ['money','morale','chemistry','trust','focus','rep'].forEach(function(key){
        if(count>=3||!item[key])return;
        var chip=el('span','fls-v5-effect '+(item[key]>0?'is-positive':'is-negative'),effect(item[key],key));
        extra.appendChild(chip);count++;
      });
      if(extra.children.length)button.appendChild(extra);
      if(item.money<0&&S.player.balance<-item.money){
        button.classList.add('is-unaffordable');
        button.title='Saldo insuficiente. Necesitas '+(-item.money).toLocaleString('es-ES')+' €.';
      }
      if(button.disabled)button.classList.add('is-completed');
    });
    var toggle=main.querySelector('.v4-mobiletoggle');
    if(toggle){
      var buttons=toggle.querySelectorAll('button');
      if(buttons.length>1){
        buttons[1].textContent='Situación'+(status(phase===0?'training':'life').resolved?' ✓':'');
        buttons.forEach(function(button){button.setAttribute('aria-pressed',String(button.classList.contains('active')));});
      }
    }
    var nextbar=main.querySelector('.v4-nextbar');
    if(nextbar){
      nextbar.classList.add('fls-v5-nextbar');
      if(status(phase===0?'training':'life').total===2)nextbar.classList.add('fls-v5-ready');
      var skip=nextbar.querySelector('.btn.ghost');
      if(skip){
        skip.setAttribute('title','Continuar sin completar las actividades pendientes. Los efectos serán distintos.');
        skip.setAttribute('aria-label','Omitir pendientes de hoy y avanzar al próximo día');
        skip.textContent='Omitir lo pendiente';
      }
    }
  }
  function matchPreview(){
    if(S.view!=='hub'||activeTab!=='match'||S.day?.index!==2)return;
    var main=document.querySelector('.v4-main');
    var fixture=main?.querySelector('.v4-bigfixture');
    if(!fixture)return;
    main.classList.add('fls-v5-matchday');
    var header=main.querySelector('.v4-viewhead');
    if(header)header.insertAdjacentElement('afterend',phaseRail(2));
    fixture.classList.add('fls-v5-preview-fixture');
    fixture.querySelectorAll(':scope > b').forEach(function(side,i){
      var sideLabel=el('small','fls-v5-homeaway',i===0?'LOCAL':'VISITANTE');
      side.insertBefore(sideLabel,side.firstChild);
    });
    var card=fixture.closest('.v4-panel');
    if(!card)return;
    card.classList.add('fls-v5-match-preview');
    var preparation=el('section','fls-v5-match-checklist');
    preparation.appendChild(el('span','fls-v5-overline','INFORME PREPARTIDO'));
    var checks=el('div','fls-v5-match-tasks');
    var skipped=S.day?.skipped||{};
    var list=[
      [S.week?.training?'✓':'○',skipped.training?'Descanso elegido':'Entrenamiento registrado'],
      [S.week?.life?'✓':'○',skipped.life?'Tiempo libre sin actividad':'Vida personal registrada'],
      [S.player.fitness>=46?'✓':'!',S.player.fitness>=46?'Condición '+Math.round(S.player.fitness)+'%':'Condición baja: '+Math.round(S.player.fitness)+'%']
    ];
    list.forEach(function(item){
      var badge=el('span',item[0]==='!'?'is-alert':'',item[0]+' '+item[1]);
      checks.appendChild(badge);
    });
    preparation.appendChild(checks);
    var metrics=card.querySelector('.v4-compactmetrics');
    if(metrics)metrics.insertAdjacentElement('afterend',preparation);
  }
  function newsroom(){
    if(S.view!=='hub'||activeTab!=='news')return;
    /* News records contain the round but no season identifier. Avoid inventing one. */
    document.querySelectorAll('.v4-feeditem > span').forEach(function(span){
      span.textContent=span.textContent.replace(/^T\d+\s*·\s*/,'');
      span.classList.add('fls-v5-article-date');
    });
  }
  function decorate(){
    if(!S)return;
    if(S.view==='hub'){
      if(activeTab==='training')addPhase(0);
      else if(activeTab==='life')addPhase(1);
      else if(activeTab==='match')matchPreview();
      else if(activeTab==='news')newsroom();
    }
  }
  var oldRender=render;
  render=function(){
    var result=oldRender.apply(this,arguments);
    try{decorate();}catch(e){console.warn('FLS weekly UI:',e);}
    return result;
  };
  window.FLS_WEEK={installed:true,version:'5.0.0'};
  render();
})();
