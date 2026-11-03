import {CaseGraph, GameState, Id, Statement} from "../core/Types";
import {currentStatement, knownRefs} from "./Actions";
export interface ObjectionResult {correct: boolean; reason: string; target?: Statement;}
export function objectionReason(reason:string):string {
  const messages:Record<string,string>={not_current_claim:"That account has already changed. Use the current slip.",claim_not_observed:"Hear the account before challenging it.",claim_is_truthful:"That statement agrees with the certified facts.",evidence_not_observed:"Inspect or hear that evidence before presenting it.",does_not_refute:"These cards do not contradict this specific account. Use the exact supporting evidence.",invalid_ladder:"This account has no valid replacement."};
  return messages[reason]||"This objection is not supported by the evidence.";
}
export function judgeObjection(graph: CaseGraph, state: GameState, suspect: Id, statementId: Id, evidence: Id[]): ObjectionResult {
  const statement = graph.statements.find(s => s.id === statementId && s.speaker === suspect);
  if (!statement || currentStatement(graph,state,suspect,statement.topic)?.id !== statement.id) return {correct:false,reason:"not_current_claim"};
  if (!state.knowledge.statementIds.includes(statementId)) return {correct:false,reason:"claim_not_observed"};
  if (statement.stance !== "cover") return {correct:false,reason:"claim_is_truthful"};
  const known = knownRefs(state), offered = new Set(evidence);
  if (!evidence.length || evidence.some(id => !known.has(id))) return {correct:false,reason:"evidence_not_observed"};
  if (!statement.breakers.some(set => set.length > 0 && new Set(set).size === offered.size && set.every(id => offered.has(id)))) return {correct:false,reason:"does_not_refute"};
  const target = graph.statements.find(s => s.id === statement.onBreak && s.speaker === suspect && s.topic === statement.topic);
  if (!target || target.layer < statement.layer) return {correct:false,reason:"invalid_ladder"};
  return {correct:true,reason:"proven",target};
}
