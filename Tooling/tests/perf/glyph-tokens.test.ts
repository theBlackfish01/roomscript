import {describe,it,expect} from "vitest";
import {questionGlyph,verbGlyph,subtitleWindow} from "../../../Assets/Scripts/Engine/perf/GlyphTokens";
import {presentedQuestions} from "../../../Assets/Scripts/Engine/perf/QuestionPresentation";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {applyPresetEveningRoom} from "../../../Assets/Scripts/Content/PresetEveningRoom";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";

describe("Run 8 glyph tokens",()=>{
  it("maps every presented hero question to a short one-word token",()=>{
    const graph=applyPresetEveningRoom(createHeroCase()),state=createGameState(graph);
    for(const person of graph.cast.suspects){
      const questions=presentedQuestions(graph,state,person.id);expect(questions.length).toBeGreaterThan(0);
      for(const q of questions){const token=questionGlyph(q.topic,q.label);expect(token.word.length).toBeGreaterThan(0);expect(token.word.length).toBeLessThanOrEqual(9);expect(token.word).not.toMatch(/\s{2}/);}
      const where=questions.find(q=>q.topic==="whereabouts"||q.topic.startsWith("where@"));if(where)expect(questionGlyph(where.topic,where.label)).toEqual({word:"Where",icon:"where"});
    }
  });
  it("names the core tokens from the spec",()=>{
    expect(questionGlyph("baseline:name","Your name")).toEqual({word:"Name",icon:"name"});
    expect(questionGlyph("about_S3","Okafor")).toEqual({word:"Okafor",icon:"person"});
    expect(questionGlyph("free","Ask anything").word).toBe("Ask");
    expect(verbGlyph("Press")).toEqual({word:"Lying?",icon:"lie"});
    expect(verbGlyph("Object").icon).toBe("object");
  });
  it("keeps subtitles to one short line of the newest words",()=>{
    expect(subtitleWindow("I was in the study.")).toBe("I was in the study.");
    const long="I was in the kitchen making tea for Edmund when the lights went out and I heard the door";
    const line=subtitleWindow(long,38);expect(line.length).toBeLessThanOrEqual(38);expect(line.startsWith("…")).toBe(true);expect(long.endsWith(line.slice(1))).toBe(true);
    expect(subtitleWindow("Supercalifragilisticexpialidociousnessness",20).length).toBeLessThanOrEqual(20);
  });
});
