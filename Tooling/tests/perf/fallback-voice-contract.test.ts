import {existsSync} from "node:fs";
import {resolve} from "node:path";
import {it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createHeroLineBank} from "../../../Assets/Scripts/Content/HeroLineBank";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {canonicalFallback} from "../../../Assets/Scripts/Engine/perf/LineBank";
import {validateLine} from "../../../Assets/Scripts/Engine/perf/LineValidator";
import {splitSentences} from "../../../Assets/Scripts/Engine/ai/Speech";
import {VOICE_MANIFEST} from "../../../Assets/Scripts/Content/VoiceManifest";

it("every suspect's neutral deterministic floor validates and has bundled sentence recordings",()=>{
  const graph=createHeroCase(),bank=createHeroLineBank(graph);
  const manifest={clips:VOICE_MANIFEST};
  for(const suspect of graph.cast.suspects)for(const mode of ["filler","lawyered","deflect"] as const){
    const sheet=buildFactSheet(graph,createGameState(graph),suspect.id),answer=canonicalFallback(sheet,"unclear",mode);
    expect(answer.cites).toEqual(["none"]);
    expect(validateLine(answer,sheet,graph,mode).ok).toBe(true);
    expect(bank.some(entry=>entry.suspect===suspect.id&&entry.mode===mode&&entry.answer.line===answer.line)).toBe(true);
    for(const sentence of splitSentences(answer.line)){
      const clip=manifest.clips.find(clip=>clip.speaker===suspect.id&&clip.text===sentence&&clip.take==="steady");
      expect(clip,suspect.id+" "+mode+": "+sentence).toBeDefined();
      expect(existsSync(resolve("..",clip!.path))).toBe(true);
    }
  }
});

it("every bundled sentence alias is bounded inside its shipped source and keeps its exact transcript",()=>{
  const clips=VOICE_MANIFEST as Array<{key:string;text:string;path:string;startSeconds?:number;endSeconds?:number;alignment:{characters:string[];starts:number[];ends:number[]}}>;
  const aliases=clips.filter(clip=>clip.startSeconds!==undefined);
  expect(aliases.length).toBeGreaterThan(0);
  for(const clip of aliases){
    const source=clips.find(candidate=>candidate.path===clip.path&&candidate.startSeconds===undefined);
    expect(source,clip.key).toBeDefined();
    expect(existsSync(resolve("..",clip.path)),clip.path).toBe(true);
    expect(clip.startSeconds).toBeGreaterThanOrEqual(0);
    expect(clip.endSeconds!).toBeGreaterThan(clip.startSeconds!);
    expect(clip.endSeconds!).toBeLessThanOrEqual(source!.alignment.ends.at(-1)!+.1);
    expect(clip.alignment.characters.join(""),clip.key).toBe(clip.text);
    expect(clip.alignment.ends.at(-1)!).toBeLessThanOrEqual(clip.endSeconds!-clip.startSeconds!+.001);
  }
});
