import {describe,it,expect} from "vitest";
import {presentObject,presentGuest,revealedStatements} from "../../../Assets/Scripts/Engine/perf/PresentEvidence";
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

describe("Run 9: presenting evidence only uses the suspect's revealed layer",()=>{
  const graph=applyPresetEveningRoom(createHeroCase()),state=createGameState(graph);
  it("never maps a photo through a statement deeper than the suspect's current layer",()=>{
    let deeper=0,leaks=0;
    for(const person of graph.cast.suspects){
      const layer=state.suspects[person.id].layer;
      for(const object of graph.room.objects){
        const ask=presentObject(graph,state,person.id,object.id)!;
        const hidden=graph.statements.filter(s=>s.speaker===person.id&&s.about===object.id&&s.layer>layer);
        deeper+=hidden.length;
        // A chip reached only through a hidden statement's topic would leak it.
        for(const statement of hidden){
          const shallow=revealedStatements(graph,person.id,layer).some(s=>s.topic===statement.topic&&s.about===object.id);
          const direct=ask.topic==="weapon_"+object.id||ask.topic==="borrowed_item";
          const offered=presentedQuestions(graph,state,person.id).some(q=>q.topic===statement.topic);
          if(!shallow&&!direct&&offered)leaks++;
          if(!shallow&&!direct)expect(ask.topic).not.toBe(statement.topic);
        }
      }
    }
    expect(leaks).toBeGreaterThan(0); // the old all-layer match would have routed these through hidden statements
    expect(deeper).toBeGreaterThan(0); // the hero case does have deeper object statements, so the guard is exercised
  });
  it("revealedStatements excludes deeper layers and inactive replacements",()=>{
    for(const person of graph.cast.suspects)for(const s of revealedStatements(graph,person.id,0)){expect(s.layer).toBe(0);expect(s.replacementFor).toBeUndefined();}
  });
});
