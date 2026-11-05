import {it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {minimumCostRoute,solvePlayerKnowledge} from "../../../Assets/Scripts/Engine/case/Solver";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {ActionPayload} from "../../../Assets/Scripts/Engine/core/Types";
it("hero tour acquires mixed evidence and testimony roots without assuming an evidence holder",()=>{
  const graph=createHeroCase();let state=createGameState(graph);
  const act=(action:ActionPayload)=>{state=reduceGame(graph,state,{...action,seq:state.lastSeq+1,by:"test"});};
  act({type:"Ask",suspect:"S2",topic:"where@22:30"});act({type:"PinchObject",object:"O11"});
  act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});
  act({type:"Ask",suspect:"S3",topic:"about:V"});act({type:"Ask",suspect:"S2",topic:"where@22:30"});
  act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_1",evidence:["C_OKAFOR_REPLY"]});
  const route=minimumCostRoute(graph);expect(route.refs.some(ref=>graph.statements.some(s=>s.id===ref))).toBe(true);
  for(const ref of route.refs){const evidence=graph.evidence.find(e=>e.id===ref);if(evidence)act({type:"PinchObject",object:evidence.holder});else{
    const statement=graph.statements.find(s=>s.id===ref);expect(statement,ref).toBeDefined();
    if(!state.knowledge.statementIds.includes(ref))act({type:"Ask",suspect:statement!.speaker,topic:statement!.topic});
  }}
  expect(solvePlayerKnowledge(graph,state.knowledge).hypotheses).toEqual([graph.envelope]);
});
