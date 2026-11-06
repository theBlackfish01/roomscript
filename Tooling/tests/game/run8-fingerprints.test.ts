import {it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {dustableObjects,dustingAction} from "../../../Assets/Scripts/Engine/game/Fingerprints";
import {canonicalJson} from "../../../Assets/Scripts/Engine/core/CanonicalJson";
import {Action,CaseGraph} from "../../../Assets/Scripts/Engine/core/Types";

it("offers the mug first, at most two objects, deterministically and independent of the envelope",()=>{
  const graph=createHeroCase();expect(dustableObjects(graph)).toEqual(["O9","O12"]);
  const decoy=JSON.parse(JSON.stringify(graph)) as CaseGraph;decoy.envelope={who:"S4",where:"Z5",what:"O5"};
  expect(dustableObjects(decoy)).toEqual(dustableObjects(graph));
  const bare=JSON.parse(JSON.stringify(graph)) as CaseGraph;bare.evidence=bare.evidence.filter(e=>e.holder!=="O9");
  expect(dustableObjects(bare)).toEqual(["O12","O2"]);
});
it("dusting is the pinch action itself, or nothing",()=>{
  const graph=createHeroCase();
  expect(dustingAction(graph,"O9")).toEqual({type:"PinchObject",object:"O9"});
  expect(dustingAction(graph,"O11")).toBeNull();expect(dustingAction(graph,"NOPE")).toBeNull();
});
it("replaying a dust action equals replaying a pinch",()=>{
  const graph=createHeroCase();
  for(const object of dustableObjects(graph)){
    const dust:Action[]=[{type:"Ask",suspect:"S2",topic:"where@22:30",seq:1,by:"P1"},{...dustingAction(graph,object)!,seq:2,by:"P1"}];
    const pinch:Action[]=[dust[0],{type:"PinchObject",object,seq:2,by:"P1"}];
    const a=replayGame(graph,dust),b=replayGame(graph,pinch);
    expect(canonicalJson(a)).toBe(canonicalJson(b));expect(a.knowledge.evidenceIds.length).toBeGreaterThan(0);
  }
  const state=reduceGame(graph,createGameState(graph),{...dustingAction(graph,"O9")!,seq:1,by:"P1"});
  expect(state.events.filter(e=>e.type==="evidence").map(e=>e.refs![0])).toEqual(["E_VICTIM_MUG","E_S2_BASELINE","E_S2_BASELINE_MUG"]);
});
