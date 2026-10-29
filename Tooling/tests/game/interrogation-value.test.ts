import {it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {availableArguments} from "../../../Assets/Scripts/Engine/game/Closing";
import {ActionPayload} from "../../../Assets/Scripts/Engine/core/Types";

it("requires hearing Vale's alibi before its contradiction can earn a deduction",()=>{
  const graph=createHeroCase();let state=createGameState(graph);
  const act=(payload:ActionPayload)=>state=reduceGame(graph,state,{...payload,seq:state.lastSeq+1,by:"P1"});
  act({type:"PinchObject",object:"O6"});
  expect(availableArguments(graph,state).some(a=>a.deduction==="D_ALIBI")).toBe(false);
  act({type:"ArgumentClaim",deduction:"D_ALIBI",refs:["E_VALE_LAMP"]});
  expect(state.arguments).toEqual([]);
  act({type:"Ask",suspect:"S2",topic:"where@22:30"});
  expect(availableArguments(graph,state).find(a=>a.deduction==="D_ALIBI")?.refs.slice().sort()).toEqual(["C_VALE_ALIBI_0","E_VALE_LAMP"]);
  act({type:"ArgumentClaim",deduction:"D_ALIBI",refs:["E_VALE_LAMP","C_VALE_ALIBI_0"]});
  expect(state.arguments).toHaveLength(1);
});

it("prices each first-layer name, baseline prop and alibi question below inspection",()=>{
  const graph=createHeroCase();
  for(const person of graph.cast.suspects)for(const topic of [person.baseline.truthTopic,person.baseline.lieTopic,"where@22:30"]){
    const state=reduceGame(graph,createGameState(graph),{seq:1,by:"P1",type:"Ask",suspect:person.id,topic});
    expect(state.elapsedMinutes).toBe(5);expect(state.activeStatement).not.toBeNull();
  }
});
