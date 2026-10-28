import {CaseGraph, GameState} from "../core/Types";
import {knownRefs} from "./Actions";
export interface HolmesScore {rating: number; deductions: number; required: number; minutes: number; minimumMinutes: number;}
export function scoreCase(graph: CaseGraph, state: GameState): HolmesScore {
  const known = knownRefs(state);
  const deductions = graph.requiredDeductions.filter(d => state.arguments.some(claim => claim.deduction === d.id &&
    d.supports.some(route => route.every(ref => claim.refs.includes(ref) && known.has(ref))))).length;
  const minimum = graph.solver?.minRouteMinutes ?? 0;
  const efficient = state.elapsedMinutes <= Math.max(15, minimum * 1.25);
  const rating = state.verdict !== "correct" ? 0 : 1 + (deductions === graph.requiredDeductions.length ? 1 : 0) + (efficient && state.pips >= 3 ? 1 : 0);
  return {rating,deductions,required:graph.requiredDeductions.length,minutes:state.elapsedMinutes,minimumMinutes:minimum};
}
