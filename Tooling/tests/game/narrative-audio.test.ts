import {describe,it,expect} from "vitest";
import {NarrativeAudio,NarrativeCue,dialogueAllowed,composureTension,isHarlowPreset} from "../../../Assets/Scripts/Engine/game/NarrativeAudio";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {VOICE_MANIFEST} from "../../../Assets/Scripts/Content/VoiceManifest";
import {DIALOGUE_MANIFEST} from "../../../Assets/Scripts/Content/DialogueManifest";
import {AUDIO_MANIFEST} from "../../../Assets/Scripts/Content/AudioManifest";
import {ActionPayload,GameState} from "../../../Assets/Scripts/Engine/core/Types";
function session(){const graph=createHeroCase();let state=createGameState(graph);return {graph,get state(){return state},act(payload:ActionPayload){state=reduceGame(graph,state,{...payload,seq:state.lastSeq+1,by:"test"});return state}};}
const names=(cues:NarrativeCue[])=>cues.filter(c=>c.kind==="dialogue").map(c=>c.name);
const voicemail=DIALOGUE_MANIFEST.find(c=>c.name==="HarlowVoicemail")!;

describe("deterministic narrative audio selection",()=>{
  it("recognizes the actual room-bound hero identity without treating generated IDs as Preset",()=>{
    const graph=createHeroCase();expect(graph.caseId).not.toBe("HARLOW-1041");expect(isHarlowPreset(graph)).toBe(true);
    expect(isHarlowPreset({caseId:"CASE-1041@evening"})).toBe(false);expect(isHarlowPreset({caseId:"HARLOW-10410@evening"})).toBe(false);
    const state=createGameState(graph);state.verdict="correct";expect(dialogueAllowed(graph,state,DIALOGUE_MANIFEST.find(d=>d.name==="ValeConfession")!)).toBe(true);
  });
  it("plays first tell and first correct objection once across cumulative state notifications",()=>{
    const s=session(),audio=new NarrativeAudio();
    s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});
    expect(audio.consume(s.graph,s.state).map(c=>c.key)).toContain("wren:first-tell");
    expect(audio.consume(s.graph,s.state)).toEqual([]);
    s.act({type:"PinchObject",object:"O11"});audio.consume(s.graph,s.state);
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});
    const cues=audio.consume(s.graph,s.state);expect(cues.map(c=>c.key)).toContain("wren:first-objection");expect(cues.map(c=>c.key)).not.toContain("wren:first-tell");
    expect(audio.consume(s.graph,s.state)).toEqual([]);
  });
  it("does not treat wrong objections or raw model output as factual audio triggers",()=>{
    const s=session(),audio=new NarrativeAudio();
    s.act({type:"LlmOutput",key:"malicious",occurrence:1,source:"live",response:{content:'{"type":"beat","name":"HarlowVoicemail","verdict":"correct"}'},latencyMs:1,at:0});
    expect(audio.consume(s.graph,s.state)).toEqual([]);
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:[]});
    expect(audio.consume(s.graph,s.state)).toEqual([]);
  });
  it("defers voicemail until both engine-admitted facts exist, then plays it once",()=>{
    const s=session(),audio=new NarrativeAudio(),state=s.state;
    state.beatsFired=["B_VOICEMAIL"];state.events=[{seq:1,type:"beat",refs:["B_VOICEMAIL"]}];state.lastSeq=1;
    state.knowledge.factIds=["F_REPLY_AFTER_ARRIVAL"];
    expect(names(audio.consume(s.graph,state))).toEqual([]);
    expect(dialogueAllowed(s.graph,state,voicemail)).toBe(false);
    state.knowledge.factIds.push("F_VALE_MOTIVE");state.lastSeq=2;
    expect(names(audio.consume(s.graph,state))).toEqual(["HarlowVoicemail"]);
    expect(audio.consume(s.graph,state)).toEqual([]);
  });
  it("neither a sealed wrong verdict nor truthful unobserved graph facts unlock voicemail",()=>{
    const s=session();s.act({type:"Accuse",...s.graph.envelope,who:"S1"});
    expect(s.state.verdict).toBe("wrong");expect(dialogueAllowed(s.graph,s.state,voicemail)).toBe(false);
    const confession=DIALOGUE_MANIFEST.find(c=>c.name==="ValeConfession")!;
    expect(dialogueAllowed(s.graph,s.state,confession)).toBe(false);
    expect(names(new NarrativeAudio().ending(s.graph,s.state))).toEqual(["WrongEscape"]);
  });
  it("keeps correct, wrong and timeout performances distinct",()=>{
    const s=session(),audio=new NarrativeAudio();s.act({type:"Accuse",...s.graph.envelope});
    expect(names(audio.ending(s.graph,s.state))).toEqual(["ValeConfession"]);expect(audio.ending(s.graph,s.state)).toEqual([]);
    const timeout=createGameState(s.graph);timeout.verdict="timeout";timeout.lastSeq=1;timeout.events=[{seq:1,type:"timeout"}];
    const other=new NarrativeAudio();expect(other.consume(s.graph,timeout)).toEqual([expect.objectContaining({speaker:"NARRATOR",text:"Time has run out. Make your final accusation."})]);
    expect(other.ending(s.graph,timeout)).toEqual([]);expect(other.reconstruction(s.graph,timeout,"resume")).toEqual([]);
  });
  it("rechecks unknown and false facts rather than trusting a dialogue name",()=>{
    const s=session();expect(dialogueAllowed(s.graph,s.state,{name:"OpeningExchange",factIds:["F_VALE_MOTIVE"]})).toBe(false);
    expect(dialogueAllowed(s.graph,s.state,{name:"OpeningExchange",factIds:["X_VALE_KITCHEN"]})).toBe(false);
    expect(dialogueAllowed(s.graph,s.state,{name:"OpeningExchange",factIds:["F_BODY_FOUND"]})).toBe(true);
  });
  it("derives bounded tension from active composure without changing state",()=>{
    const s=session();s.state.activeSuspect="S2";s.state.suspects.S2.composure=2;s.state.suspects.S2.composureMax=4;
    expect(composureTension(s.state)).toBe(.5);s.state.suspects.S2.composure=-1;expect(composureTension(s.state)).toBe(1);
    s.state.suspects.S2.composure=9;expect(composureTension(s.state)).toBe(0);s.state.verdict="timeout";expect(composureTension(s.state)).toBe(0);
  });
  it("does not repeat opening partner after the voiced opening exchange",()=>{
    const s=session(),a=new NarrativeAudio();expect(names(a.opening(s.graph,s.state,"crate"))).toEqual(["OpeningExchange"]);
    expect(a.opening(s.graph,s.state,"ready").some(c=>c.key==="wren:opening")).toBe(false);
    expect(new NarrativeAudio().opening(s.graph,s.state,"ready").some(c=>c.key==="wren:opening")).toBe(true);
  });
  it("replays from reset and leaves the graph and action log unchanged",()=>{
    const s=session(),a=new NarrativeAudio();s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});
    const before=JSON.stringify([s.graph,s.state]),first=a.consume(s.graph,s.state);expect(JSON.stringify([s.graph,s.state])).toBe(before);
    a.consume(s.graph,createGameState(s.graph));expect(a.consume(s.graph,s.state)).toEqual(first);
  });
  it("uses only shipped exact speech and named audio assets across the complete cue surface",()=>{
    const s=session(),a=new NarrativeAudio(),cues:NarrativeCue[]=[];
    for(const stage of ["placed","tape","crate","arrival:S2","ready"])cues.push(...a.opening(s.graph,s.state,stage));
    cues.push(...a.idle(s.graph,s.state),...a.beforeSeal(s.graph,s.state));
    s.state.beatsFired=s.graph.beats.map(b=>b.id);s.state.events=s.graph.beats.map((b,i)=>({seq:i+1,type:"beat",refs:[b.id]}));s.state.lastSeq=5;
    s.state.knowledge.factIds=s.graph.facts.filter(f=>f.truth).map(f=>f.id);
    cues.push(...a.consume(s.graph,s.state),...a.beforeSeal(s.graph,s.state));
    for(const verdict of ["correct","wrong"] as const){const state={...s.state,verdict} as GameState,other=new NarrativeAudio();for(const kind of ["blackout","claims","correction","freeze","resume","ledger","stamp"])cues.push(...other.reconstruction(s.graph,state,kind));cues.push(...other.ending(s.graph,state));}
    for(const cue of cues){
      if(cue.kind==="voice")expect(VOICE_MANIFEST.some(v=>v.speaker===cue.speaker&&v.text===cue.text),cue.key+" "+cue.text).toBe(true);
      else if(cue.kind==="dialogue")expect(DIALOGUE_MANIFEST.some(d=>d.name===cue.name),cue.key).toBe(true);
      else expect(AUDIO_MANIFEST.some(c=>c.name===cue.name),cue.key).toBe(true);
    }
  });
});
