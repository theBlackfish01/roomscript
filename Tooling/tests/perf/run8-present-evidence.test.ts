import {describe,it,expect} from "vitest";
import {presentObject,presentGuest} from "../../../Assets/Scripts/Engine/perf/PresentEvidence";
import {presentedQuestions} from "../../../Assets/Scripts/Engine/perf/QuestionPresentation";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {applyPresetEveningRoom} from "../../../Assets/Scripts/Content/PresetEveningRoom";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";

describe("Run 8 presenting evidence and pointing at guests",()=>{
  const graph=applyPresetEveningRoom(createHeroCase()),state=createGameState(graph);
  it("maps every object to an offered chip topic or a free question, never an invented topic",()=>{
    for(const person of graph.cast.suspects)for(const object of graph.room.objects){
      const ask=presentObject(graph,state,person.id,object.id)!;expect(ask).not.toBeNull();
      if(ask.kind==="chip")expect(presentedQuestions(graph,state,person.id).some(q=>q.topic===ask.topic)).toBe(true);
      else{expect(ask.topic).toBe("free");expect(ask.question).toContain(object.label);}
    }
  });
  it("asks about another guest through the presented about_ topic when offered",()=>{
    for(const person of graph.cast.suspects)for(const other of graph.cast.suspects){
      const ask=presentGuest(graph,state,person.id,other.id);
      if(person.id===other.id){expect(ask).toBeNull();continue;}
      expect(ask).not.toBeNull();const offered=presentedQuestions(graph,state,person.id).some(q=>q.topic==="about_"+other.id);
      expect(ask!.kind).toBe(offered?"chip":"free");if(!offered)expect(ask!.question).toContain(other.name);
    }
  });
  it("rejects unknown ids",()=>{expect(presentObject(graph,state,"S2","NOPE")).toBeNull();expect(presentGuest(graph,state,"S2","NOPE")).toBeNull();});
});
