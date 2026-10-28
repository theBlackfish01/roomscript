import {describe,expect,it} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {minimumCostRoute,solvePlayerKnowledge} from "../../../Assets/Scripts/Engine/case/Solver";
import {ActionPayload} from "../../../Assets/Scripts/Engine/core/Types";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {scoreCase} from "../../../Assets/Scripts/Engine/game/Scoring";

function session(){
  const graph=createHeroCase();let state=createGameState(graph);
  return {graph,get state(){return state;},act(payload:ActionPayload){state=reduceGame(graph,state,{...payload,seq:state.lastSeq+1,by:"P1"});}};
}
function argue(s:ReturnType<typeof session>){
  for(const [deduction,ref] of [["D_OPPORTUNITY","E_VALE_LAMP"],["D_MEANS","E_CABLE"],["D_ALIBI","E_VALE_LAMP"],["D_MOTIVE","E_LETTER"]]) s.act({type:"ArgumentClaim",deduction,refs:[ref]});
}
describe("inspection costs and Holmes rating",()=>{
  it("charges one ten-minute wake-up for a bundle; repeat viewing is free",()=>{
    const s=session();s.act({type:"PinchObject",object:"O6"});
    expect(s.state.knowledge.evidenceIds.length).toBeGreaterThan(1);
    expect(s.state.elapsedMinutes).toBe(10);
    const knowledge=s.state.knowledge;s.act({type:"PinchObject",object:"O6"});
    expect(s.state.elapsedMinutes).toBe(10);expect(s.state.knowledge).toEqual(knowledge);
    expect(s.state).toEqual(replayGame(s.graph,s.state.log));
  });
  it("charges an exhaustive inspection and withholds its efficiency star",()=>{
    const s=session();for(const object of s.graph.room.objects)s.act({type:"PinchObject",object:object.id});
    expect(s.state.elapsedMinutes).toBe(130);argue(s);s.act({type:"Accuse",...s.graph.envelope});
    expect(scoreCase(s.graph,s.state)).toMatchObject({rating:2,deductions:4,minutes:130,minimumMinutes:80});
  });
  it("matches the solver's weighted minimum to an executable acquisition route",()=>{
    const s=session();const route=minimumCostRoute(s.graph);
    expect(route.minutes).toBe(80);
    const holders=new Set(route.refs.map(ref=>s.graph.evidence.find(e=>e.id===ref)!.holder));
    for(const object of holders)s.act({type:"PinchObject",object});
    expect(s.state.elapsedMinutes).toBe(route.minutes);
    expect(solvePlayerKnowledge(s.graph,s.state.knowledge).hypotheses).toEqual([s.graph.envelope]);
    s.act({type:"PinchObject",object:"O1"});argue(s);s.act({type:"Accuse",...s.graph.envelope});
    // A missing/stale cached solver report must not make the score's benchmark zero.
    expect(s.graph.solver).toBeUndefined();
    expect(scoreCase(s.graph,s.state)).toMatchObject({rating:3,minutes:90,minimumMinutes:80});
  });
  it("a blind correct guess gets one star, and a wrong verdict gets none",()=>{
    const s=session();s.act({type:"Accuse",...s.graph.envelope});
    expect(scoreCase(s.graph,s.state).rating).toBe(1);
    const t=session();t.act({type:"Accuse",...t.graph.envelope,who:"S1"});
    expect(scoreCase(t.graph,t.state).rating).toBe(0);
  });
});
