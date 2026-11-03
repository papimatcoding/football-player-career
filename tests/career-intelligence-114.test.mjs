import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine} from '../assets/matchlab/engine.js';
import {TEAMS} from '../assets/matchlab/teams.js';
import {openGoalOpportunity,keeperAnchor,keepGoalkeeperHome} from '../assets/matchlab/match-awareness.js';
import {collectPlayerMetrics,calculatePlayerRating} from '../assets/js/match-rating-v114.js';
const club=id=>TEAMS.find(x=>x.id===id);
const make=(seed=114)=>{const g=new MatchEngine(club('barca'),club('getafe'),seed);g.start();g.restart=null;return g};
const howFarHome=(g,side)=>Math.abs(g.keeper(side).x-g.ownGoalX(side));
test('goalkeepers stay close to their OWN goal at corners, free kicks and opposite halves',()=>{
 for(const half of [1,2])for(const side of [0,1]){
  const g=make(half*100+side);g.half=half;
  const corner={x:g.goalX(side),y:side===0?0:68};
  for(const type of ['corner','freekick','indirect','throwIn','penalty']){
   g.restartAt(type,side,corner,1.4);
   for(const s of [0,1]){
    assert.ok(howFarHome(g,s)<8,'keeper wandered up at '+type+' s'+s+' h'+half);
    assert.ok(Math.abs(g.keeper(s).y-34)<2,'keeper near own centre');
   }
   g.movePlayers(.08);
   for(const s of [0,1])assert.ok(howFarHome(g,s)<9);
  }
 }
});
test('keeper targets are hard limited within 17m of home even when ball is in other box',()=>{
 const g=make(),k=g.keeper(0);
 const goal=g.ownGoalX(0);
 const safe=keepGoalkeeperHome(g,k,{x:g.goalX(0)-1,y:2});
 assert.ok(Math.abs(safe.x-goal)<=17);
 assert.ok(safe.y>=19);
 assert.ok(Math.abs(keeperAnchor(g,k,{penalty:true}).x-goal)<3);
});
test('an abandoned goal yields an immediate deliberate shot, including from beyond 25 metres',()=>{
 const g=make(),shooter=g.teams[0][9],keeper=g.keeper(1);
 shooter.x=56;shooter.y=34;
 keeper.x=52;keeper.y=28;
 for(const q of g.teams[1])if(q.i!==0){q.x=67;q.y=5+(q.i%2)*58;}
 g.hold(shooter);
 const chance=openGoalOpportunity(g,shooter,g.shotQuality(shooter));
 assert.ok(chance&&chance.distance>25);
 assert.ok(chance.xg>0&&chance.xg<.5);
 assert.equal(g.shouldShoot(shooter,g.shotQuality(shooter)),true);
 g.decide(shooter);
 assert.equal(g.ball.flight?.type,'shot');
 assert.equal(g.ball.flight?.emptyNet,true);
 assert.equal(g.stats[0].openGoalShots,1);
 assert.ok(g.events.some(e=>e.type==='shot'&&e.emptyNet));
});
test('do not shoot from midfield into guarded goals or through two central blockers',()=>{
 const g=make(),shooter=g.teams[0][9],keeper=g.keeper(1);
 shooter.x=54;shooter.y=34;g.hold(shooter);
 keeper.x=98;keeper.y=34;
 assert.equal(openGoalOpportunity(g,shooter,g.shotQuality(shooter)),null);
 assert.equal(g.shouldShoot(shooter,g.shotQuality(shooter)),false);
 keeper.x=55;keeper.y=10;
 for(const q of g.teams[1])if(q.i!==0){q.x=94;q.y=5;}
 const a=g.teams[1][2],b=g.teams[1][3];
 a.x=70;a.y=34;b.x=80;b.y=34;
 assert.equal(openGoalOpportunity(g,shooter,g.shotQuality(shooter)),null);
});
test('non-scoring shots into an empty net cannot invoke a teleporting goalkeeper save',()=>{
 const g=make(),shooter=g.teams[0][9],keeper=g.keeper(1);
 shooter.x=55;shooter.y=34;g.hold(shooter);
 keeper.x=50;keeper.y=10;
 for(const q of g.teams[1])if(q.i!==0){q.x=66;q.y=5;}
 g.rng=()=>.99;
 g.shoot(shooter);
 const f=g.ball.flight;
 assert.equal(f.emptyNet,true);
 assert.equal(f.goalChance,false);
 assert.equal(f.outcome,'miss');
 assert.equal(f.onTarget,false);
 g.updateFlight(f.duration);
 assert.equal(g.stats[1].saves,0);
});
test('rating uses actual completed passes, progression and errors rather than attempted passes alone',()=>{
 const g=make(),hero=g.teams[0][9];hero.isHero=true;hero.name='Carrera Test';
 g.events.push(
  {side:0,player:'Carrera Test',type:'pass',forwardMeters:14},
  {side:0,player:'Carrera Test',type:'passComplete',forwardMeters:14},
  {side:0,player:'Carrera Test',type:'pass',forwardMeters:3},
  {side:0,player:'Carrera Test',type:'ballLost'},
  {side:0,player:'Carrera Test',type:'chanceMissed',xg:.46},
  {side:0,player:'Carrera Test',type:'shot',createdBy:'Other Player'});
 const m=collectPlayerMetrics(g,{side:0,name:hero.name,minutes:75,position:'DC'});
 assert.equal(m.passes,2);assert.equal(m.passesCompleted,1);
 assert.equal(m.progressivePasses,1);assert.equal(m.ballLosses,1);
 assert.equal(m.xgWasted,.46);
 const score=calculatePlayerRating(m,{minutes:75,position:'DC'});
 const clean=calculatePlayerRating({...m,ballLosses:0,xgWasted:0,passesCompleted:2},
  {minutes:75,position:'DC'});
 assert.ok(clean>score,'mistakes must lower the rating');
 const red=calculatePlayerRating({...m,red:1},{minutes:75,position:'DC'});
 assert.ok(red<score,'red cards must penalize');
 assert.equal(calculatePlayerRating(m,{minutes:0}),6.3);
});
test('goal, assist, key pass, defensive recovery and keeper save change rating separately',()=>{
 const m={goals:0,assists:0,passes:4,passesCompleted:3,progressivePasses:1,keyPasses:0,
 shots:1,shotsOnTarget:1,missedChances:0,xgWasted:0,saves:0,tackles:0,interceptions:0,duels:0,
 ballLosses:0,fouls:0,yellow:0,red:0,carryMeters:10};
 const baseline=calculatePlayerRating(m,{minutes:85,position:'DC'});
 assert.ok(calculatePlayerRating({...m,goals:1},{minutes:85,position:'DC'})>baseline+.9);
 assert.ok(calculatePlayerRating({...m,assists:1},{minutes:85,position:'DC'})>baseline+.6);
 assert.ok(calculatePlayerRating({...m,keyPasses:1},{minutes:85,position:'DC'})>baseline+.08);
 assert.ok(calculatePlayerRating({...m,interceptions:2},{minutes:85,position:'DFC'})>baseline);
 assert.ok(calculatePlayerRating({...m,saves:4},{minutes:85,position:'POR'})>baseline);
});
test('complete seeded matches do not teleport keepers, produce invalid shot range or break stat invariants',()=>{
 for(let seed=0;seed<8;seed++){
  const g=make(15000+seed);g.setTactic(0,['ofensiva','equilibrada','presion','tiki_taka'][seed%4]);
  for(let t=0;t<3600&&g.status!=='finished';t++){
   if(g.status==='halftime')g.resumeHalf();
   g.update(.08);
   for(let side=0;side<2;side++){
    const k=g.keeper(side);
    assert.ok(howFarHome(g,side)<=21,'keeper left home on seed '+seed+' side '+side);
    assert.ok(k.y>=17&&k.y<=51);
   }
  }
  assert.equal(g.status,'finished');
  assert.equal(g.goals.length,g.stats[0].goals+g.stats[1].goals);
  for(const e of g.events.filter(e=>e.type==='shot'&&!e.freeKick&&!e.penalty)){
   assert.ok(e.shootingDistance<=27||e.emptyNet,'no unmotivated long shots');
  }
  const completed=g.events.filter(e=>e.type==='passComplete').length;
  assert.equal(completed,g.stats[0].completed+g.stats[1].completed);
 }
});
