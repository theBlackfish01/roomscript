import {it,expect} from "vitest";
import tape from "../../results/run4-b-hero-v3.json";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {scoreCase} from "../../../Assets/Scripts/Engine/game/Scoring";
import {solvePlayerKnowledge} from "../../../Assets/Scripts/Engine/case/Solver";
import {canonicalJson} from "../../../Assets/Scripts/Engine/core/CanonicalJson";
import {hashHex} from "../../../Assets/Scripts/Engine/core/Hash";
import {Action} from "../../../Assets/Scripts/Engine/core/Types";
it("replays the saved complete hero route without a model and preserves its seal, facts and verdict",()=>{
  const graph=createHeroCase(),state=replayGame(graph,tape.log as Action[]);
  expect(graph.pitchHash).toBe(tape.seal);expect(hashHex(canonicalJson(state))).toBe(tape.expected.stateHash);
  expect(state.verdict).toBe("correct");expect(state.suspects.S2.layer).toBe(2);expect(state.arguments).toHaveLength(4);
  expect(state.events.filter(e=>e.type==="objectionCorrect")).toHaveLength(3);
  expect(state.events.some(e=>e.type==="refuted")).toBe(true);expect(solvePlayerKnowledge(graph,state.knowledge).hypotheses).toEqual([graph.envelope]);
  expect(scoreCase(graph,state)).toEqual(tape.expected.score);
});
