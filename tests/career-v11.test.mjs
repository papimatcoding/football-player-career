import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {MatchEngine,MATCH_CLOCK_SCALE} from '../assets/matchlab/engine.js';
import {TEAMS} from '../assets/matchlab/teams.js';
import {eligibleRoles,familiarity} from '../assets/matchlab/roles.js';
const club=id=>TEAMS.find(c=>c.id===id);
const roster=name=>Array.from({length:16},(_,i)=>({name:name+' '+i,number:i+1,position:['POR','LD','DFC','DFC','LI','MC','MCD','MC','ED','DC','EI','POR','DFC','MC','ED','DC'][i]}));
function setup(entry=0,position='DC'){
 const saves=[],state={view:'match',round:3,club:{name:'Atlético Cantera',power:76,country:'España'},
  player:{name:'Héroe Prueba',pos:position,foot:'Zurdo',fitness:83,
   attrs:{ritmo:80,pase:76,tiro:79,defensa:63,regate:83,fisico:74}},
  match:{home:true,opp:'Rival de Prueba',tactics:'balance',enter:entry,started:false,minute:0,
   scoreUs:0,scoreThem:0,stats:{goals:0,assists:0,saves:0,tackles:0,passes:0,shots:0,yellow:0,errors:0},
   rating:6.3,finished:false}};
 let current=state,callback=null,nextId=0,granted=0;
 globalThis.document={getElementById:()=>null};
 globalThis.requestAnimationFrame=fn=>{callback=fn;return ++nextId};
 globalThis.cancelAnimationFrame=()=>{callback=null};
 const api={
  state:()=>current,
  save:()=>{saves.push(JSON.stringify(current));},
  render:()=>{},finish:()=>{current.match.finished=true;current.view='post';},
  club:()=>({name:current.match.opp,power:72}),
  roster:()=>[roster('Local'),roster('Visitante')],
  heroOldIndex:()=>position==='DC'?9:7,number:()=>position==='DC'?9:10,
  updateRating:()=>{},oldStop:()=>{},
  role:()=>({get:()=>({mastery:{falso_nueve:1},selected:'falso_nueve'}),
   grant:()=>{granted++}})
 };
 return {api,state,get current(){return current},set current(s){current=s},
  get callback(){return callback},
  get saves(){return saves},get grants(){return granted}};
}
function advance(t,impl,limit=3500){
 let now=performance.now();
 for(let i=0;i<limit&&!t.current.match.live.done;i++){
  const fn=t.callback;
  assert.ok(fn,'requestAnimationFrame pipeline must remain alive');
  fn(now+=80);
  if(t.current.match.live.half)impl.continueHalf();
 }
 assert.equal(t.current.match.live.done,true,'match should finish after two 2-minute halves');
}
test('MatchLab matches new career clubs and has exactly two-minute halves',()=>{
 assert.equal(MATCH_CLOCK_SCALE,22.5);
 assert.equal(2700/MATCH_CLOCK_SCALE,120);
 const g=new MatchEngine(club('barca'),club('getafe'),100);
 assert.equal(g.teams.flat().length,22);
 assert.ok(eligibleRoles('ST').includes('falso_nueve'));
 assert.ok(eligibleRoles('ST').includes('cazagoles'));
 assert.equal(familiarity({...g.teams[0][9],rating:99,roleFamiliarity:{falso_nueve:0}},'falso_nueve'),0);
});
test('career match starts, plays 90 minutes, and credits only actual hero events',async()=>{
 const t=setup(0,'DC');
 const mod=await import('../assets/js/match-v11.js?test=start');
 const impl=mod.installFDG11(t.api);
 impl.start();
 assert.equal(t.state.match.live.engine,11);
 assert.equal(t.state.match.live.plannedEntry,0);
 assert.equal(t.state.match.live.ticks,0);
 assert.doesNotThrow(()=>JSON.stringify(t.state));
 advance(t,impl);
 const m=t.state.match,l=m.live;
 assert.ok(m.scoreUs>=0&&m.scoreThem>=0);
 assert.equal(typeof m.stats.goals,'number');
 assert.ok(m.stats.goals<=m.scoreUs,'hero cannot receive credit for other players goals');
 assert.ok(m.stats.assists<=m.scoreUs,'hero assists cannot exceed team goals');
 assert.ok(Number.isFinite(m.rating));
 assert.ok(l.ticks<3400&&l.ticks>2800,'90-minute match should take ~3000 simulation steps');
 assert.ok(t.saves.length>1);
 assert.doesNotThrow(()=>JSON.stringify(t.state));
 impl.close();
 assert.equal(t.state.view,'post');
 assert.equal(t.state.match.finished,true);
 assert.equal(t.grants,1);
});
test('paused saved match replays deterministically and preserves the same score',async()=>{
 const t=setup(0,'MCO');
 const mod=await import('../assets/js/match-v11.js?test=saveA');
 const impl=mod.installFDG11(t.api);impl.start();
 let now=performance.now();
 for(let i=0;i<145;i++){const cb=t.callback;assert.ok(cb);cb(now+=80);}
 const saved=JSON.parse(JSON.stringify(t.current)),clock=saved.match.live.clock,
  score=[saved.match.scoreUs,saved.match.scoreThem],ticks=saved.match.live.ticks;
 assert.ok(ticks>100);
 t.current=saved;
 const mod2=await import('../assets/js/match-v11.js?test=saveB');
 const restored=mod2.installFDG11(t.api);restored.restore();
 assert.equal(saved.match.live.ticks,ticks);
 assert.ok(Math.abs(saved.match.live.clock-clock)<.01);
 assert.deepEqual([saved.match.scoreUs,saved.match.scoreThem],score);
 assert.doesNotThrow(()=>JSON.stringify(saved));
 // Avoid a second concurrent simulation in this test.
 restored.pause();
});
test('legacy matches remain owned by their original V6/V10 renderer',async()=>{
 const t=setup(0,'DC');t.current.match.started=true;t.current.match.live={engine:6,v10:true,clock:11};
 const mod=await import('../assets/js/match-v11.js?test=legacy');
 const impl=mod.installFDG11(t.api);impl.start();
 assert.equal(t.current.match.live.engine,6);
 assert.equal(t.current.match.started,true);
});
test('Role+ and Role++ upgrades consume XP points for the selected role only',()=>{
 const script=fs.readFileSync(new URL('../assets/js/role-progression-v11.js',import.meta.url),'utf8');
 const player={name:'Héroe',pos:'DC'},S={player},Game={};
 const context={S,Game,window:{Game},persist:()=>{},render:()=>{},notify:()=>{},
  esc:s=>s,profile:()=>'<main>Perfil</main>'};
 vm.runInNewContext(script,context);
 const roles=context.window.FDG11Roles,rt=roles.get(player);
 assert.equal(rt.selected,'delantero_avanzado');
 assert.equal(rt.points,0);
 roles.grant(90,7.2);
 assert.ok(rt.xp>=40);
 for(let i=0;i<6;i++)roles.grant(90,7.2);
 assert.ok(rt.points>=2);
 Game.roleChoose('falso_nueve');
 Game.roleUpgrade('falso_nueve');
 assert.equal(rt.mastery.falso_nueve,1);
 assert.equal(rt.mastery.cazagoles,undefined);
 const before=rt.points;Game.roleUpgrade('falso_nueve');
 if(before>=2)assert.equal(rt.mastery.falso_nueve,2);
 assert.ok(context.profile().includes('Especialización de roles'));
});
