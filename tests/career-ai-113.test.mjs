import test from 'node:test';
import assert from 'node:assert/strict';
import {MatchEngine} from '../assets/matchlab/engine.js';
import {TEAMS} from '../assets/matchlab/teams.js';
import {safeForwardDribble} from '../assets/matchlab/ball-intelligence.js';
const club=id=>TEAMS.find(c=>c.id===id);
const make=()=>{const g=new MatchEngine(club('barca'),club('getafe'),113);g.start();g.restart=null;return g};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
test('carrier chooses a forward lane with no obstacles',()=>{
 const g=make(),p=g.teams[0][6];p.x=52;p.y=34;
 for(const q of g.teams[1]){q.x=96;q.y=6}
 g.hold(p);
 const path=safeForwardDribble(g,p);
 assert.ok(path&&path.x>p.x);
 assert.ok(path.clearance>=3.2);
 const before=p.x;g.movePlayers(.08);
 assert.ok(p.x>before,'physical movement should make progress');
 assert.ok(p.x-before<.6,'must not teleport to the end of the lane');
});
test('blocked forward corridor does not allow a dribble through defenders',()=>{
 const g=make(),p=g.teams[0][6];p.x=52;p.y=34;
 for(const q of g.teams[1]){q.x=96;q.y=6}
 const b=g.teams[1].slice(1,5);
 b[0].x=55.2;b[0].y=34;
 b[1].x=55.1;b[1].y=30.8;
 b[2].x=55.1;b[2].y=37.2;
 b[3].x=53.5;b[3].y=34;
 g.hold(p);
 const path=safeForwardDribble(g,p);
 assert.equal(path,null,'no safe corridor should be invented');
});
test('forward dribbling respects reversed second half and pitch boundaries',()=>{
 const g=make();g.half=2;const p=g.teams[0][7];p.x=53;p.y=34;
 for(const q of g.teams[1]){q.x=99;q.y=4}
 g.hold(p);
 const route=safeForwardDribble(g,p);
 assert.ok(route&&route.x<p.x);
 p.x=2;p.y=2;
 assert.equal(safeForwardDribble(g,p),null,'no forward lane should leave the pitch');
});
