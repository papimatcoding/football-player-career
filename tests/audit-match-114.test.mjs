import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine} from '../assets/matchlab/engine.js';
import {TEAMS} from '../assets/matchlab/teams.js';

const club=id=>TEAMS.find(t=>t.id===id);
const round=(v,n=2)=>Number(v.toFixed(n));
test('24 deterministic full 11v11 matches: shot logic, goalkeeper, pass and score audit',()=>{
 const tactics=['equilibrada','ofensiva','defensiva','presion','tiki_taka'];
 let n=0,maxKeeperExcursion=0,longNormalShots=0,shotCount=0,goalCount=0,
  passes=0,completed=0,progressive=0,backward=0,openNet=0,halfSeconds=0;
 for(let seed=1;seed<=24;seed++){
  const game=new MatchEngine(club('barca'),club('getafe'),114000+seed,
   {tactics:[tactics[(seed-1)%5],'equilibrada']});
  game.start();
  let frames=0;
  while(game.status!=='finished'&&frames++<3700){
   if(game.status==='halftime')game.resumeHalf();
   game.update(.08);
   for(let side=0;side<2;side++){
    const keeper=game.keeper(side);
    const excursion=Math.abs(keeper.x-game.ownGoalX(side));
    maxKeeperExcursion=Math.max(maxKeeperExcursion,excursion);
    assert.ok(excursion<=19,'keeper out of own area on seed '+seed);
   }
  }
  assert.equal(game.status,'finished','match timed out for '+seed);
  assert.equal(game.goals.length,game.stats[0].goals+game.stats[1].goals);
  for(const e of game.events){
   if(e.type==='shot'&&!e.penalty&&!e.freeKick){
    shotCount++;
    if(e.shootingDistance>27&&!e.emptyNet)longNormalShots++;
   }
   if(e.type==='pass'){
    const direction=game.direction(e.side); // only diagnostic; phase may reverse
    passes++;
    if(e.forwardMeters>=9)progressive++;
   }
   if(e.type==='passComplete')completed++;
  }
  assert.equal(game.events.filter(e=>e.type==='passComplete').length,
   game.stats[0].completed+game.stats[1].completed);
  goalCount+=game.goals.length;
  openNet+=game.stats[0].openGoalShots+game.stats[1].openGoalShots;
  // Start to final always covers two regulation 45-minute halves, ~2min each.
  assert.ok(game.time>=5400);
  halfSeconds+=game.realTime/2;
  n++;
 }
 assert.equal(longNormalShots,0);
 assert.ok(passes>100,'full simulation must include passing decisions');
 assert.ok(completed<=passes);
 console.log('AUDIT_114',JSON.stringify({
  matches:n,passesPerMatch:round(passes/n),passCompletionPct:round(completed/passes*100),
  shotsPerMatch:round(shotCount/n),goalsPerMatch:round(goalCount/n),
  normalOpenNetShots:openNet,unjustifiedLongShots:longNormalShots,
  maxKeeperExcursionMeters:round(maxKeeperExcursion),
  approximateRealSecondsPerHalf:round(halfSeconds/n)
 }));
});
