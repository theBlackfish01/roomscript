import {describe,it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createRun10HeroCase,applyRun10HeroCase,RUN10_FIND_OBJECTS,RUN10_PAPERS,RUN10_PAPER_POSITIONS} from "../../../Assets/Scripts/Content/Run10HeroCase";
import {run10Questions} from "../../../Assets/Scripts/Content/Run10Questions";
import {verifyCase,solvePlayerKnowledge} from "../../../Assets/Scripts/Engine/case/Solver";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {ActionPayload} from "../../../Assets/Scripts/Engine/core/Types";
import {fuzzPlayers} from "../../scripts/fuzz-players";

describe("Run 10 physical hero remap",()=>{
  it("preserves every truth, statement, breaker and sealed answer while changing graph identity",()=>{
    const old=createHeroCase(),graph=createRun10HeroCase();
    expect(graph.facts).toEqual(old.facts);expect(graph.statements).toEqual(old.statements);
    expect(graph.envelope).toEqual(old.envelope);expect(graph.requiredDeductions).toEqual(old.requiredDeductions);
    expect(graph.caseId).toMatch(/:evening-v3:run10$/);expect(graph.pitchHash).not.toBe(old.pitchHash);
    expect(applyRun10HeroCase(graph)).toEqual(graph);
  });
  it("maps each story item to a physical holder and makes one letter discoverable without a timer",()=>{
    const graph=createRun10HeroCase(),holder=(id:string)=>graph.evidence.find(e=>e.id===id)!.holder;
    expect(holder("E_S1_ALIBI")).toBe("O14");expect(holder("E_S3_ALIBI")).toBe("O4");expect(holder("E_S4_ALIBI")).toBe("O15");
    expect(holder("E_TRUST_NOTE")).toBe("O13");expect(holder("E_LETTER")).toBe("O13");
    expect(graph.room.objects.filter(o=>o.label==="Harlow's letter")).toHaveLength(1);
    expect(Object.keys(RUN10_PAPERS)).toEqual(["O13","O14","O15"]);
    expect(graph.beats.map(b=>b.id)).toEqual(["B_VOICEMAIL","B_FLIGHT"]);
    expect(graph.evidence.some(e=>e.id==="E_UV_DRAG")).toBe(false);
    const state=reduceGame(graph,createGameState(graph),{type:"PinchObject",object:"O13",seq:1,by:"test"});
    expect(state.knowledge.evidenceIds).toEqual(expect.arrayContaining(["E_TRUST_NOTE","E_LETTER"]));
    expect(state.elapsedMinutes).toBe(10);
    for(const id of RUN10_FIND_OBJECTS)expect(graph.room.objects.some(o=>o.id===id)).toBe(true);
    for(const e of graph.evidence.filter(e=>RUN10_FIND_OBJECTS.includes(e.holder)))expect(e.id).not.toContain("BASELINE");
    expect(RUN10_PAPER_POSITIONS.O14).not.toEqual(RUN10_PAPER_POSITIONS.O15);
  });
  it("proves the complete transformed graph solvable with source-independent routes",()=>{
    const graph=createRun10HeroCase(),proof=verifyCase(graph);
    expect(proof.issues).toEqual([]);expect(proof.hypotheses).toEqual([graph.envelope]);
    expect(Object.values(proof.routesPerElimination).every(n=>n>=2)).toBe(true);
    expect(proof.minRouteMinutes).toBeLessThanOrEqual(graph.clockMinutes*.6);
    // Dormant legacy fixtures must not be what makes the new wearer flow solvable.
    const exposed={...graph,evidence:graph.evidence.filter(e=>RUN10_FIND_OBJECTS.includes(e.holder)),statements:graph.statements.filter(s=>!s.topic.startsWith("baseline:"))};
    expect(verifyCase(exposed).issues).toEqual([]);
  });
  it("solves through find/ask/show/accuse only, with no suggestions, pulls or baseline questions",()=>{
    const graph=createRun10HeroCase();let state=createGameState(graph);
    const act=(payload:ActionPayload)=>{state=reduceGame(graph,state,{...payload,seq:state.lastSeq+1,by:"naive"});};
    act({type:"Ask",suspect:"S2",topic:"where@22:30"});
    act({type:"PinchObject",object:"O11"});
    act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});
    act({type:"PinchObject",object:"O12"});
    act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_1",evidence:["E_RECORDING"]});
    for(const object of ["O1","O2","O3","O4","O5","O13","O14","O15"])act({type:"PinchObject",object});
    expect(state.suspects.S2.layer).toBe(2);expect(solvePlayerKnowledge(graph,state.knowledge).hypotheses).toEqual([graph.envelope]);
    expect(graph.requiredDeductions.every(d=>d.supports.some(route=>route.every(id=>state.knowledge.evidenceIds.includes(id)||state.knowledge.statementIds.includes(id))))).toBe(true);
    act({type:"Accuse",who:"S2",where:"Z1",what:"O1"});
    expect(state.verdict).toBe("correct");expect(state.log).toHaveLength(14);expect(replayGame(graph,state.log)).toEqual(state);
    expect(state.events.some(e=>e.type==="rejected")).toBe(false);
  });
  it("offers at most four existing natural account topics without baseline tell teaching",()=>{
    const graph=createRun10HeroCase(),state=createGameState(graph);
    for(const person of graph.cast.suspects){const choices=run10Questions(graph,state,person.id);
      expect(choices.length).toBeGreaterThan(0);expect(choices.length).toBeLessThanOrEqual(4);
      expect(choices[0].topic).toBe("where@22:30");
      for(const q of choices){expect(q.topic).not.toMatch(/^baseline:/);expect(q.question.endsWith("?")).toBe(true);expect(graph.statements.some(s=>s.speaker===person.id&&s.topic===q.topic)).toBe(true);}
    }
  });
  it("passes 64 seeded real-reducer player fuzz runs on the transformed graph",()=>{
    const report=fuzzPlayers(createRun10HeroCase(),64,104110);
    expect(report.players).toBe(64);expect(Object.values(report.terminations).reduce((a,b)=>a+b,0)).toBe(64);
    expect(report.terminations.correct).toBeGreaterThan(0);expect(report.actions).toBeGreaterThan(1000);
  },60000);
});
