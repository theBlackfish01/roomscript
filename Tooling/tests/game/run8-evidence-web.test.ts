import {describe,it,expect} from "vitest";
import tape from "../../results/run4-b-hero-v3.json";
import tape7 from "../../results/run7-a2-hero.json";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {convergence,evidenceWeb} from "../../../Assets/Scripts/Engine/game/EvidenceWeb";
import {Action,CaseGraph} from "../../../Assets/Scripts/Engine/core/Types";

const log=tape.log as Action[];
/** Same public case, different sealed envelope: presentation before a verdict must not notice. */
function decoyEnvelope(graph:CaseGraph):CaseGraph {const g=JSON.parse(JSON.stringify(graph)) as CaseGraph;g.envelope={who:"S1",where:"Z3",what:"O3"};return g;}

describe("evidenceWeb",()=>{
  it("is empty at game start and after setup",()=>{
    const graph=createHeroCase(),state=createGameState(graph);
    expect(evidenceWeb(graph,state)).toEqual([]);
    expect(evidenceWeb(graph,reduceGame(graph,state,{type:"SetupCase",origin:[0,0,0],forward:[0,0,-1],seq:1,by:"P1"}))).toEqual([]);
  });
  it("draws objection, refutation, deduction, testimony and proof threads from the hero tape, sorted with stable ids",()=>{
    const graph=createHeroCase(),state=replayGame(graph,log),web=evidenceWeb(graph,state);
    expect(new Set(web.map(t=>t.kind))).toEqual(new Set(["objection","refutation","deduction","testimony","proof"]));
    expect(new Set(web.map(t=>t.id)).size).toBe(web.length);
    for(let i=1;i<web.length;i++)expect(web[i-1].seq<=web[i].seq).toBe(true);
    expect(evidenceWeb(createHeroCase(),replayGame(createHeroCase(),log))).toEqual(web);
    const kettle=web.find(t=>t.kind==="objection"&&t.evidence==="E_KETTLE_COLD")!;
    expect(kettle).toMatchObject({seq:8,from:{kind:"suspect",id:"S2"},to:{kind:"object",id:"O11"},label:"kettle broke Vale"});
    expect(web.find(t=>t.kind==="refutation")).toMatchObject({from:{kind:"object",id:"O8"},to:{kind:"suspect",id:"S1"}});
    expect(web.filter(t=>t.kind==="deduction").every(t=>t.to.id==="S2")).toBe(true);
    expect(web.some(t=>t.kind==="testimony"&&t.from.id==="S2"&&t.to.id==="O1")).toBe(true);
    expect(web.some(t=>t.kind==="proof"&&t.evidence==="E_VALE_LAMP"&&t.from.id==="S2"&&t.to.id==="Z1")).toBe(true);
    for(const t of web)expect(t.from.id).not.toBe(t.to.id);
  });
  it("only links facts the player knows and evidence the player collected, at every step",()=>{
    const graph=createHeroCase();let state=createGameState(graph);
    for(const action of log){
      state=reduceGame(graph,state,action);
      for(const t of evidenceWeb(graph,state)){
        expect(t.seq).toBeLessThanOrEqual(state.lastSeq);
        if(t.evidence)expect(state.knowledge.evidenceIds).toContain(t.evidence);
        if(t.kind==="proof"||t.kind==="testimony"){
          const ref=t.id.split(":").slice(-1)[0],fact=graph.facts.find(f=>f.id===ref);
          if(t.kind==="proof")expect(state.knowledge.factIds).toContain(ref);
          else expect(graph.statements.some(s=>s.id===ref)).toBe(true);
          if(fact)expect(fact.truth).toBe(true);
        }
      }
    }
  });
  it("never reads the sealed envelope before a verdict",()=>{
    const graph=createHeroCase(),decoy=decoyEnvelope(graph);let a=createGameState(graph),b=createGameState(decoy);
    for(const action of log.filter(x=>x.type!=="Accuse")){a=reduceGame(graph,a,action);b=reduceGame(decoy,b,action);expect(evidenceWeb(decoy,b)).toEqual(evidenceWeb(graph,a));}
  });
  it("does not thread wrong objections, and filters private refutations by viewer",()=>{
    const graph=createHeroCase();
    let state=reduceGame(graph,createGameState(graph),{type:"Ask",suspect:"S2",topic:"where@22:30",seq:1,by:"P1"});
    state=reduceGame(graph,state,{type:"PinchObject",object:"O6",seq:2,by:"P1"});
    state=reduceGame(graph,state,{type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_VICTIM_LAMP"],seq:3,by:"P1"});
    expect(state.events.some(e=>e.type==="objectionWrong")).toBe(true);
    expect(evidenceWeb(graph,state).some(t=>t.kind==="objection")).toBe(false);
    const full=replayGame(graph,log);
    expect(evidenceWeb(graph,full,{viewer:"terminal"}).some(t=>t.kind==="refutation")).toBe(true);
    expect(evidenceWeb(graph,full,{viewer:"P2"}).some(t=>t.kind==="refutation")).toBe(false);
  });
});

describe("convergence",()=>{
  it("is null at every step before the verdict, and at timeout",()=>{
    const graph=createHeroCase();let state=createGameState(graph);
    for(const action of log.filter(x=>x.type!=="Accuse")){state=reduceGame(graph,state,action);expect(convergence(graph,state)).toBeNull();}
    let cold=createGameState(graph);for(let i=1;cold.verdict===null;i++)cold=reduceGame(graph,cold,{type:"Ask",suspect:"S1",topic:"nothing",seq:i,by:"P1"});
    expect(cold.verdict).toBe("timeout");expect(convergence(graph,cold)).toBeNull();
  });
  for(const [name,source] of [["run4-b",tape.log],["run7-a2",tape7.log]] as const)it("converges on Vale after the correct "+name+" hero tape",()=>{
    const graph=createHeroCase(),state=replayGame(graph,source as Action[]);expect(state.verdict).toBe("correct");
    const result=convergence(graph,state)!;
    expect(result.culprit).toBe("S2");expect(result.threads.length).toBeGreaterThan(0);
    expect(result.threads[result.threads.length-1].to.id).toBe("S2");
    expect(result.threads.every(t=>t.kind!=="refutation"&&[t.from.id,t.to.id].some(id=>["S2","Z1","O1"].includes(id)))).toBe(true);
    expect(result.threads.every(t=>t.from.id!=="S2")).toBe(true);
    const firstToCulprit=result.threads.findIndex(t=>t.to.id==="S2");
    expect(result.threads.slice(firstToCulprit).every(t=>t.to.id==="S2")).toBe(true);
  });
  it("reveals on a wrong verdict, matching the reconstruction gate",()=>{
    const graph=createHeroCase(),state=reduceGame(graph,createGameState(graph),{type:"Accuse",who:"S1",where:"Z3",what:"O3",seq:1,by:"P1"});
    expect(convergence(graph,state)).toEqual({culprit:"S2",threads:[]});
  });
});
