import {it,expect} from "vitest";
import tape from "../../results/run4-b-hero-v3.json";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {applyPresetEveningRoom} from "../../../Assets/Scripts/Content/PresetEveningRoom";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {reconstructionBeats} from "../../../Assets/Scripts/Engine/game/Closing";
import {frozenTableau,TABLEAU_LIFT_CM} from "../../../Assets/Scripts/Engine/game/FrozenTableau";
import {Action} from "../../../Assets/Scripts/Engine/core/Types";

it("is null before a verdict and at timeout",()=>{
  const graph=applyPresetEveningRoom(createHeroCase());let state=createGameState(graph);
  expect(frozenTableau(graph,state)).toBeNull();
  for(const action of (tape.log as Action[]).filter(a=>a.type!=="Accuse"&&a.type!=="SetupCase")){state=reduceGame(graph,state,{...action,seq:state.lastSeq+1});expect(frozenTableau(graph,state)).toBeNull();}
  expect(frozenTableau(graph,{...createGameState(graph),verdict:"timeout"})).toBeNull();
});
it("freezes Vale in the Study with the cable, Harlow, and the knocked mug, on the Preset layout",()=>{
  const graph=applyPresetEveningRoom(createHeroCase()),state=reduceGame(graph,createGameState(graph),{type:"Accuse",...graph.envelope,seq:1,by:"P1"});
  const t=frozenTableau(graph,state)!,freeze=reconstructionBeats(graph,state).find(b=>b.kind==="freeze")!;
  expect(t.slot).toBe("22:30");expect(t.zone).toBe("Z1");
  expect(t.figures[0]).toEqual({suspect:"S2",pose:"strangling",position:freeze.positions!.S2,holding:"O1"});
  expect(t.figures[1]).toEqual({suspect:"V",pose:"victim",position:freeze.positions!.V});
  expect(t.figures.map(f=>f.suspect).sort()).toEqual(Object.keys(freeze.positions!).sort());
  expect(t.figures.filter(f=>f.holding)).toHaveLength(1);
  const mug=graph.room.objects.find(o=>o.id==="O9")!;
  expect(t.suspended).toEqual([{object:"O9",position:[mug.pos[0],mug.pos[1]+TABLEAU_LIFT_CM,mug.pos[2]],note:graph.facts.find(f=>f.id==="F_VICTIM_STUDY_MUG")!.canonical}]);
  const zone=graph.room.zones.find(z=>z.id==="Z1")!;expect(t.figures[0].position[0]).toBe(zone.anchor[0]-25);expect(t.figures[0].position[2]).toBe(zone.anchor[2]+55);
});
it("a wrong verdict reveals the same sealed tableau, as the reconstruction does",()=>{
  const graph=createHeroCase(),state=reduceGame(graph,createGameState(graph),{type:"Accuse",who:"S1",where:"Z3",what:"O3",seq:1,by:"P1"});
  expect(frozenTableau(graph,state)!.figures[0]).toMatchObject({suspect:"S2",holding:"O1"});
});
