import {describe,it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {objectDropEvidence,provenMark,walletEntries} from "../../../Assets/Scripts/Engine/game/SpatialObjection";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {ActionPayload} from "../../../Assets/Scripts/Engine/core/Types";
describe("spatial objection mapping",()=>{
  it("every hero breaker is selectable once observed, including all statement breakers",()=>{
    const graph=createHeroCase();
    for(const cover of graph.statements.filter(s=>s.stance==="cover"))for(const route of cover.breakers)for(const ref of route){
      let state=createGameState(graph);
      const act=(payload:ActionPayload)=>state=reduceGame(graph,state,{...payload,seq:state.lastSeq+1,by:"P1"});
      expect(walletEntries(graph,state).map(e=>e.id)).not.toContain(ref);
      const evidence=graph.evidence.find(e=>e.id===ref),statement=graph.statements.find(s=>s.id===ref);
      if(statement)act({type:"Ask",suspect:statement.speaker,topic:statement.topic});
      else if(evidence?.latent){while(state.elapsedMinutes<75)act({type:"Ask",suspect:"S1",topic:"baseline:name"});}
      else if(evidence)act({type:"PinchObject",object:evidence.holder});
      expect(walletEntries(graph,state).find(e=>e.id===ref)?.text,cover.id+" -> "+ref).toBeTruthy();
    }
  });
  it("real object bundles require selection, including the recorder arrival and reply records",()=>{
    const graph=createHeroCase();let state=createGameState(graph);
    state=reduceGame(graph,state,{type:"PinchObject",object:"O11",seq:1,by:"P1"});
    expect(objectDropEvidence(graph,state,"O11")).toEqual([]);
    state=reduceGame(graph,state,{type:"PinchObject",object:"O12",seq:2,by:"P1"});
    expect(objectDropEvidence(graph,state,"O12")).toEqual([]);
  });
  it("offers only a single observed object memory, never latent or unobserved evidence",()=>{const graph=createHeroCase(),state=createGameState(graph);expect(objectDropEvidence(graph,state,"O11")).toEqual([]);state.knowledge.evidenceIds.push("E_KETTLE_COLD");expect(objectDropEvidence(graph,state,"O11")).toEqual(["E_KETTLE_COLD"]);graph.evidence.push({...graph.evidence.find(e=>e.id==="E_KETTLE_COLD")!,id:"second"});state.knowledge.evidenceIds.push("second");expect(objectDropEvidence(graph,state,"O11")).toEqual([]);});
  it("never moves a suspect to a false asserted location",()=>{const graph=createHeroCase();expect(provenMark(graph,"C_VALE_ALIBI_0")).toBeNull();expect(provenMark(graph,"C_VALE_ALIBI_1")).toEqual([80,0,-125]);expect(provenMark(graph,"C_VALE_ALIBI_2")).toEqual([80,0,-125]);});
});
