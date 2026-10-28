import {performanceRef} from "../../../Assets/Scripts/Engine/perf/ReferenceIds";
import {describe, it, expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame, replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {Action, GameState} from "../../../Assets/Scripts/Engine/core/Types";
import {LlmOutputEvent} from "../../../Assets/Scripts/Engine/ai/LlmPort";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";

function raw(seq = 1): Extract<Action, {type: "LlmOutput"}> {
  const event: LlmOutputEvent = {type: "LlmOutput", key: "a".repeat(40), occurrence: 0, source: "live", latencyMs: 1800, at: 2200,
    response: {content: '{"truth":true,"culprit":"S1","line":"I killed Harlow.","clockMinutes":0}'}};
  return {seq, by: "P1", ...event};
}
function gameplay(state: GameState) {const {lastSeq, log, ...rest} = state; return rest;}

describe("raw model output audit actions", () => {
  it("only appends the output and advances sequence without knowledge, clock, performance, or beats", () => {
    const graph = createHeroCase(); const state = createGameState(graph);
    // Force a guaranteed beat to be due: a log-only action must not execute even this automatic path.
    graph.beats.forEach(beat => {beat.guaranteed = true; beat.validated = true; beat.minute = 0; beat.requires = [];});
    const before = JSON.stringify({graph, state}); const output = raw(); const result = reduceGame(graph, state, output);
    expect(result.lastSeq).toBe(1); expect(result.log).toEqual([output]); expect(gameplay(result)).toEqual(gameplay(state));
    expect(JSON.stringify({graph, state})).toBe(before);
    output.response.content = "changed by caller"; expect(result.log[0]).not.toEqual(output);
    expect(JSON.stringify(buildFactSheet(graph, result, "S2"))).not.toContain("I killed Harlow");
  });
  it.each(["correct", "wrong", "timeout"] as const)("records after %s verdict with no rejection or gameplay effects", verdict => {
    const graph = createHeroCase(); const state = createGameState(graph); state.verdict = verdict;
    const result = reduceGame(graph, state, raw()); expect(result.log).toHaveLength(1); expect(gameplay(result)).toEqual(gameplay(state));
  });
  it("replays raw and performed actions in their original order without promoting raw content", () => {
    const graph = createHeroCase(); const actions: Action[] = [raw(), {seq: 2, by: "P1", type: "LineSpoken", suspect: "S2", key: "performed",
      answer: {topic: "where@22:30", cites: [performanceRef("a","C_VALE_ALIBI_0")], line: "I was in the Kitchen at 22:30.", emotion: "guarded"}}, {...raw(3), source: "replay"}];
    const replayed = replayGame(graph, actions);
    expect(replayed.log.map(action => action.type)).toEqual(["LlmOutput", "LineSpoken", "LlmOutput"]);
    expect(replayed.events.filter(event => event.type === "lineSpoken")).toHaveLength(1);
    expect(replayed.events.some(event => event.text?.includes("I killed"))).toBe(false);
    expect(replayed.notebook).toEqual([]); expect(replayed.knowledge.factIds).toEqual(createGameState(graph).knowledge.factIds);
    expect(replayed.clockMinutes).toBe(createGameState(graph).clockMinutes);
  });
  it("still requires contiguous host sequence for raw events", () => {
    const graph = createHeroCase(); expect(() => reduceGame(graph, createGameState(graph), raw(2))).toThrow("ACTION_SEQUENCE");
  });
});
