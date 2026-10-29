import {describe,it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {availableArguments,reconstruction} from "../../../Assets/Scripts/Engine/game/Closing";
describe("closing presentation boundaries",()=>{
  it("never reveals the reconstruction before a final accusation, including timeout",()=>{const graph=createHeroCase(),state=createGameState(graph);expect(reconstruction(graph,state)).toEqual([]);state.verdict="timeout";expect(reconstruction(graph,state)).toEqual([]);});
  it("reconstructs only certified positions and the sealed murder after a verdict",()=>{const graph=createHeroCase(),state=reduceGame(graph,createGameState(graph),{seq:1,by:"P1",type:"Accuse",...graph.envelope});const frames=reconstruction(graph,state);expect(frames).toHaveLength(graph.slots.length);expect(frames.filter(f=>f.murder)).toHaveLength(1);expect(frames[graph.murderSlot].positions.S2).toEqual([80,0,-125]);expect(frames[graph.murderSlot].caption).toContain("charger cable");});
  it("offers only exact observed support sets for explicit filing",()=>{const graph=createHeroCase();let state=createGameState(graph);expect(availableArguments(graph,state)).toEqual([]);state=reduceGame(graph,state,{seq:1,by:"P1",type:"PinchObject",object:"O1"});const claims=availableArguments(graph,state);expect(claims).toEqual([{deduction:"D_MEANS",refs:["E_CABLE"]}]);expect(state.arguments).toEqual([]);});
});
