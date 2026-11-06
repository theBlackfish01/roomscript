import {it,expect} from "vitest";
import tape from "../../results/run4-b-hero-v3.json";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {objectReplay,objectReplays} from "../../../Assets/Scripts/Engine/game/ObjectReplay";
import {Action,CaseGraph,GameState} from "../../../Assets/Scripts/Engine/core/Types";

const pinch=(graph:CaseGraph,state:GameState,object:string)=>reduceGame(graph,state,{type:"PinchObject",object,seq:state.lastSeq+1,by:"P1"});

it("returns null until the object's evidence is collected, and for unknown objects",()=>{
  const graph=createHeroCase(),state=createGameState(graph);
  expect(objectReplay(graph,state,"O11")).toBeNull();
  expect(objectReplay(graph,state,"NOPE")).toBeNull();
  expect(objectReplay(graph,pinch(graph,state,"O9"),"O11")).toBeNull();
});
it("the kettle at 22:30: no one in that memory, kettle cold, caption from the evidence",()=>{
  const graph=createHeroCase(),state=pinch(graph,createGameState(graph),"O11"),v=objectReplay(graph,state,"O11")!;
  expect(v).toEqual({object:"O11",slot:"22:30",title:"What the kettle saw",figures:[{suspect:null,pose:"absent",zone:"Z4"}],
    props:[{object:"O11",state:"cold"}],caption:graph.evidence.find(e=>e.id==="E_KETTLE_COLD")!.canonical,evidence:"E_KETTLE_COLD"});
  const merged=objectReplay(graph,state,"O11",{merge:true})!;
  expect(merged.figures).toEqual([{suspect:"S3",pose:"standing",zone:"Z4"}]);
  expect(objectReplays(graph,state,"O11").map(r=>r.evidence)).toEqual(["E_KETTLE_COLD","E_S3_ALIBI","E_S3_BASELINE"]);
  expect(objectReplay(graph,state,"O11",{evidence:"E_S3_BASELINE"})!.slot).toBe("earlier");
  expect(objectReplay(graph,state,"O11",{evidence:"E_CABLE"})).toBeNull();
});
it("the mug shows Harlow at the Study desk at 22:30",()=>{
  const graph=createHeroCase(),v=objectReplay(graph,pinch(graph,createGameState(graph),"O9"),"O9")!;
  expect(v.evidence).toBe("E_VICTIM_MUG");expect(v.slot).toBe("22:30");expect(v.figures).toEqual([{suspect:"V",pose:"standing",zone:"Z1"}]);
});
it("never places Vale in a zone the collected evidence does not state",()=>{
  const graph=createHeroCase();let state=pinch(graph,createGameState(graph),"O1");
  const cable=objectReplay(graph,state,"O1")!;
  expect(cable.figures).toEqual([{suspect:null,pose:"absent",zone:"Z1"}]);
  expect(cable.props).toEqual([{object:"O1",state:"handled"}]);
  state=pinch(graph,state,"O12");
  expect(objectReplay(graph,state,"O1")!.figures).toEqual([{suspect:"S2",pose:"standing",zone:"Z1"}]);
});
it("every figure in every replay after the hero tape matches a known true at-fact",()=>{
  const graph=createHeroCase(),state=replayGame(graph,tape.log as Action[]);
  for(const object of graph.room.objects)for(const merge of [false,true]){
    const v=objectReplay(graph,state,object.id,{merge});if(!v)continue;
    expect(state.knowledge.evidenceIds).toContain(v.evidence);
    for(const f of v.figures)if(f.suspect)expect(graph.facts.some(x=>x.truth&&x.pred==="at"&&x.args.who===f.suspect&&x.args.zone===f.zone&&state.knowledge.factIds.includes(x.id))).toBe(true);
  }
});
