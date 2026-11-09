import {it,expect} from "vitest";
import {createRun10HeroCase} from "../../../Assets/Scripts/Content/Run10HeroCase";
import {HARLOW_DIALOGUE} from "../../../Assets/Scripts/Content/HarlowDialogue";
import {createHeroLineBank} from "../../../Assets/Scripts/Content/HeroLineBank";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {lookupLine} from "../../../Assets/Scripts/Engine/perf/LineBank";
import {validateLine} from "../../../Assets/Scripts/Engine/perf/LineValidator";
import {performanceRef} from "../../../Assets/Scripts/Engine/perf/ReferenceIds";
import {run10Questions} from "../../../Assets/Scripts/Content/Run10Questions";
import {storyMomentPlans} from "../../../Assets/Scripts/Engine/game/StoryMomentPlan";
import {VOICE_MANIFEST} from "../../../Assets/Scripts/Content/VoiceManifest";

it("chooses each authored account in its proper layer and mode, with complete bundled audio",()=>{
 const g=createRun10HeroCase(),bank=createHeroLineBank(g);
 for(const row of HARLOW_DIALOGUE){const statement=g.statements.find(s=>s.id===row.id)!,state=createGameState(g);state.suspects[row.speaker].layer=statement.layer;
  const sheet=buildFactSheet(g,state,row.speaker);
  for(const mode of ["answer","press","broken"] as const){const answer=lookupLine(bank,{suspect:row.speaker,topic:statement.topic,layer:statement.layer,mode},sheet,g)!;
   expect(answer.line,row.id+mode).toBe(mode==="press"?row.press||row.text:row.text);expect(validateLine(answer,sheet,g,mode).ok).toBe(true);
   expect(answer.cites).toEqual([performanceRef(mode==="press"?"p":"a",row.id)]);
   expect(VOICE_MANIFEST.some(r=>r.speaker===row.speaker&&r.text===answer.line),row.id+" audio").toBe(true);
  }
 }
});
it("never offers a broken secret to the initial account or accepts an uncited rewrite",()=>{
 const g=createRun10HeroCase();
 for(const row of HARLOW_DIALOGUE.filter(r=>/_ALIBI_[12]$/.test(r.id))){const st=g.statements.find(s=>s.id===row.id)!,sheet=buildFactSheet(g,createGameState(g),row.speaker);
  const answer={topic:st.topic,cites:[performanceRef("a",row.id)],line:row.text,emotion:"rattled" as const};expect(validateLine(answer,sheet,g).ok).toBe(false);
 }
 const sheet=buildFactSheet(g,createGameState(g),"S1");expect(validateLine({topic:"where@22:30",cites:[sheet.topicToRef["where@22:30"]],line:"I was in the Study with the cable.",emotion:"calm"},sheet,g).ok).toBe(false);
});
it("opens with the selected person's alibi, introduces each guest, and never sends Pike to the door on a timer",()=>{
 const g=createRun10HeroCase(),s=createGameState(g);
 for(const person of g.cast.suspects){const q=run10Questions(g,s,person.id);expect(q[0].topic).toBe("where@22:30");expect(q[1].topic).toBe("background");expect(q.length).toBeLessThanOrEqual(4);}
 s.elapsedMinutes=110;s.beatsFired=["B_FLIGHT"];s.events.push({type:"beat",seq:1,refs:["B_FLIGHT"]});expect(storyMomentPlans(g,s).some(p=>p.kind==="flight")).toBe(false);
 expect(g.statements.find(s=>s.id==="C_S4_BACKGROUND")!.canonical).toContain("Art dealer");
});
