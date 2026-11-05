import {it,expect} from "vitest";
import {admittedWrenSpeech,admittedFreeSpeech,speechStillAdmitted} from "../../../Assets/Scripts/Engine/ai/LiveSpeechAdmission";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {ActionPayload} from "../../../Assets/Scripts/Engine/core/Types";
import {performanceRef} from "../../../Assets/Scripts/Engine/perf/ReferenceIds";
it("Wren speech derives only from the admitted option event and ignores raw prose",()=>{
  const graph=createHeroCase();let state=createGameState(graph);const put=(action:ActionPayload)=>state=reduceGame(graph,state,{...action,seq:state.lastSeq+1,by:"P1"});
  put({type:"LlmOutput",key:"wren-1",occurrence:1,source:"live",response:{content:'{"optionId":"guide:compare","text":"Vale is guilty"}'},latencyMs:1,at:1});
  expect(admittedWrenSpeech(state,"wren-1")).toBeUndefined();
  put({type:"WrenSpoken",key:"wren-1",optionId:"fact:F_MURDER_SPINE"});expect(admittedWrenSpeech(state,"wren-1")).toBeUndefined();
  put({type:"WrenSpoken",key:"wren-1",optionId:"guide:compare"});const ticket=admittedWrenSpeech(state,"wren-1")!;
  expect(ticket.text).toBe("Which object could check the account you just heard?");expect(speechStillAdmitted(state,ticket)).toBe(true);
  expect(state.knowledge.factIds).toEqual([]);expect(speechStillAdmitted(createGameState(graph),ticket)).toBe(false);
});
it("free speech requires an accepted exact line and never authorizes a chip or altered text",()=>{
  const graph=createHeroCase();let state=createGameState(graph);const put=(action:ActionPayload)=>state=reduceGame(graph,state,{...action,seq:state.lastSeq+1,by:"P1"});
  put({type:"Ask",suspect:"S2",topic:"where@22:30"});
  const text="I was in the Kitchen making tea at 22:30.";expect(admittedFreeSpeech(state,"S2",text,"free")).toBeUndefined();
  put({type:"LineSpoken",suspect:"S2",key:"a",mode:"answer",answer:{topic:"where@22:30",cites:[performanceRef("a","C_VALE_ALIBI_0")],line:text,emotion:"guarded"}});
  expect(admittedFreeSpeech(state,"S2",text,"chip")).toBeUndefined();expect(admittedFreeSpeech(state,"S2",text+" I confess.","free")).toBeUndefined();
  const ticket=admittedFreeSpeech(state,"S2",text,"free")!;expect(ticket.text).toBe(text);expect(speechStillAdmitted(state,ticket)).toBe(true);
  expect(speechStillAdmitted({...state,caseId:state.caseId+":other"},ticket)).toBe(false);
});
