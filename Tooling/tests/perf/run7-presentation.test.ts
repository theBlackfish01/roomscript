import {describe,it,expect} from "vitest";
import {prepareDynamicCase} from "../../../Assets/Scripts/Content/DynamicCase";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {presentedQuestions,presentedIntent} from "../../../Assets/Scripts/Engine/perf/QuestionPresentation";
import {accumulatedPhraseCues,phraseVoiceKey,resolvePhrasePlayback} from "../../../Assets/Scripts/Engine/perf/PhrasePlayback";
import {VoiceRecord} from "../../../Assets/Scripts/Engine/perf/VoiceSelection";
import {PhrasePlan} from "../../../Assets/Scripts/Engine/perf/GeneratedPerformance";
import {caseExitPosition} from "../../../Assets/Scripts/Engine/game/RoomPresentation";
import {endingSummary} from "../../../Assets/Scripts/Engine/game/CaseClarity";

function record(text:string,index=0):VoiceRecord {return {speaker:"S2",text,take:"steady",index,alignment:{characters:text.split(""),starts:Array.from(text,(_,i)=>i/10),ends:Array.from(text,(_,i)=>(i+1)/10)}};}
const plan:PhrasePlan={speaker:"S2",text:" I did not touch   the sofa.",segments:[{id:"a",speaker:"S2",text:" I did not touch   the "},{id:"b",speaker:"S2",text:"sofa"},{id:"c",speaker:"S2",text:"."}]};
describe("runtime generated-case presentation adapters",()=>{
  it("offers readable active questions for generated names, objects and topics",()=>{
    for(const seed of [7,1041,2026]){
      const graph=prepareDynamicCase(seed,createHeroCase().room).graph!,state=createGameState(graph),before=JSON.stringify({graph,state});
      for(const suspect of graph.cast.suspects){
        const choices=presentedQuestions(graph,state,suspect.id);
        expect(choices.slice(0,3).map(c=>c.topic)).toEqual(["whereabouts","background","borrowed_item"]);
        expect(choices.find(c=>c.topic==="victim")!.question).toContain(graph.cast.victim.name);
        expect(choices.every(c=>!c.question.includes("Harlow")&&!c.label.includes("undefined")&&!c.question.includes("weapon_"))).toBe(true);
        expect(presentedIntent(graph,state,suspect.id,"Where were you?").topic).toBe("whereabouts");
        expect(presentedIntent(graph,state,suspect.id,"Did you touch an item?").topic).toBe("borrowed_item");
        expect(presentedIntent(graph,state,suspect.id,"What is your connection?").topic).toBe("background");
      }
      expect(JSON.stringify({graph,state})).toBe(before);
    }
  });
  it("preserves the authored Harlow chip order and victim name",()=>{
    const graph=createHeroCase(),state=createGameState(graph),choices=presentedQuestions(graph,state,"S2");
    expect(choices[0].topic).toMatch(/^where@/);expect(choices.slice(1,3).map(c=>c.label)).toEqual(["Your name","Your brooch"]);
    expect(presentedQuestions(graph,state,"S3").some(c=>c.label.includes("Harlow"))).toBe(true);
    expect(presentedIntent(graph,state,"S2","Where were you?").topic).toMatch(/^where@/);
  });
  it("preflights every phrase so a missing negation cannot become spoken agreement",()=>{
    const records=new Map([record("I did not touch the"),record("sofa",1)].map(r=>[phraseVoiceKey(r.speaker,r.text),r]));
    const lookup=(speaker:string,text:string)=>records.get(phraseVoiceKey(speaker,text));
    const ready=resolvePhrasePlayback(plan,lookup)!;
    expect(ready).toHaveLength(2);expect(ready[1].prefix).toBe(" I did not touch   the ");
    records.delete(phraseVoiceKey("S2","I did not touch the"));expect(resolvePhrasePlayback(plan,lookup)).toBeNull();
    expect(resolvePhrasePlayback(plan,()=>({...record("sofa"),take:"tell"}))).toBeNull();
    expect(resolvePhrasePlayback({...plan,text:"I did touch the sofa."},lookup)).toBeNull();
  });
  it("reveals cumulative admitted words using real timing while preserving raw spacing",()=>{
    const first=record("I did not touch the"),cues=accumulatedPhraseCues(plan.segments[0].text,"",first);
    expect(cues.find(c=>c.text.includes("not"))!.text).toBe(" I did not");
    expect(cues[cues.length-1].text).toBe(" I did not touch   the");
    const second=accumulatedPhraseCues("sofa",plan.segments[0].text,record("sofa",1));
    expect(second[0].text).toBe(" I did not touch   the sofa");
    expect(accumulatedPhraseCues("sofa","",record("door"))).toEqual([]);
    expect(accumulatedPhraseCues("sofa","",{...record("sofa"),alignment:undefined})).toEqual([]);
  });
  it("uses actual doorway coordinates and a finite room-edge exit when no doorway was scanned",()=>{
    const graph=createHeroCase(),door=graph.room.objects.find(o=>o.type==="door")!;
    door.id="observed-door";const floor=graph.room.zones.find(z=>z.id===door.zone)!.anchor[1];
    expect(caseExitPosition(graph)).toEqual([door.pos[0],floor,door.pos[2]]);
    graph.room.objects=graph.room.objects.filter(o=>o.type!=="door");
    const exit=caseExitPosition(graph);expect(exit.every(Number.isFinite)).toBe(true);
    expect(exit[0]).toBe(Math.max(...graph.room.zones.map(z=>z.anchor[0]))+120);
  });
  it("generated endings cite only their own sealed truth and remain hidden at timeout",()=>{
    for(const seed of [7,1041,2026]){
      const graph=prepareDynamicCase(seed,createHeroCase().room).graph!,state=createGameState(graph);
      expect(endingSummary(graph,state)).toEqual([]);expect(endingSummary(graph,{...state,verdict:"timeout"})).toEqual([]);
      for(const verdict of ["correct","wrong"] as const){
        const summary=endingSummary(graph,{...state,verdict});
        expect(summary.some(line=>line.text.includes(graph.cast.victim.name))).toBe(true);
        expect(summary.every(line=>!line.text.includes("Harlow")&&line.factIds.every(id=>graph.facts.some(f=>f.id===id&&f.truth)))).toBe(true);
      }
    }
  });
});
