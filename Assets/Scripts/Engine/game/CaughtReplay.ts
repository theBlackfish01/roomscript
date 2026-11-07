import {CaseGraph,Fact,GameState,Id} from "../core/Types";

/** A certified placement, not a reconstruction of everything a suspect just said. */
export interface CaughtReplay {
  actor:Id;zone:Id;slot:number;durationSeconds:5;eventSeq:number;
  fact:Id;source:{kind:"statement"|"evidence";id:Id};
}

/**
 * A catch may reveal the true location inside a still-mixed next-layer account.
 * Read only that admitted account and the collected proof used for this catch.
 * No envelope, murder-time default, unobserved account or inferred movement is used.
 * The default sequence is the current action, so later notifications cannot revive a catch.
 */
export function caughtReplay(graph:CaseGraph,state:GameState,eventSeq:number=state.lastSeq):CaughtReplay|null {
  if(state.caseId!==graph.caseId||state.verdict||!Number.isSafeInteger(eventSeq)||eventSeq<1||eventSeq>state.lastSeq)return null;
  const event=state.events.slice().reverse().find(e=>e.seq===eventSeq&&(e.type==="objectionCorrect"||e.type==="objectionWrong"));
  if(!event||event.type!=="objectionCorrect"||!event.actor||!graph.cast.suspects.some(s=>s.id===event.actor))return null;
  const [brokenId,targetId,...offered]=event.refs||[];
  const broken=graph.statements.find(s=>s.id===brokenId),target=graph.statements.find(s=>s.id===targetId);
  if(!broken||!target||broken.stance!=="cover"||broken.onBreak!==target.id||broken.speaker!==event.actor||target.speaker!==event.actor||broken.topic!==target.topic)return null;
  if(!state.knowledge.statementIds.includes(broken.id)||!state.knowledge.statementIds.includes(target.id)||!offered.length)return null;
  const observed=new Set([...state.knowledge.evidenceIds,...state.knowledge.statementIds,...state.knowledge.factIds]);
  if(offered.some(id=>!observed.has(id)))return null;
  if(!broken.breakers.some(set=>set.length>0&&new Set(set).size===new Set(offered).size&&set.every(id=>offered.includes(id))))return null;
  const facts=graph.facts.concat(...graph.beats.filter(b=>b.validated&&state.beatsFired.includes(b.id)).map(b=>b.addsFacts||[]));
  const location=(id:Id):Fact|undefined=>facts.find(f=>f.id===id&&f.truth&&f.pred==="at"&&f.args.who===event.actor&&
    typeof f.args.zone==="string"&&graph.room.zones.some(z=>z.id===f.args.zone)&&Number.isSafeInteger(f.slot)&&f.slot!>=0&&f.slot!<graph.slots.length);
  const fromStatement=(Array.isArray(target.asserts)?target.asserts:[target.asserts]).map(id=>({fact:location(id),source:{kind:"statement" as const,id:target.id}})).filter(x=>!!x.fact);
  const fromEvidence=offered.flatMap(id=>{
    const evidence=graph.evidence.find(e=>e.id===id&&state.knowledge.evidenceIds.includes(e.id));
    return (evidence?.proves||[]).filter(f=>state.knowledge.factIds.includes(f)).map(f=>({fact:location(f),source:{kind:"evidence" as const,id}}));
  }).filter(x=>!!x.fact);
  // An admitted location is preferred. Ambiguous places/times never become an arbitrary ghost.
  const candidates=fromStatement.length?fromStatement:fromEvidence;
  if(!candidates.length)return null;
  const selected=candidates[0],fact=selected.fact!;
  if(candidates.some(c=>c.fact!.args.zone!==fact.args.zone||c.fact!.slot!==fact.slot))return null;
  return {actor:event.actor,zone:String(fact.args.zone),slot:fact.slot!,durationSeconds:5,eventSeq,fact:fact.id,source:selected.source};
}
