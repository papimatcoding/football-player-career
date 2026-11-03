// Football Life 11.4 — tactical exceptions with explicit spatial evidence.
// Keeper safety: there is no "join last corner" instruction in the career AI.
// A keeper must remain behind the ball, close to their OWN goal.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function keeperAnchor(g,p,{setPiece=false,penalty=false}={}){
 const dir=g.direction(p.side),goal=g.ownGoalX(p.side);
 const depth=penalty?1.6:setPiece?3.2:7;
 return {x:clamp(goal+dir*depth,2,103),y:34};
}
export function keepGoalkeeperHome(g,p,target){
 const dir=g.direction(p.side),goal=g.ownGoalX(p.side);
 // With no explicit user decision, never send a GK to the opposite box.
 const depth=clamp((target.x-goal)*dir,1.6,17);
 return {x:clamp(goal+dir*depth,2,103),y:clamp(target.y,19,49)};
}
export function openGoalOpportunity(g,shooter,quality=null){
 if(!shooter||shooter.i===0||shooter.red)return null;
 const side=shooter.side,dir=g.direction(side),goal=g.goalX(side),keeper=g.keeper(1-side);
 if(!keeper||keeper.red)return null;
 const d=Math.hypot(goal-shooter.x,(34-shooter.y)*1.05);
 const centre={x:goal,y:34};
 const keeperDistance=dist(keeper,centre);
 const blockers=quality?.blockers??0;
 if(d>65||d<6||Math.abs(shooter.y-34)>26||keeperDistance<22||blockers>1)return null;
 // Only a clear lane qualifies: defensive outfield players may still
 // cover the open goal, even if the goalkeeper is far from it.
 const blockersOnLine=g.teams[1-side].filter(q=>q!==keeper&&!q.red&&q.i!==0)
  .filter(q=>{
   const vx=goal-shooter.x,vy=34-shooter.y;
   const t=((q.x-shooter.x)*vx+(q.y-shooter.y)*vy)/(vx*vx+vy*vy);
   if(t<.12||t>.98)return false;
   const x=shooter.x+vx*t,y=shooter.y+vy*t;
   return Math.hypot(x-q.x,y-q.y)<2.7;
  }).length;
 if(blockersOnLine>1)return null;
 const angle=quality?.angleFactor??clamp(1-Math.abs(shooter.y-34)/40,.18,1);
 const skill=clamp((shooter.skills.shot-60)/32,.5,1.15);
 const xg=clamp(.45*Math.exp(-Math.max(0,d-24)/24)*angle*skill*
  (blockersOnLine?.66:1),.028,.50);
 const targetRate=clamp(.83-Math.max(0,d-19)*.008+(shooter.skills.shot-75)*.002,.36,.88);
 return {distance:d,keeperDistance,defendersInLane:blockersOnLine,xg,targetRate};
}
