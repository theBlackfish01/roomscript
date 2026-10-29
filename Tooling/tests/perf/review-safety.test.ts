import {describe,expect,it} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {validateLine} from "../../../Assets/Scripts/Engine/perf/LineValidator";
import {Answer} from "../../../Assets/Scripts/Engine/core/Types";

const graph=createHeroCase(),sheet=buildFactSheet(graph,createGameState(graph),"S2");
function validate(line:string){const answer:Answer={topic:"where@22:30",cites:[sheet.topicToRef["where@22:30"]],line,emotion:"guarded"};return validateLine(answer,sheet,graph);}
describe("A2 review probes",()=>{
  it.each(["I confess.","I had to kill him.","The doctor killed him.","I deceived you about the Kitchen.","I am an artificial intelligence.","I was in the Kitchen making tea at 22:30. I erased the fingerprints."])("blocks second-review paraphrase: %s",line=>expect(validate(line).ok).toBe(false));
  it.each(["No, Detective. I was in the Kitchen making tea at 22:30.","I was preparing tea in the Kitchen at 22:30."])("admits a natural grounded answer: %s",line=>expect(validate(line).ok).toBe(true));
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
  it.each([["I heard Harlow respond to Vale after she went into the Study.",true],["I heard Vale respond to Harlow after she went into the Study.",false]])("checks reply synonyms without reversing roles: %s",(line,accepted)=>{const sheet=buildFactSheet(graph,createGameState(graph),"S3");expect(validateLine({topic:"about:V",cites:[sheet.topicToRef["about:V"]],line,emotion:"guarded"},sheet,graph).ok).toBe(accepted);});
  it.each(["The Kitchen, at 22:30. I was making tea, nothing more dramatic than that.","I would rather not be pressed on it, but at 22:30 I was in the Kitchen making tea."])("keeps harmless reticence separate from factual negation: %s",line=>expect(validate(line).ok).toBe(true));
  it("rejects implication, reversed answer roles and an invented professional role",()=>{const initial=createGameState(graph),okafor=buildFactSheet(graph,initial,"S3"),pike=buildFactSheet(graph,initial,"S4");for(const line of ["Harlow answered Vale after she entered the Study, and frankly, Detective, that tells you who did it.","I heard Vale answer Harlow after he entered the Study, Detective."]){expect(validateLine({topic:"about:V",cites:[okafor.topicToRef["about:V"]],line,emotion:"guarded"},okafor,graph).ok).toBe(false);}expect(validateLine({topic:"motive:S2",cites:[pike.topicToRef["motive:S2"]],line:"As Vale's appointed trustee, I can tell you Harlow intended to expose those forged trust accounts.",emotion:"guarded"},pike,graph).ok).toBe(false);});
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
