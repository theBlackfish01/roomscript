import {CaseGraph, GameState} from "../core/Types";
import {knownRefs} from "./Actions";
import {minimumCostRoute,solvePlayerKnowledge} from "../case/Solver";
export interface HolmesScore {rating: number; deductions: number; required: number; minutes: number; minimumMinutes: number; stars: Array<{name:string;earned:boolean}>;}
export function scoreCase(graph: CaseGraph, state: GameState): HolmesScore {
  const known = knownRefs(state);
  const deductions = graph.requiredDeductions.filter(d => state.arguments.some(claim => claim.deduction === d.id &&
    d.supports.some(route => new Set(route).size === new Set(claim.refs).size && route.every(ref => claim.refs.includes(ref) && known.has(ref))))).length;
  const minimum = minimumCostRoute(graph,undefined,true).minutes;
  const supported = solvePlayerKnowledge(graph,state.knowledge).hypotheses.length === 1 &&
    graph.requiredDeductions.length > 0 && deductions === graph.requiredDeductions.length;
  const finalLayer=Math.max(...graph.statements.filter(s=>s.speaker===graph.envelope.who).map(s=>s.layer));
  const broke=state.events.some(e=>e.type==="objectionCorrect"&&e.actor===graph.envelope.who&&graph.statements.some(s=>s.id===e.refs?.[1]&&s.layer===finalLayer))&&state.events.filter(e=>e.type==="objectionWrong").length<=2;
  const stars=[{name:"Solved",earned:state.verdict==="correct"},{name:"Proven",earned:state.verdict==="correct"&&supported},{name:"Broke the culprit",earned:state.verdict==="correct"&&broke}];
  const rating = stars.filter(s=>s.earned).length;
  return {rating,deductions,required:graph.requiredDeductions.length,minutes:state.elapsedMinutes,minimumMinutes:minimum,stars};
}
