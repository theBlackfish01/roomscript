import {describe,expect,it} from "vitest";
import {CaseGraph,Fact,SolverCode,Suspect} from "../../../Assets/Scripts/Engine/core/Types";
import {consistent,enumerateHypotheses,minimumCostRoute,reachableKnowledge,solvePlayerKnowledge,verifyCase} from "../../../Assets/Scripts/Engine/case/Solver";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";

function fixture():CaseGraph {
  const suspect=(id:string):Suspect=>({id,name:id,nicknames:[],persona:"test",voice:"test",actingNotes:"",tell:"flicker",tellProp:"",composureMax:3,secret:"",relations:[],baseline:{truthTopic:"truth",lieTopic:"cover"}});
  const fact=(id:string,pred:Fact["pred"],args:Fact["args"],truth=true):Fact=>({id,pred,args,truth,slot:0});
  const facts=[fact("FV","at",{who:"V",zone:"Z1"}),fact("FA","at",{who:"S2",zone:"Z2"}),fact("FW","in",{obj:"W2",zone:"Z2"}),fact("FC","at",{who:"S1",zone:"Z2"},false),fact("FT","at",{who:"S1",zone:"Z1"})];
  return {schema:1,caseId:"PROOF",seed:1,pitchHash:"fixture",compilerVersion:"1",era:"test",room:{schema:1,roomId:"proof",source:"fixture",zones:[{id:"Z1",label:"Study",clueName:"Study",anchor:[0,0,0]},{id:"Z2",label:"Kitchen",clueName:"Kitchen",anchor:[100,0,0]}],objects:[]},slots:["22:30"],murderSlot:0,bodyFound:"22:41",envelope:{who:"S1",where:"Z1",what:"W1"},cast:{victim:{id:"V",name:"Victim"},suspects:[suspect("S1"),suspect("S2")]},weapons:["W1","W2"],facts,witnessing:[],evidence:["FV","FA","FW"].flatMap((id,i)=>[0,1].map(j=>({id:`E${i}${j}`,holder:`O${i}${j}`,kind:"object_memory" as const,proves:[id],canonical:id,entities:[],costMinutes:0}))),statements:[{id:"C0",speaker:"S1",topic:"cover",asserts:"FC",stance:"cover",layer:0,canonical:"Kitchen",entities:[],breakers:[["E00"],["E01"]],onBreak:"C1"},{id:"C1",speaker:"S1",topic:"cover",asserts:"FT",stance:"truth",layer:1,canonical:"Study",entities:[],breakers:[]}],refutation:{order:[],cards:{}},beats:[],requiredDeductions:[],clockMinutes:180};
}
const beat=(graph:CaseGraph)=>{graph.beats.push({id:"B",type:"latent_letter",reveals:[],minute:30,guaranteed:true,validated:true,canonical:"Letter"});return graph.beats[0];};

describe("solver proof contract",()=>{
  it("proves the authored hero rather than trusting its cached report",()=>{const g=createHeroCase();g.solver=undefined;const report=verifyCase(g);expect(report.issues).toEqual([]);expect(report.hypotheses).toEqual([g.envelope]);expect(Object.values(report.routesPerElimination).every(n=>n>=2)).toBe(true);console.info("Hero route proof",{minutes:report.minRouteMinutes,refs:report.minRoute,slack:report.slack});});
  it("enumerates the full Cartesian product without an envelope oracle",()=>{const g=fixture();expect(enumerateHypotheses(g)).toHaveLength(8);g.envelope={who:"wrong",where:"wrong",what:"wrong"};expect(enumerateHypotheses(g)).toHaveLength(8);expect(verifyCase(g).unique).toBe(false);});
  it("passes a coherent physical fixture with independently sourced proofs",()=>{const r=verifyCase(fixture());expect(r.issues).toEqual([]);expect(r.minRouteMinutes).toBe(0);expect(r.minRoute.length).toBeGreaterThanOrEqual(3);});
  it("keeps player knowledge separate from available future clues and false covers",()=>{const g=fixture();expect(solvePlayerKnowledge(g,{factIds:[],evidenceIds:[],statementIds:[]}).hypotheses).toHaveLength(8);expect(solvePlayerKnowledge(g,{factIds:[],evidenceIds:[],statementIds:["C0"]}).hypotheses).toHaveLength(8);const r=solvePlayerKnowledge(g,{factIds:[],evidenceIds:["E00","E10","E20"],statementIds:[]});expect(r.hypotheses).toEqual([g.envelope]);expect(r.eliminated).toEqual({suspects:["S2"],zones:["Z2"],weapons:["W2"]});});
  it("respects observation time and never makes positive touching exclusive",()=>{const g=fixture();const h={who:"S2",where:"Z1",what:"W1"};expect(consistent(h,[{...g.facts[1],slot:1}],g)).toBe(true);expect(consistent(h,[{...g.facts[1],slot:undefined,slotRange:[0,1]}],g)).toBe(false);expect(consistent(h,[{id:"touch",pred:"touched",args:{who:"S2",obj:"W2"},truth:true}],g)).toBe(true);});
  it("unlocks higher truth only through an acquired source and reachable breaker",()=>{const g=fixture();const r=reachableKnowledge(g);expect(r.factIds).toContain("FT");expect(r.supports.C1).toContainEqual(["C0","E00"]);g.statements[0].breakers=[["missing"]];expect(reachableKnowledge(g).factIds).not.toContain("FT");});
  it("does not bootstrap a circular breaker through its own unlocked truth",()=>{const g=fixture();g.statements[0].breakers=[["C1"]];expect(reachableKnowledge(g).refIds).not.toContain("C1");expect(verifyCase(g).issues.some(i=>i.code==="LIE_UNBREAKABLE")).toBe(true);});
  it("retains prerequisites of latent evidence in its proof supports",()=>{const g=fixture();g.evidence[0].latent=true;const b=beat(g);b.reveals=["E00"];b.requires=["C1"];const r=reachableKnowledge(g);expect(r.supports.E00.every(path=>path.includes("C0")&&path.includes("E01"))).toBe(true);expect(reachableKnowledge(g,{includeBeats:false}).refIds).not.toContain("E00");});
  it("groups free simultaneous holder memories and minimizes weighted acquisition",()=>{const g=fixture();g.statements=[];for(const e of g.evidence)e.costMinutes=50;g.evidence[0].costMinutes=7;g.evidence[2].costMinutes=9;g.evidence[4].costMinutes=11;expect(minimumCostRoute(g).minutes).toBe(27);g.evidence[2].holder=g.evidence[0].holder;g.evidence[4].holder=g.evidence[0].holder;expect(minimumCostRoute(g).minutes).toBe(11);});
  it("does not count duplicate breaker sets as separate alternatives",()=>{const g=fixture();g.statements[0].breakers=[["E00"],["E00"]];expect(verifyCase(g).lieBreakable.C0).toBe(1);});
  it("rejects mutually contradictory monotonic beat additions",()=>{const g=fixture();const b=beat(g);b.addsFacts=[{id:"BA",pred:"state",args:{obj:"door",key:"locked",value:true},truth:true,slot:0}];g.beats.push({...b,id:"B2",addsFacts:[{id:"BB",pred:"state",args:{obj:"door",key:"locked",value:false},truth:true,slot:0}]});expect(verifyCase(g).issues.map(i=>i.code)).toContain("BEAT_BREAKS_SOLVABILITY");});
});

type Broken={name:string;code:SolverCode;break:(g:CaseGraph)=>void};
const broken:Broken[]=[
  {name:"missing weapon observation",code:"NOT_UNIQUE",break:g=>{g.evidence=g.evidence.filter(e=>!e.proves.includes("FW"));}},
  {name:"missing innocent alibi",code:"NOT_UNIQUE",break:g=>{g.evidence=g.evidence.filter(e=>!e.proves.includes("FA"));}},
  {name:"wrong sealed envelope",code:"NOT_UNIQUE",break:g=>{g.envelope.who="S2";}},
  {name:"single weapon witness",code:"ROUTES_LT_2",break:g=>{g.evidence=g.evidence.filter(e=>e.id!=="E21");}},
  {name:"duplicated holder is not independence",code:"ROUTES_LT_2",break:g=>{g.evidence[5].holder=g.evidence[4].holder;}},
  {name:"single innocent alibi witness",code:"ROUTES_LT_2",break:g=>{g.evidence=g.evidence.filter(e=>e.id!=="E11");}},
  {name:"no cover breaker",code:"LIE_UNBREAKABLE",break:g=>{g.statements[0].breakers=[];}},
  {name:"missing breaker reference",code:"LIE_UNBREAKABLE",break:g=>{g.statements[0].breakers=[["missing"]];}},
  {name:"culprit requires two layer zero alternatives",code:"LIE_UNBREAKABLE",break:g=>{g.statements[0].breakers=[["E00"]];}},
  {name:"missing replacement target",code:"LIE_UNBREAKABLE",break:g=>{g.statements[0].onBreak="missing";}},
  {name:"single physical dossier solves everything",code:"SHORTCUT",break:g=>{g.evidence[0].proves=["FV","FA","FW"];}},
  {name:"second physical dossier shortcut",code:"SHORTCUT",break:g=>{g.evidence[5].proves=["FV","FA","FW"];}},
  {name:"red herring essential alibi",code:"HERRING_HARMFUL",break:g=>{g.facts[1].suspicious=true;}},
  {name:"red herring essential weapon",code:"HERRING_HARMFUL",break:g=>{g.facts[2].suspicious=true;}},
  {name:"all routes exceed clock",code:"MIN_ROUTE_TOO_LONG",break:g=>{g.evidence.forEach(e=>e.costMinutes=100);}},
  {name:"clock too short for weighted route",code:"MIN_ROUTE_TOO_LONG",break:g=>{g.evidence.forEach(e=>e.costMinutes=10);g.clockMinutes=40;}},
  {name:"beat reveals nonexistent clue",code:"BEAT_BREAKS_SOLVABILITY",break:g=>{beat(g).reveals=["missing"];}},
  {name:"beat adds false fact",code:"BEAT_BREAKS_SOLVABILITY",break:g=>{beat(g).addsFacts=[{id:"BF",pred:"at",args:{who:"V",zone:"Z2"},truth:false,slot:0}];}},
  {name:"global truths disagree",code:"INCONSISTENT_TRUTHS",break:g=>{g.facts.push({id:"bad",pred:"at",args:{who:"V",zone:"Z2"},truth:true,slot:0});}},
  {name:"truthful statement asserts false fact",code:"INCONSISTENT_TRUTHS",break:g=>{g.statements[1].asserts="FC";}}
];
describe("twenty deliberately broken variants",()=>{
  it("retains exactly twenty independently mutated fixtures",()=>expect(broken).toHaveLength(20));
  for(const test of broken)it(`${test.code}: ${test.name}`,()=>{const g=fixture();test.break(g);const report=verifyCase(g);expect(report.ok).toBe(false);expect(report.issues.map(i=>i.code)).toContain(test.code);});
});
