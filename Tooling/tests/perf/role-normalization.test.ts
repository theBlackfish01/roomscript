import {describe,it,expect} from "vitest";
import {preservesRoles} from "../../../Assets/Scripts/Engine/perf/RoleGuard";
import {validateLine} from "../../../Assets/Scripts/Engine/perf/LineValidator";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";

describe("bounded grammatical normalization keeps roles and negation",()=>{
  it.each(["walked into","came into","gone into"])("admits destination-qualified %s without admitting outward travel",verb=>{
    expect(preservesRoles("I reached the Gallery.",`I ${verb} the Gallery.`)).toBe(true);
    for(const wrong of ["She walked into the Gallery.","I walked away from the Gallery.","I walked out of the Gallery.","I came from the Gallery."])
      expect(preservesRoles("I reached the Gallery.",wrong)).toBe(false);
  });
  it.each(["Mira","Jonas"])("preserves the subject of the perfect-aspect condition for %s",person=>{
    expect(preservesRoles(`${person} was already dead.`,`${person} had already died.`)).toBe(true);
    for(const wrong of [`${person} had not already died.`,`${person} had never died.`,`I had already died.`])
      expect(preservesRoles(`${person} was already dead.`,wrong)).toBe(false);
  });
  it("canonicalizes passive replies but still rejects reversed participants",()=>{
    const canonical="I heard Mira answer Jonas.";
    expect(preservesRoles(canonical,"Jonas was answered by Mira; I heard that.")).toBe(true);
    expect(preservesRoles(canonical,"Mira was answered by Jonas; I heard that.")).toBe(false);
    expect(preservesRoles(canonical,"Jonas was answered by Mira; she heard that.")).toBe(false);
  });
  it("equates self identification but never a different possessor or subject",()=>{
    expect(preservesRoles("My name is Imran Qadir.","I am Imran Qadir.")).toBe(true);
    for(const wrong of ["Your name is Imran Qadir.","His name is Imran Qadir.","She is Imran Qadir."])
      expect(preservesRoles("My name is Imran Qadir.",wrong)).toBe(false);
    expect(preservesRoles("My brooch is fastened.","Her brooch is fastened.")).toBe(false);
  });
  it("retains entity, time, polarity and reference gates around newly admitted forms",()=>{
    const graph=createHeroCase(),state=createGameState(graph);state.suspects.S2.layer=1;
    const sheet=buildFactSheet(graph,state,"S2"),topic="where@22:30",cites=[sheet.topicToRef[topic]];
    const answer={topic,cites,emotion:"guarded" as const,line:"I walked into the Study at 22:30. Harlow had already died."};
    expect(validateLine(answer,sheet,graph).ok).toBe(true);
    for(const line of [
      "I walked away from the Study at 22:30. Harlow had already died.",
      "Vale walked into the Study at 22:30. I had already died.",
      "I walked into the Kitchen at 22:30. Harlow had already died.",
      "I walked into the Study at 23:30. Harlow had already died.",
      "I walked into the Study at 22:30. Harlow had not already died.",
      "I walked into the Study at 22:30. Harlow had already died. I killed him.",
    ])expect(validateLine({...answer,line},sheet,graph).ok,line).toBe(false);
    expect(validateLine({...answer,cites:["none"]},sheet,graph).ok).toBe(false);
  });
  it("allows a cited verb's sentence-initial inflection without allowing foreign names",()=>{
    const graph=createHeroCase(),sheet=buildFactSheet(graph,createGameState(graph),"S4"),topic="motive:S2",cites=[sheet.topicToRef[topic]];
    const answer={topic,cites,emotion:"guarded" as const,line:"Exposing Vale's forged trust accounts was what Harlow intended."};
    expect(validateLine(answer,sheet,graph).ok).toBe(true);
    expect(validateLine({...answer,line:"Alice intended to expose Vale's forged trust accounts."},sheet,graph).ok).toBe(false);
    expect(validateLine({...answer,line:"Exposing Harlow's forged trust accounts was what Vale intended."},sheet,graph).ok).toBe(false);
  });
});
