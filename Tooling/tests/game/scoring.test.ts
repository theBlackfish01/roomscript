import {describe,expect,it} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {minimumCostRoute,solvePlayerKnowledge} from "../../../Assets/Scripts/Engine/case/Solver";
import {ActionPayload} from "../../../Assets/Scripts/Engine/core/Types";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {scoreCase} from "../../../Assets/Scripts/Engine/game/Scoring";
import {availableArguments} from "../../../Assets/Scripts/Engine/game/Closing";

function session(){
  const graph=createHeroCase();let state=createGameState(graph);
  return {graph,get state(){return state;},act(payload:ActionPayload){state=reduceGame(graph,state,{...payload,seq:state.lastSeq+1,by:"P1"});}};
}
function argue(s:ReturnType<typeof session>){
  if(!s.state.knowledge.statementIds.includes("C_VALE_ALIBI_0"))s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});
  for(const claim of availableArguments(s.graph,s.state))s.act({type:"ArgumentClaim",...claim});
}
function acquire(s:ReturnType<typeof session>,refs:string[]){for(const ref of refs){const e=s.graph.evidence.find(e=>e.id===ref),c=s.graph.statements.find(c=>c.id===ref);if(e&&!e.latent)s.act({type:"PinchObject",object:e.holder});if(c)s.act({type:"Ask",suspect:c.speaker,topic:c.topic});}}
describe("inspection costs and Holmes rating",()=>{
  it("charges one ten-minute wake-up for a bundle; repeat viewing is free",()=>{
    const s=session();s.act({type:"PinchObject",object:"O9"});
    expect(s.state.knowledge.evidenceIds.length).toBeGreaterThan(1);
    expect(s.state.elapsedMinutes).toBe(10);
    const knowledge=s.state.knowledge;s.act({type:"PinchObject",object:"O9"});
    expect(s.state.elapsedMinutes).toBe(10);expect(s.state.knowledge).toEqual(knowledge);
    expect(s.state).toEqual(replayGame(s.graph,s.state.log));
  });
  it("charges an exhaustive inspection and withholds its efficiency star",()=>{
    const s=session();for(const object of s.graph.room.objects)s.act({type:"PinchObject",object:object.id});
    expect(s.state.elapsedMinutes).toBe(130);argue(s);s.act({type:"Accuse",...s.graph.envelope});
    expect(scoreCase(s.graph,s.state)).toMatchObject({rating:2,deductions:4,minutes:135,minimumMinutes:85});
  });
  it("matches the solver's weighted minimum to an executable acquisition route",()=>{
    const s=session();const route=minimumCostRoute(s.graph);
    expect(route.minutes).toBe(80);
    acquire(s,route.refs);
    expect(s.state.elapsedMinutes).toBe(route.minutes);
    expect(solvePlayerKnowledge(s.graph,s.state.knowledge).hypotheses).toEqual([s.graph.envelope]);
    s.act({type:"PinchObject",object:"O1"});argue(s);s.act({type:"Accuse",...s.graph.envelope});
    // A missing/stale cached solver report must not make the score's benchmark zero.
    expect(s.graph.solver).toBeUndefined();
    expect(scoreCase(s.graph,s.state).rating).toBeLessThanOrEqual(2); // No objection earns no third star.
  });
  it("a thirty-five-minute guess with four deductions and twenty hypotheses still earns only one star",()=>{
    const s=session();for(const object of ["O12","O1","O13"])s.act({type:"PinchObject",object});
    argue(s);expect(s.state.arguments).toHaveLength(4);
    expect(solvePlayerKnowledge(s.graph,s.state.knowledge).hypotheses.length).toBeGreaterThan(1);
    s.act({type:"Accuse",...s.graph.envelope});
    expect(scoreCase(s.graph,s.state)).toMatchObject({rating:1,minutes:35,minimumMinutes:85});
  });
  it("computes a fully supported benchmark rather than the cheapest unique-solution route",()=>{
    const s=session(),route=minimumCostRoute(s.graph,undefined,true);
    expect(route.minutes).toBe(85);
    s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});
    acquire(s,route.refs.filter(ref=>ref!=="C_VALE_ALIBI_0"));
    s.act({type:"PinchObject",object:"O11"});
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_1",evidence:["C_OKAFOR_REPLY"]});
    argue(s);s.act({type:"Accuse",...s.graph.envelope});
    expect(scoreCase(s.graph,s.state)).toMatchObject({rating:3,deductions:4});
  });
  it("does not score forged superset arguments from a loaded state",()=>{
    const s=session();for(const object of s.graph.room.objects)s.act({type:"PinchObject",object:object.id});
    s.act({type:"Accuse",...s.graph.envelope});
    s.state.arguments=s.graph.requiredDeductions.map(d=>({deduction:d.id,refs:s.state.knowledge.evidenceIds.slice()}));
    expect(scoreCase(s.graph,s.state)).toMatchObject({rating:1,deductions:0});
  });
  it("a blind correct guess gets one star, and a wrong verdict gets none",()=>{
    const s=session();s.act({type:"Accuse",...s.graph.envelope});
    expect(scoreCase(s.graph,s.state).rating).toBe(1);
    const t=session();t.act({type:"Accuse",...t.graph.envelope,who:"S1"});
    expect(scoreCase(t.graph,t.state).rating).toBe(0);
  });
});
