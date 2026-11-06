import {CaseGraph,Fact,GameEvent,GameState,Id} from "../core/Types";
import {statementFacts} from "./Actions";

export interface WebNode {kind:"suspect"|"object"|"zone"|"victim";id:string}
export interface WebThread {
  id:string;from:WebNode;to:WebNode;kind:"objection"|"deduction"|"refutation"|"testimony"|"proof";seq:number;label:string;
  /** Collected evidence this thread came from, when there is one. */
  evidence?:string;
}
export interface EvidenceWebOptions {
  /** Clue Night: show only private refutations addressed to this player. Omitted = solo, all refutations. */
  viewer?:string;
}

/** Display name for a case id: suspect surname, victim surname, zone clue name or object label. */
export function webName(graph:CaseGraph,id:Id):string {
  const person=graph.cast.suspects.find(s=>s.id===id)||(graph.cast.victim.id===id?graph.cast.victim:undefined);
  if(person)return person.name.split(" ").slice(-1)[0];
  const zone=graph.room.zones.find(z=>z.id===id);if(zone)return zone.clueName;
  const object=graph.room.objects.find(o=>o.id===id);return object?object.label:id;
}
/** Classifies a graph id as a web node; evidence resolves to its holder and statements to their speaker. */
export function webNode(graph:CaseGraph,id:Id):WebNode|null {
  if(graph.cast.victim.id===id)return {kind:"victim",id};
  if(graph.cast.suspects.some(s=>s.id===id))return {kind:"suspect",id};
  if(graph.room.zones.some(z=>z.id===id))return {kind:"zone",id};
  if(graph.room.objects.some(o=>o.id===id))return {kind:"object",id};
  const evidence=graph.evidence.find(e=>e.id===id);if(evidence)return webNode(graph,evidence.holder);
  const statement=graph.statements.find(s=>s.id===id);if(statement)return webNode(graph,statement.speaker);
  return null;
}
/** The two things a known fact links, or null for facts that do not join two nodes. */
function factLink(graph:CaseGraph,fact:Fact):{from:WebNode;to:WebNode;label:string}|null {
  const a=fact.args,pair=(x:unknown,y:unknown,label:string)=>{
    const from=typeof x==="string"?webNode(graph,x):null,to=typeof y==="string"?webNode(graph,y):null;
    return from&&to&&from.id!==to.id?{from,to,label}:null;
  };
  if(fact.pred==="at")return pair(a.who,a.zone,webName(graph,String(a.who))+" in "+webName(graph,String(a.zone)));
  if(fact.pred==="touched")return pair(a.who,a.obj,webName(graph,String(a.who))+" handled "+webName(graph,String(a.obj)));
  if(fact.pred==="in")return pair(a.obj,a.zone,webName(graph,String(a.obj))+" in "+webName(graph,String(a.zone)));
  if(fact.pred==="motive")return pair(a.who,a.victim,webName(graph,String(a.who))+" had motive");
  return null;
}
function refEntities(graph:CaseGraph,ref:Id):Id[] {
  const evidence=graph.evidence.find(e=>e.id===ref);if(evidence)return evidence.entities.concat(evidence.holder);
  const statement=graph.statements.find(s=>s.id===ref);return statement?statement.entities.concat(statement.speaker):[];
}
const DEDUCTION_NAMES:Record<string,string>={opportunity:"Opportunity",means:"Means",alibi_broken:"Alibi broken",motive:"Motive",timeline:"Timeline"};

/** Red threads, one per admitted engine event link. Uses only events, collected evidence and known facts. */
export function evidenceWeb(graph:CaseGraph,state:GameState,opts:EvidenceWebOptions={}):WebThread[] {
  if(state.caseId!==graph.caseId)return [];
  const known=new Set(state.knowledge.factIds),out=new Map<string,WebThread>();
  const add=(kind:WebThread["kind"],seq:number,from:WebNode,to:WebNode,label:string,ref:string,evidence?:string)=>{
    if(from.id===to.id)return;
    const id=kind+":"+seq+":"+from.id+">"+to.id+":"+ref;
    if(!out.has(id))out.set(id,{id,from:{...from},to:{...to},kind,seq,label,...(evidence?{evidence}:{})});
  };
  const knownFacts=(ids:Id[])=>ids.filter(id=>known.has(id)).map(id=>graph.facts.find(f=>f.id===id&&f.truth)).filter((f):f is Fact=>!!f);
  const admitted=new Map<Id,number>();
  const admit=(ref:Id,seq:number)=>{if(graph.statements.some(s=>s.id===ref)&&!admitted.has(ref))admitted.set(ref,seq);};
  const events:GameEvent[]=state.events;
  for(const event of events){
    const refs=event.refs||[];
    if(event.type==="evidence"&&refs[0]){
      const evidence=graph.evidence.find(e=>e.id===refs[0]);
      if(!evidence||!state.knowledge.evidenceIds.includes(evidence.id))continue;
      for(const fact of knownFacts(evidence.proves)){const link=factLink(graph,fact);if(link)add("proof",event.seq,link.from,link.to,link.label,fact.id,evidence.id);}
    }
    else if(event.type==="objectionCorrect"&&event.actor){
      const liar=webNode(graph,event.actor);if(!liar)continue;
      admit(refs[1],event.seq);
      for(const ref of refs.slice(2)){
        const breaker=webNode(graph,ref);if(!breaker)continue;
        admit(ref,event.seq);
        const isEvidence=graph.evidence.some(e=>e.id===ref);
        add("objection",event.seq,liar,breaker,webName(graph,breaker.id)+" broke "+webName(graph,liar.id),ref,isEvidence?ref:undefined);
      }
    }
    else if(event.type==="argumentSupported"&&refs[0]){
      const deduction=graph.requiredDeductions.find(d=>d.id===refs[0]);
      const subject=deduction&&webNode(graph,deduction.subject);if(!deduction||!subject)continue;
      const support=refs.slice(1);
      // The subject must be named by the filed support itself; the deduction id alone never adds a link.
      if(!support.some(ref=>refEntities(graph,ref).includes(deduction.subject)))continue;
      for(const ref of support){
        const node=webNode(graph,ref);if(!node)continue;
        admit(ref,event.seq);
        const isEvidence=graph.evidence.some(e=>e.id===ref);
        add("deduction",event.seq,node,subject,(DEDUCTION_NAMES[deduction.type]||deduction.type)+": "+webName(graph,subject.id),ref,isEvidence?ref:undefined);
      }
    }
    else if(event.type==="refuted"&&event.actor&&refs.length>=2){
      if(opts.viewer!==undefined&&event.data?.privateTo!==opts.viewer)continue;
      if(!known.has(refs[1]))continue;
      const holder=webNode(graph,event.actor),cleared=webNode(graph,refs[0]);
      if(holder&&cleared)add("refutation",event.seq,holder,cleared,webName(graph,holder.id)+" clears "+webName(graph,cleared.id),refs[1]);
    }
    else if(event.type==="claim"&&event.data?.mode==="broken"&&refs[0])admit(refs[0],event.seq);
  }
  // Testimony is admitted only once the player has proved its way to it or cited it; links come from known facts only.
  for(const [statementId,seq] of Array.from(admitted.entries())){
    const statement=graph.statements.find(s=>s.id===statementId)!;
    for(const fact of knownFacts(statementFacts(statement))){const link=factLink(graph,fact);if(link)add("testimony",seq,link.from,link.to,link.label,statement.id);}
  }
  return Array.from(out.values()).sort((a,b)=>a.seq-b.seq||(a.id<b.id?-1:a.id>b.id?1:0));
}

/** Verdict-gated, exactly like reconstruction(): truth is shown only after a correct or wrong accusation. */
export function convergence(graph:CaseGraph,state:GameState,opts:EvidenceWebOptions={}):{culprit:string;threads:WebThread[]}|null {
  if(state.caseId!==graph.caseId||(state.verdict!=="correct"&&state.verdict!=="wrong"))return null;
  const culprit=graph.envelope.who,envelope=new Set([graph.envelope.who,graph.envelope.where,graph.envelope.what]);
  const supporting=evidenceWeb(graph,state,opts).filter(t=>t.kind!=="refutation"&&(envelope.has(t.from.id)||envelope.has(t.to.id)))
    .map(t=>t.from.id===culprit?{...t,from:t.to,to:t.from}:t);
  const ends=(t:WebThread)=>t.to.id===culprit?1:0;
  return {culprit,threads:supporting.sort((a,b)=>ends(a)-ends(b)||a.seq-b.seq||(a.id<b.id?-1:a.id>b.id?1:0))};
}
