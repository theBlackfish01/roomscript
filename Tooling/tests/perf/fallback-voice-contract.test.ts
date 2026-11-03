import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createHeroLineBank} from "../../../Assets/Scripts/Content/HeroLineBank";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {canonicalFallback} from "../../../Assets/Scripts/Engine/perf/LineBank";
import {validateLine} from "../../../Assets/Scripts/Engine/perf/LineValidator";
import {splitSentences} from "../../../Assets/Scripts/Engine/ai/Speech";

it("every suspect's neutral deterministic floor validates and has bundled sentence recordings",()=>{
  const graph=createHeroCase(),bank=createHeroLineBank(graph);
  const manifest=JSON.parse(readFileSync(resolve("audio/voice-manifest.json"),"utf8")) as {clips:Array<{speaker:string;text:string;take:string;path:string}>};
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
