import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function instance(pos='DC',prior=null){
 const player={pos,name:'Test Hero',roleTraining:prior};
 const S={player},Game={},events=[];
 const ctx={S,Game,window:{Game},persist:()=>events.push('saved'),
  render:()=>{},notify:()=>{},esc:v=>String(v),profile:()=>'<main>Profile</main>'};
 const source=fs.readFileSync(new URL('../assets/js/role-progression-v11.js',import.meta.url),'utf8');
 vm.runInNewContext(source,ctx);
 return {player,Game,events,roles:ctx.window.FDG11Roles,profile:ctx.profile};
}
test('archetypes are separate from role mastery and rating',()=>{
 const {player,Game,events,roles,profile}=instance('EI');
 const state=roles.get(player);
 assert.equal(state.archetype,'desbordador');
 assert.equal(state.level,1);
 assert.equal(state.points,0);
 Game.archetypeChoose('interior');
 assert.equal(state.archetype,'interior');
 assert.equal(state.points,0);
 assert.equal(Object.keys(state.mastery).length,0);
 assert.equal(roles.archetype('EI','interior').boost.curve,3);
 assert.ok(profile().includes('Tu arquetipo'));
 assert.ok(events.length>=1);
});
test('role XP and unlocked familiarities survive addition of archetype',()=>{
 const old={xp:340,level:3,points:2,mastery:{falso_nueve:1},selected:'falso_nueve'};
 const {player,Game,roles}=instance('DC',old);
 const state=roles.get(player);
 assert.equal(state.points,2);
 assert.equal(state.mastery.falso_nueve,1);
 Game.archetypeChoose('asociativo');
 assert.equal(state.archetype,'asociativo');
 assert.equal(state.points,2);
 assert.equal(state.mastery.falso_nueve,1);
 Game.roleUpgrade('falso_nueve');
 assert.equal(state.mastery.falso_nueve,2);
 assert.equal(state.points,0);
 assert.equal(state.mastery.cazagoles,undefined);
});
