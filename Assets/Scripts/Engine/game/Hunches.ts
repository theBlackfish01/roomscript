import {CaseGraph, GameState, Id} from "../core/Types";
import {getCurrentStatements} from "./Actions";
/** Highlight an observed engine-marked cover, never disclose unseen envelope facts. */
export function chooseHunch(graph: CaseGraph, state: GameState): Id | null {
  for (const suspect of graph.cast.suspects) {
    const ss = state.suspects[suspect.id];
    const candidates = getCurrentStatements(graph,suspect.id,ss.layer,ss.topicOverrides);
    const known = candidates.find(s => s.stance === "cover" && state.knowledge.statementIds.includes(s.id));
    if (known) return known.id;
  }
  return null;
}
