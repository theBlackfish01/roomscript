import {CaseGraph,GameState,Id} from "../core/Types";
import {currentStatement} from "./Actions";

/** Translate one found physical item into an exact authored objection payload.
 * A recorder can carry several observations; offering them all would fail the
 * judge's exact-set rule. This selects only collected evidence on this item.
 * The judge remains responsible for truth, costs and advancing the account.
 */
export function showItemEvidence(graph:CaseGraph,state:GameState,suspect:Id,statementId:Id,objectId:Id):Id[] {
  if(!graph.room.objects.some(object=>object.id===objectId))return [];
  const known=new Set(state.knowledge.evidenceIds);
  const itemEvidence=graph.evidence.filter(e=>e.holder===objectId&&known.has(e.id)).map(e=>e.id);
  if(!itemEvidence.length)return [];
  const available=new Set(itemEvidence);
  const statement=graph.statements.find(s=>s.id===statementId&&s.speaker===suspect);
  if(statement&&state.knowledge.statementIds.includes(statement.id)&&
      currentStatement(graph,state,suspect,statement.topic)?.id===statement.id){
    const breaker=statement.breakers.find(set=>set.length>0&&set.every(id=>available.has(id)));
    if(breaker)return breaker.slice();
  }
  // A wrong item still reaches the normal Object judgement, without borrowing
  // facts from a different item or exposing uncollected evidence.
  return [itemEvidence[0]];
}
