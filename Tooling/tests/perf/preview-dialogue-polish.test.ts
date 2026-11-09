import {expect,it} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {heroLineBank} from "../../../Assets/Scripts/Content/HeroLineBank";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {lookupLine} from "../../../Assets/Scripts/Engine/perf/LineBank";
import {selectPerformance,performanceOpener} from "../../../Assets/Scripts/Engine/perf/PerformanceBank";
import {validateLine} from "../../../Assets/Scripts/Engine/perf/LineValidator";

it("starts each suspect's new subject with a direct, validated, already recorded answer",()=>{
  const graph=createHeroCase(),state=createGameState(graph);
  for(const person of graph.cast.suspects){const sheet=buildFactSheet(graph,state,person.id);
    for(const account of sheet.account.filter(r=>!r.topic!.startsWith("baseline:"))){
      const answer=lookupLine(heroLineBank,{suspect:person.id,topic:account.topic!,layer:0,mode:"answer",seq:4},sheet,graph)!;
      expect(answer).toBeDefined();expect(validateLine(answer,sheet,graph).ok).toBe(true);
      expect(heroLineBank.some(e=>e.suspect===person.id&&e.answer.line===answer.line)).toBe(true);
      expect(answer.line).not.toMatch(/^(Look|Well|If you must)/);
    }
  }
});
it("avoids a recent opener across topics before preferring the current mood",()=>{
  const graph=createHeroCase(),sheet=buildFactSheet(graph,createGameState(graph),"S2"),topic="where@22:30",ref=sheet.topicToRef[topic];
  graph.performances={register:[],variants:[
    {id:"same",suspect:"S2",ref,mode:"answer",text:"Look, I was in the Kitchen.",emotion:sheet.mood.emotion},
    {id:"fresh",suspect:"S2",ref,mode:"answer",text:"Forgive me. I was in the Kitchen.",emotion:"calm"}
  ]};sheet.recentLines=["Look, the kettle was boiling."];
  const answer=selectPerformance(graph,sheet,topic,"answer",8)!;
  expect(performanceOpener(answer.line)).toBe("forgive me");
  expect(selectPerformance(graph,sheet,topic,"answer",8)).toEqual(answer);
});
