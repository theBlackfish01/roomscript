import {it,expect} from "vitest";
import {captureCaseTape,harvestCaseTapeText,replayCaseTape} from "../../scripts/harvest-case-tape";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {applyPresetEveningRoom} from "../../../Assets/Scripts/Content/PresetEveningRoom";
import {Action} from "../../../Assets/Scripts/Engine/core/Types";
import tape from "../../results/run4-b-hero-v3.json";

const graph=applyPresetEveningRoom(createHeroCase()),log:Action[]=[{type:"SetupCase",origin:[0,0,0],forward:[0,0,-1],seq:1,by:"P1"},...(tape.log as Action[]).map(a=>({...a,seq:a.seq+1}))];
it("retains the exact evening layout graph and replays after a paired Preview capture",()=>{
  const raw="[Preview 1] HERO_DEMO_GRAPH|"+JSON.stringify(graph)+"\n[Preview 1] HERO_DEMO_ACTION_TAPE|"+JSON.stringify(log);
  const [result]=harvestCaseTapeText(JSON.stringify({content:[{text:raw}]}));
  expect(result.graph).toEqual(graph);expect(result.caseId).toBe(graph.caseId);expect(replayCaseTape(result).verdict).toBe("correct");
  expect(result.expected.stateHash).toBe(captureCaseTape(graph,log,"test").expected.stateHash);
});
it("rejects a graphless spatial capture instead of silently using the old hero factory",()=>{
  const raw="HERO_DEMO_ACTION_TAPE|"+JSON.stringify(log);expect(()=>harvestCaseTapeText(raw)).toThrow("no exact graph");
  expect(harvestCaseTapeText(raw,graph)[0].graph).toEqual(graph);
});
it("detects geometry or replay tampering even when the same story truth remains solvable",()=>{
  const result=captureCaseTape(graph,log,"test");result.graph.room.objects[0].pos[0]+=20;
  expect(()=>replayCaseTape(result)).toThrow("captured graph changed");
  const replay=captureCaseTape(graph,log,"test");replay.log[0]={...replay.log[0],type:"SetupCase",origin:[100,0,0],forward:[0,0,1]};
  expect(()=>replayCaseTape(replay)).toThrow("replay does not match");
});
it("harvests generated source=file logs with embedded graph and preserves raw live output",()=>{
  const audited:Action[]=[log[0],{type:"LlmOutput",key:"scan:fixture",occurrence:0,source:"live",response:{content:'{"objects":[]}',model:"test-model"},latencyMs:100,at:20,seq:2,by:"P1"},...log.slice(1).map(a=>({...a,seq:a.seq+1}))];
  const raw="GENERATED_CASE_CHECK|"+JSON.stringify({seed:7,source:"file",caseId:graph.caseId,graph,log:audited});
  const [result]=harvestCaseTapeText(raw);expect(result.provenance).toContain("generated file seed 7");expect(result.log[1]).toEqual(audited[1]);expect(replayCaseTape(result).verdict).toBe("correct");
});
it("rejects captured secrets, noncontiguous actions and incomplete runs before writing",()=>{
  const unsafe=JSON.parse(JSON.stringify(graph));unsafe.cast.victim.name="Bearer"+" abcdef123456";
  expect(()=>captureCaseTape(unsafe,log,"test")).toThrow("SECRET_OUTPUT_BLOCKED");
  expect(()=>captureCaseTape(graph,[log[1]],"test")).toThrow("non-contiguous");
  expect(()=>captureCaseTape(graph,[log[0]],"test")).toThrow("no completed verdict");
});
