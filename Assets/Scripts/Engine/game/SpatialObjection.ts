import {CaseGraph,GameState,Vec3} from "../core/Types";

/** One presentation boundary shared by Lens selection and regression tests. */
export function walletEntries(graph:CaseGraph,state:GameState):{id:string;text:string}[] {
  return graph.evidence.filter(e=>state.knowledge.evidenceIds.includes(e.id)).map(e=>({id:e.id,text:e.canonical})).concat(
    graph.statements.filter(s=>state.knowledge.statementIds.includes(s.id)).map(s=>({id:s.id,text:(graph.cast.suspects.find(p=>p.id===s.speaker)?.name||s.speaker)+": "+s.canonical})));
}

/** Object drops never guess which of several memories refutes a claim. */
export function objectDropEvidence(graph:CaseGraph,state:GameState,object:string):string[] {
  const observed=graph.evidence.filter(e=>e.holder===object&&state.knowledge.evidenceIds.includes(e.id));
  return observed.length===1?[observed[0].id]:[];
}
/** Move only to a location supported by a true fact in the replacement statement. */
export function provenMark(graph:CaseGraph,statement:string):Vec3|null {
  const claim=graph.statements.find(s=>s.id===statement);if(!claim)return null;
  const refs=typeof claim.asserts==="string"?[claim.asserts]:claim.asserts;
  const fact=graph.facts.find(f=>refs.includes(f.id)&&f.truth&&f.pred==="at"&&f.args.who===claim.speaker);
  const zone=fact&&graph.room.zones.find(z=>z.id===fact.args.zone);
  return zone?[zone.anchor[0],zone.anchor[1],zone.anchor[2]+55]:null;
}
