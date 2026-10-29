import {CaseGraph, Fact, GameState, Hypothesis, Id, RefutationCard} from "../core/Types";
import {consistent} from "../case/Solver";
import {getCurrentStatements, statementFacts} from "./Actions";
export interface RefutationResult {holder: Id; card: RefutationCard; fact: Fact;}
/** Only engine-certified true cards; the later optional LIAR feature never affects objects. */
export function firstRefuter(graph: CaseGraph, suggestion: Hypothesis, state?: GameState): RefutationResult | null {
  const cards = [suggestion.who,suggestion.where,suggestion.what];
  for (const holder of state?.refuterOrder || graph.refutation.order) {
    const suspect=graph.cast.suspects.find(s=>s.id===holder);
    const ss=state?.suspects[holder];
    const available=suspect ? getCurrentStatements(graph,holder,ss?.layer ?? 0,ss?.topicOverrides || {}).filter(s=>s.stance==="truth").flatMap(statementFacts) : null;
    for (const card of graph.refutation.cards[holder] || []) {
      if (!cards.includes(card.eliminates)) continue;
      if (available && !available.includes(card.via)) continue;
      const fact = graph.facts.find(f => f.id === card.via && f.truth);
      if (fact && !consistent(suggestion,[fact],graph)) return {holder,card,fact};
    }
  }
  return null;
}
