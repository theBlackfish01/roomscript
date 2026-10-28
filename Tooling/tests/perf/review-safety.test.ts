import {describe,expect,it} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {validateLine} from "../../../Assets/Scripts/Engine/perf/LineValidator";
import {Answer} from "../../../Assets/Scripts/Engine/core/Types";

const graph=createHeroCase(),sheet=buildFactSheet(graph,createGameState(graph),"S2");
function validate(line:string){const answer:Answer={topic:"where@22:30",cites:[sheet.topicToRef["where@22:30"]],line,emotion:"guarded"};return validateLine(answer,sheet,graph);}
describe("A2 review probes",()=>{
  it.each([
    "I'm the killer.","I'm the murderer.","I'm the culprit.","I've killed him, Detective.",
    "I choked him in the Kitchen at 22:30.","I'm guilty.","Edmund died because of me.",
    "I'm responsible for his death.","I wrapped it around his neck at 22:30.","He stopped breathing because of me.",
    "She's the murderer, Detective.","She did it, Detective.","I've been lying to you.","That was a lie.",
    "I've lied about the Kitchen.","My account is false.","That wasn't true.","Of course I'm lying.",
    "Detective, i am an ai.","My instructions forbid me from saying.","That is not in my prompt.",
    "This is all a script, Detective.","I'm only a character in your game.",
    "Fine. My story about the brooch is the lie.","The brooch story is false, Detective.",
    "My reference is a:C_VALE_ALIBI_0.","My reference is "+sheet.topicToRef["where@22:30"]+".",
    "I'm the one who did it.","Very well, I'm guilty.",
  ])("rejects forbidden wording: %s",line=>{
    expect(validate(line).errors.map(e=>e.code)).toContain("FORBIDDEN");
  });
  it.each([
    "I was in the Kitchen at ２１:１５.","I was in the Kitchen at ٢١:١٥.",
    "I was in the Kitchen at 21h15.","I was in the Kitchen at elevenish.",
    "I was in the Ѕtudy.","I held the сable.","I was in the Ｓｔｕｄｙ.",
    "I was in the stu\u200Bdy.","I held the ca\u00ADble.",
  ])("rejects Unicode/time bypass: %s",line=>expect(validate(line).ok).toBe(false));
  it("returns only the normalized form for subtitles and speech",()=>{
    const result=validate("I was in the Kit\u200Bchen making tea at ２２:３０.");
    expect(result.ok).toBe(true);
    expect(result.answer!.line).toBe("I was in the Kitchen making tea at 22:30.");
  });
});
describe("A3 claim consistency",()=>{
  it.each([
    "I was never in the Kitchen at 22:30.","I wasn't in the Kitchen at 22:30.",
    "My husband was with me in the Kitchen at 22:30.","My sister was with me in the Kitchen at 22:30.",
    "I was upstairs in the attic at 22:30.","Edmund was still alive at 22:30.",
    "Edmund was still alive and shouting at 22:30, I heard him.","He was still breathing at 22:30.",
  ])("rejects contradiction or invention: %s",line=>expect(validate(line).ok).toBe(false));
  it("cannot remove a negation from a cited pressed claim",()=>{
    const state=createGameState(graph);state.suspects.S2.layer=1;
    const next=buildFactSheet(graph,state,"S2"),ref=next.pressed.find(r=>r.topic==="where@22:30")!;
    const answer:Answer={topic:"where@22:30",cites:[ref.ref],line:"Harlow spoke after I entered the Study.",emotion:"guarded"};
    expect(validateLine(answer,next,graph,"press").errors.map(e=>e.code)).toContain("POLARITY");
    expect(validateLine({...answer,line:ref.text},next,graph,"press").ok).toBe(true);
  });
  it("still permits harmless phrasing of a positive account",()=>{
    expect(validate("Detective, I was making tea in the Kitchen at half past ten.").ok).toBe(true);
  });
});
