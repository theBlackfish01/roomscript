import {it,expect} from "vitest";
import tape from "../../results/run4-b-hero-v3.json";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {morningEdition,HEADLINE_MAX,SUBHEAD_MAX,Newspaper} from "../../../Assets/Scripts/Engine/game/MorningEdition";
import {Action} from "../../../Assets/Scripts/Engine/core/Types";

const text=(p:Newspaper)=>[p.masthead,p.date,p.headline,p.subhead,p.photoCaption,...p.columns].join(" ");
it("is null before any verdict",()=>{
  const graph=createHeroCase();let state=createGameState(graph);expect(morningEdition(graph,state)).toBeNull();
  for(const action of (tape.log as Action[]).filter(a=>a.type!=="Accuse")){state=reduceGame(graph,state,action);expect(morningEdition(graph,state)).toBeNull();}
});
it("names the culprit and method after the correct hero tape, with counts from the log",()=>{
  const graph=createHeroCase(),state=replayGame(graph,tape.log as Action[]),paper=morningEdition(graph,state)!;
  expect(paper.headline).toBe("VALE HELD IN HARLOW DEATH — CHARGER CABLE, STUDY");
  expect(paper.columns).toContain("Objections won: 3.");expect(paper.columns).toContain("3 statements broken of 6 heard.");
  expect(paper.columns).toContain("Minutes used: 145 of 180.");expect(paper.columns).toContain("Deductions proved: 4 of 4.");
  expect(morningEdition(createHeroCase(),replayGame(createHeroCase(),tape.log as Action[]))).toEqual(paper);
});
it("a wrong verdict names only the accused, never the true culprit",()=>{
  const graph=createHeroCase(),state=reduceGame(graph,createGameState(graph),{type:"Accuse",who:"S1",where:"Z3",what:"O3",seq:1,by:"P1"});
  const paper=morningEdition(graph,state)!;
  expect(paper.headline).toBe("WRONG CALL? QADIR CHARGED IN HARLOW DEATH");expect(text(paper)).not.toMatch(/Vale|VALE|Marguerite/);
  const half=morningEdition(graph,reduceGame(graph,createGameState(graph),{type:"Accuse",who:"S2",where:"Z4",what:"O1",seq:1,by:"P1"}))!;
  expect(half.headline.startsWith("WRONG CALL?")).toBe(true);
});
it("timeout goes cold and names no one",()=>{
  const graph=createHeroCase();let state=createGameState(graph);
  for(let i=1;state.verdict===null;i++)state=reduceGame(graph,state,{type:"Ask",suspect:"S1",topic:"nothing",seq:i,by:"P1"});
  const paper=morningEdition(graph,state)!;
  expect(paper.headline).toBe("HARLOW CASE GOES COLD");
  for(const s of graph.cast.suspects)expect(text(paper)).not.toContain(s.name.split(" ").slice(-1)[0]);
});
it("keeps every possible headline and subhead within limits",()=>{
  const graph=createHeroCase(),fresh=createGameState(graph);
  for(const s of graph.cast.suspects)for(const z of graph.room.zones)for(const w of graph.weapons){
    const paper=morningEdition(graph,reduceGame(graph,fresh,{type:"Accuse",who:s.id,where:z.id,what:w,seq:1,by:"P1"}))!;
    expect(paper.headline.length).toBeLessThanOrEqual(HEADLINE_MAX);expect(paper.subhead.length).toBeLessThanOrEqual(SUBHEAD_MAX);
    if(s.id!=="S2")expect(text(paper)).not.toMatch(/Vale|VALE/);
    if(s.id!=="S2"||z.id!=="Z1"||w!=="O1")expect(paper.subhead.endsWith(graph.room.zones.find(x=>x.id===z.id)!.clueName)).toBe(true);
  }
});
