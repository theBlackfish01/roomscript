import {CaseGraph, Hypothesis} from "../core/Types";
export function validHypothesis(graph: CaseGraph, h: Hypothesis): boolean {
  return graph.cast.suspects.some(s => s.id === h.who) && graph.room.zones.some(z => z.id === h.where) && graph.weapons.includes(h.what);
}
export function judgeAccusation(graph: CaseGraph, h: Hypothesis): boolean {
  return validHypothesis(graph,h) && h.who === graph.envelope.who && h.where === graph.envelope.where && h.what === graph.envelope.what;
}
