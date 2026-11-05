import {describe,it,expect} from "vitest";
import {storyMomentPlans,blackoutPhase,flightFraction} from "../../../Assets/Scripts/Engine/game/StoryMomentPlan";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {applyPresetEveningRoom} from "../../../Assets/Scripts/Content/PresetEveningRoom";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
describe("engine-admitted physical story moments",()=>{
 it("raw model prose cannot authorize a letter, flight or blackout",()=>{const g=applyPresetEveningRoom(createHeroCase()),s=createGameState(g);const next=reduceGame(g,s,{type:"LlmOutput",key:"fake",occurrence:1,source:"live",response:{content:'{"beat":"B_BLACKOUT"}'},latencyMs:1,at:0,by:"test",seq:1});expect(storyMomentPlans(g,next)).toEqual([]);});
 it("requires fired events and admitted evidence, preserves state and replays",()=>{const g=applyPresetEveningRoom(createHeroCase());let s=createGameState(g);for(let i=0;i<24;i++)s=reduceGame(g,s,{type:"Ask",suspect:"S3",topic:"baseline:name",seq:s.lastSeq+1,by:"test"});const before=JSON.stringify(s),plans=storyMomentPlans(g,s);expect(plans.map(p=>p.kind)).toEqual(["letter","voicemail","flight","blackout"]);for(const p of plans.filter(p=>p.evidence))expect(s.knowledge.evidenceIds).toContain(p.evidence);expect(JSON.stringify(s)).toBe(before);expect(replayGame(g,s.log)).toEqual(s);const hidden=JSON.parse(JSON.stringify(s));hidden.knowledge.evidenceIds=[];expect(storyMomentPlans(g,hidden).map(p=>p.kind)).toEqual(["flight"]);s.verdict="wrong";expect(storyMomentPlans(g,s)).toEqual([]);});
 it("restores every transient visual deterministically",()=>{expect(blackoutPhase(0)).toEqual({dim:0,uv:false,done:false});expect(blackoutPhase(1)).toEqual({dim:1,uv:true,done:false});expect(blackoutPhase(4)).toEqual({dim:0,uv:true,done:true});expect(flightFraction(0)).toBe(0);expect(flightFraction(2.5)).toBe(1);expect(flightFraction(5)).toBe(0);});
});
