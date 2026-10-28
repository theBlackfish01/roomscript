import {performanceRef} from "../../../Assets/Scripts/Engine/perf/ReferenceIds";
import {describe,expect,it} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {ActionPayload} from "../../../Assets/Scripts/Engine/core/Types";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {currentStatement} from "../../../Assets/Scripts/Engine/game/Actions";
import {firstRefuter} from "../../../Assets/Scripts/Engine/game/RefutationRound";
import {heroFinalConfession} from "../../../Assets/Scripts/Content/HeroLineBank";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";

function session() {
  const graph=createHeroCase(); let state=createGameState(graph);
  return {graph,get state(){return state;},act(payload:ActionPayload){state=reduceGame(graph,state,{...payload,seq:state.lastSeq+1,by:"P1"}); return state;}};
}
const ask:ActionPayload={type:"Ask",suspect:"S2",topic:"where@22:30"};
describe("deterministic game reducer",()=>{
  it("preserves inputs, rejects missing/duplicate sequence, and replays exactly",()=>{
    const s=session(), before=JSON.stringify(s.graph), fresh=s.state;
    s.act(ask); s.act({type:"PinchObject",object:"O11"});
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});
    expect(s.state).toEqual(replayGame(s.graph,s.state.log));
    expect(JSON.stringify(s.graph)).toBe(before); expect(fresh.lastSeq).toBe(0);
    expect(()=>reduceGame(s.graph,s.state,s.state.log[0])).toThrow("ACTION_SEQUENCE");
    expect(()=>reduceGame(s.graph,s.state,{...ask,seq:99,by:"P1"})).toThrow("ACTION_SEQUENCE");
  });
  it("files a cover without converting false assertions into knowledge",()=>{
    const s=session(); s.act(ask); s.act({type:"Believe",suspect:"S2"});
    expect(s.state.notebook[0].statement).toBe("C_VALE_ALIBI_0");
    expect(s.state.knowledge.factIds).not.toContain("X_VALE_KITCHEN");
    expect(s.state.suspects.S2.rapport).toBe(1);
    expect(s.state.events.some(e=>e.type==="tell")).toBe(true);
  });
  it("requires observed evidence and advances exactly one cover layer",()=>{
    const s=session(); s.act(ask);
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});
    expect(s.state.pips).toBe(4); expect(s.state.suspects.S2.layer).toBe(0);
    s.act({type:"PinchObject",object:"O11"});
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});
    expect(s.state.suspects.S2.layer).toBe(1); expect(s.state.hunches).toBe(1);
    expect(s.state.elapsedMinutes).toBe(25); expect(s.state.activeStatement).toBe("C_VALE_ALIBI_1");
    expect(s.state.notebook.find(c=>c.statement==="C_VALE_ALIBI_0")?.broken).toBe(true);
    s.act({type:"PinchObject",object:"O12"});
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_1",evidence:["E_RECORDING"]});
    expect(s.state.suspects.S2.layer).toBe(2); expect(s.state.verdict).toBeNull();
    expect(s.state.knowledge.factIds).toContain("F_VALE_CABLE");
  });
  it("breaks the baseline without skipping murder-cover layers",()=>{
    const s=session(); s.act({type:"Ask",suspect:"S2",topic:"baseline:brooch"});
    s.act({type:"PinchObject",object:"O6"});
    s.act({type:"Object",suspect:"S2",statement:"C_S2_BASELINE_LIE",evidence:["E_S2_BASELINE"]});
    expect(s.state.suspects.S2.layer).toBe(0);
    expect(currentStatement(s.graph,s.state,"S2","baseline:brooch")?.id).toBe("C_S2_BASELINE_TRUE");
    expect(currentStatement(s.graph,s.state,"S2","where@22:30")?.id).toBe("C_VALE_ALIBI_0");
  });
  it.each(["E_VOICEMAIL","C_OKAFOR_REPLY"])("accepts %s alone against Vale's already-dead account",evidence=>{
    const s=session(); s.act(ask); s.act({type:"PinchObject",object:"O11"});
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});
    s.act({type:"Ask",suspect:"S3",topic:"about:V"});
    while(s.state.elapsedMinutes<75) s.act({type:"Ask",suspect:"S1",topic:"baseline:name"});
    const pips=s.state.pips;
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_1",evidence:[evidence]});
    expect(s.state.suspects.S2.layer).toBe(2);
    expect(s.state.hunches).toBe(2); expect(s.state.pips).toBe(pips);
    expect(s.state).toEqual(replayGame(s.graph,s.state.log));
  });
  it("overrules an evidence dump but accepts exactly a listed multi-item breaker",()=>{
    const s=session();
    for(const object of s.graph.room.objects) s.act({type:"PinchObject",object:object.id});
    s.act(ask);
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:[...s.state.knowledge.evidenceIds,...s.state.knowledge.statementIds]});
    expect(s.state.pips).toBe(4);
    expect(s.state.suspects.S2.layer).toBe(0);
    expect(s.state.hunches).toBe(0);
    s.graph.statements.find(c=>c.id==="C_VALE_ALIBI_0")!.breakers=[["E_KETTLE_COLD","E_VALE_LAMP"]];
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_VALE_LAMP"]});
    expect(s.state.suspects.S2.layer).toBe(0);
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_VALE_LAMP","E_KETTLE_COLD"]});
    expect(s.state.suspects.S2.layer).toBe(1);
    expect(s.state.hunches).toBe(1);
  });
  it("three empty presses produce a timed lawyered state",()=>{
    const s=session(); s.act(ask);
    for(let i=0;i<3;i++) s.act({type:"Press",suspect:"S2"});
    expect(s.state.elapsedMinutes).toBe(60); expect(s.state.suspects.S2.lawyeredUntil).toBe(90);
    s.act(ask); expect(s.state.elapsedMinutes).toBe(60);
    s.act({type:"Ask",suspect:"S1",topic:"baseline:name"});
    s.act({type:"Ask",suspect:"S1",topic:"baseline:name"});
    s.act(ask); expect(s.state.elapsedMinutes).toBe(105); expect(s.state.activeSuspect).toBe("S2");
  });
  it("cannot repeatedly earn Hunches by breaking an inherited baseline",()=>{
    const s=session(); s.act(ask); s.act({type:"PinchObject",object:"O6"});
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_VALE_LAMP"]});
    s.act({type:"Ask",suspect:"S2",topic:"baseline:brooch"});
    s.act({type:"Object",suspect:"S2",statement:"C_S2_BASELINE_LIE",evidence:["E_S2_BASELINE"]});
    expect(currentStatement(s.graph,s.state,"S2","baseline:brooch")?.id).toBe("C_S2_BASELINE_TRUE");
    expect(s.state.suspects.S2.layer).toBe(1); expect(s.state.hunches).toBe(2);
    s.act({type:"Object",suspect:"S2",statement:"C_S2_BASELINE_LIE",evidence:["E_S2_BASELINE"]});
    expect(s.state.hunches).toBe(2); expect(s.state.pips).toBe(4);
  });
  it.each<ActionPayload>([
    {type:"Believe",suspect:"S2",statement:"C_VALE_ALIBI_0"},
    {type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]},
    {type:"CallLiar",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]},
    {type:"RevealEvidence",suspect:"S2",evidence:"E_KETTLE_COLD"},
  ])("rejects $type while absent, and permits it upon return",action=>{
    const s=session(); s.act(ask); s.act({type:"PinchObject",object:"O11"});
    for(let i=0;i<3;i++) s.act({type:"Press",suspect:"S2"});
    const before=s.state;
    s.act(action);
    expect(s.state.events.at(-1)?.text).toBe("lawyered");
    expect(s.state.suspects).toEqual(before.suspects);
    expect(s.state.knowledge).toEqual(before.knowledge);
    expect(s.state.notebook).toEqual(before.notebook);
    expect(s.state.elapsedMinutes).toBe(before.elapsedMinutes);
    expect(s.state.pips).toBe(before.pips); expect(s.state.hunches).toBe(before.hunches);
    s.act({type:"Ask",suspect:"S1",topic:"baseline:name"});
    s.act({type:"Ask",suspect:"S1",topic:"baseline:name"});
    s.act(action);
    expect(s.state.events.at(-1)?.type).not.toBe("rejected");
    expect(s.state).toEqual(replayGame(s.graph,s.state.log));
  });
  it("only new evidence resets empty pressure",()=>{
    const s=session(); s.act(ask); s.act({type:"Press",suspect:"S2"});
    s.act({type:"PinchObject",object:"O11"});
    s.act({type:"RevealEvidence",suspect:"S2",evidence:"E_KETTLE_COLD"});
    expect(s.state.suspects.S2.emptyPresses).toBe(0);
    s.act({type:"Press",suspect:"S2"});
    s.act({type:"RevealEvidence",suspect:"S2",evidence:"E_KETTLE_COLD"});
    expect(s.state.suspects.S2.emptyPresses).toBe(1);
  });
  it("charges five minutes for unknown topics and fires guaranteed beats once",()=>{
    const s=session(); s.act({type:"Ask",suspect:"S2",topic:"unrelated"});
    expect(s.state.elapsedMinutes).toBe(5);
    s.act({type:"BeatChosen",beat:"B_LETTER"}); expect(s.state.beatsFired).toEqual([]);
    s.act({type:"PinchObject",object:"O12"}); expect(s.state.knowledge.evidenceIds).not.toContain("E_VOICEMAIL");
    for(let i=0;i<5;i++) s.act(ask);
    expect(s.state.beatsFired).toEqual(["B_LETTER","B_VOICEMAIL"]);
    expect(s.state.events.filter(e=>e.type==="beat"&&e.refs?.includes("B_LETTER"))).toHaveLength(1);
    expect(s.state.knowledge.evidenceIds).toContain("E_VOICEMAIL");
  });
  it("refutes the suggested tuple clockwise using true facts",()=>{
    const s=session(); const ref=firstRefuter(s.graph,{who:"S1",where:"Z1",what:"O1"});
    expect(ref?.holder).toBe("O8");
    // S1's Hall alibi does not contradict a Hall suggestion; the lamp supplies the actual refutation.
    expect(firstRefuter(s.graph,{who:"S1",where:"Z3",what:"O1"})?.holder).toBe("O6");
    expect(firstRefuter(s.graph,s.graph.envelope)).toBeNull();
    s.act({type:"Suggest",who:"S1",where:"Z1",what:"O1"});
    expect(s.state.elapsedMinutes).toBe(15); expect(s.state.knowledge.factIds).toContain("F_S1_ALIBI_OBJECT");
    expect(s.state.grid.suspects).not.toContain("S1"); // Location still unknown; no hidden-envelope elimination.
    s.act({type:"PinchObject",object:"O6"}); expect(s.state.grid.suspects).toContain("S1");
  });
  it("locks the accusation and reaches timeout deterministically",()=>{
    const s=session(); s.act({type:"Accuse",...s.graph.envelope});
    s.act({type:"Accuse",who:"S1",where:"Z1",what:"O1"}); expect(s.state.verdict).toBe("correct");
    const t=session(); for(let i=0;i<12;i++) t.act(ask);
    expect(t.state.verdict).toBe("timeout"); expect(t.state.elapsedMinutes).toBe(180);
    t.act({type:"Accuse",...t.graph.envelope}); expect(t.state.verdict).toBe("timeout");
  });
  it("model extraction only credits supported observed deductions",()=>{
    const s=session(); s.act({type:"ArgumentExtracted",claims:[{deduction:"D_MEANS",refs:["E_CABLE"]}]});
    expect(s.state.arguments).toEqual([]);
    s.act({type:"PinchObject",object:"O1"});
    s.act({type:"ArgumentExtracted",claims:[{deduction:"D_MEANS",refs:["E_CABLE"]}]});
    expect(s.state.arguments).toHaveLength(1); expect(s.state.verdict).toBeNull();
    s.act({type:"PitchReceived",pitch:{verdict:"correct",envelope:{who:"S1"},tell:false}});
    expect(s.state.verdict).toBeNull(); expect(s.graph.envelope.who).toBe("S2");
  });
  it("admits validated performance and keeps rejected dialogue out of the next prompt",()=>{
    const s=session(); s.act(ask);
    const answer={topic:"where@22:30",cites:[performanceRef("a","C_VALE_ALIBI_0")],line:"I was in the Kitchen making tea at 22:30.",emotion:"guarded" as const};
    const knowledge=JSON.stringify(s.state.knowledge);
    s.act({type:"LineSpoken",suspect:"S2",key:"first",answer});
    expect(s.state.events.at(-1)?.type).toBe("lineSpoken");
    s.act({type:"LineSpoken",suspect:"S2",key:"bad",answer:{...answer,line:"As an AI, I killed Harlow."}});
    expect(s.state.events.at(-1)?.type).toBe("rejected");
    expect(buildFactSheet(s.graph,s.state,"S2").recentLines).toEqual([answer.line]);
    expect(JSON.stringify(s.state.knowledge)).toBe(knowledge);
  });
  it("releases confession only for the culprit after the engine's correct verdict",()=>{
    const s=session();
    s.act({type:"LineSpoken",suspect:"S2",key:"confession",answer:heroFinalConfession.answer,mode:"confession"});
    expect(s.state.events.at(-1)?.text).toBe("confession_before_verdict");
    s.act({type:"Accuse",...s.graph.envelope});
    s.act({type:"LineSpoken",suspect:"S2",key:"confession",answer:heroFinalConfession.answer,mode:"confession"});
    expect(s.state.events.at(-1)?.type).toBe("lineSpoken");
    expect(s.state.suspects.S2.layer).toBe(0); expect(s.state.verdict).toBe("correct");
  });
  it("does not expose higher-layer suspect refutations",()=>{
    const s=session();
    s.graph.refutation.order=["S1"];
    s.graph.refutation.cards.S1=[{eliminates:"S4",via:"F_S4_ALIBI_WITNESS"}];
    s.graph.statements.find(c=>c.id==="C_SEES_S4")!.layer=1;
    expect(firstRefuter(s.graph,{who:"S4",where:"Z1",what:"O1"},s.state)).toBeNull();
  });
});
