import {describe,it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {objectDropEvidence,provenMark} from "../../../Assets/Scripts/Engine/game/SpatialObjection";
describe("spatial objection mapping",()=>{
  it("offers only a single observed object memory, never latent or unobserved evidence",()=>{const graph=createHeroCase(),state=createGameState(graph);expect(objectDropEvidence(graph,state,"O11")).toEqual([]);state.knowledge.evidenceIds.push("E_KETTLE_COLD");expect(objectDropEvidence(graph,state,"O11")).toEqual(["E_KETTLE_COLD"]);graph.evidence.push({...graph.evidence.find(e=>e.id==="E_KETTLE_COLD")!,id:"second"});state.knowledge.evidenceIds.push("second");expect(objectDropEvidence(graph,state,"O11")).toEqual([]);});
  it("never moves a suspect to a false asserted location",()=>{const graph=createHeroCase();expect(provenMark(graph,"C_VALE_ALIBI_0")).toBeNull();expect(provenMark(graph,"C_VALE_ALIBI_1")).toEqual([80,0,-125]);expect(provenMark(graph,"C_VALE_ALIBI_2")).toEqual([80,0,-125]);});
});
