// Football Life Simulator 11.4 — transparent, position-aware match rating.
// Only actual logged match actions count; an attempted pass is not a completed pass.
const cap=(v,a,b)=>Math.max(a,Math.min(b,v));
const DEF=new Set(['POR','DFC','LI','LD','MCD']);
const ATT=new Set(['DC','EI','ED','MCO']);
const empty=()=>({goals:0,assists:0,passes:0,passesCompleted:0,progressivePasses:0,
 keyPasses:0,shots:0,shotsOnTarget:0,missedChances:0,xgWasted:0,
 saves:0,tackles:0,duels:0,interceptions:0,ballLosses:0,fouls:0,yellow:0,red:0,
 carryMeters:0});
export function collectPlayerMetrics(game,{side,name,minutes=0,position='MC'}){
 const m=empty();
 if(!game||!name)return m;
 const matchEvents=game.events||[];
 for(const e of matchEvents){
  if(e.side===side&&e.type==='shot'&&e.createdBy===name)m.keyPasses++;
  if(e.side!==side||e.player!==name)continue;
  switch(e.type){
   case 'pass':m.passes++;break;
   case 'passComplete':
    m.passesCompleted++;
    if((e.forwardMeters||0)>=9)m.progressivePasses++;
    break;
   case 'goal':m.goals++;break;
   case 'shot':m.shots++;break;
   case 'shotOnTarget':m.shotsOnTarget++;break;
   case 'chanceMissed':m.missedChances++;m.xgWasted+=Number(e.xg)||0;break;
   case 'save':m.saves++;break;
   case 'tackle':m.tackles++;break;
   case 'turnover':m.tackles++;break;
   case 'interception':m.interceptions++;break;
   case 'duel':m.duels++;break;
   case 'ballLost':m.ballLosses++;break;
   case 'foul':m.fouls++;break;
   case 'yellow':m.yellow++;break;
   case 'red':m.red++;break;
  }
 }
 m.assists=(game.goals||[]).filter(g=>g.side===side&&g.assist===name).length;
 const hero=game.teams?.[side]?.find(p=>p.name===name&&p.isHero);
 m.carryMeters=hero?.carryMeters||0;
 return m;
}
export function calculatePlayerRating(metrics,{minutes=0,position='MC',goalsConceded=0}={}){
 if(minutes<=0)return 6.3;
 const m=metrics,defensive=DEF.has(position),attacking=ATT.has(position),goalkeeper=position==='POR';
 const completed=Math.min(m.passesCompleted,m.passes);
 const failed=Math.max(0,m.passes-completed);
 let result=6.25+
  m.goals*(attacking?1.14:.95)+m.assists*.72+
  m.saves*(goalkeeper?.16:.09)+
  (m.tackles+m.interceptions+m.duels*.55)*(defensive?.095:.07)+
  Math.min(.46,completed*.024)+Math.min(.28,m.progressivePasses*.047)+
  Math.min(.35,m.keyPasses*.105)+
  Math.min(.30,m.shotsOnTarget*.09)+
  Math.min(.35,m.carryMeters*.009)-
  failed*.035-m.ballLosses*.12-m.fouls*.085-
  m.yellow*.28-m.red*1.45-
  Math.min(.9,m.xgWasted*.55);
 if(goalkeeper)result-=goalsConceded*.18;
 if(defensive&&minutes>=60&&goalsConceded===0)result+=.13;
 return Math.round(cap(result,3,10)*100)/100;
}
