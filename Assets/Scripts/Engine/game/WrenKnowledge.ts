import {CaseGraph,PlayerKnowledge} from "../core/Types";
import {hashHex} from "../core/Hash";

export interface WrenOption {id:string;kind:"guidance"|"fact"|"account"|"summary";text:string;factIds:string[];statementIds:string[];}
export interface KnowledgeBrief {options:WrenOption[];factCount:number;accountCount:number;}
/** The provider receives this DTO, never CaseGraph, envelope, future facts or suspect secrets.
 * Heard accounts remain explicitly attributed claims; we do not expose their hidden truth flag.
 */
export function buildKnowledgeBrief(graph:CaseGraph,knowledge:PlayerKnowledge):KnowledgeBrief {
  const admitted=new Set(knowledge.factIds),heard=new Set(knowledge.statementIds);
  const facts=graph.facts.concat(...graph.beats.flatMap(b=>b.addsFacts||[]))
    .filter((f,index,all)=>admitted.has(f.id)&&!!f.canonical&&all.findIndex(a=>a.id===f.id)===index)
    .sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const factOptions:WrenOption[]=facts.map(f=>({id:"fact:"+f.id,kind:"fact",text:f.canonical!,factIds:[f.id],statementIds:[]}));
  const accounts:WrenOption[]=graph.statements.filter(s=>heard.has(s.id)).map(s=>({id:"account:"+s.id,kind:"account",
    text:(graph.cast.suspects.find(p=>p.id===s.speaker)?.name||"A guest")+" said: "+s.canonical,
    factIds:[],statementIds:[s.id]}));
  const summary=factOptions.slice(-3);
  const options:WrenOption[]=[{id:"guide:compare",kind:"guidance",text:"Which object could check the account you just heard?",factIds:[],statementIds:[]},
    {id:"guide:unknown",kind:"guidance",text:"We have not proved that yet. What could we check?",factIds:[],statementIds:[]},
    {id:"summary:"+hashHex(summary.map(f=>f.id).join("|")),kind:"summary",
      text:summary.length?"What we have proved: "+summary.map(f=>f.text).join(" "):"We have no certified evidence yet. What would you like to inspect?",
      factIds:summary.flatMap(f=>f.factIds),statementIds:[]},...factOptions,...accounts];
  return {options,factCount:factOptions.length,accountCount:accounts.length};
}

/** A live model selects one ID only. Its prose and any additional keys are rejected. */
export function admitWrenChoice(brief:KnowledgeBrief,value:unknown):WrenOption|undefined {
  if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).join(",")!=="optionId")return undefined;
  const id=(value as {optionId:unknown}).optionId;
  const option=typeof id==="string"?brief.options.find(o=>o.id===id):undefined;
  return option?{...option,factIds:option.factIds.slice(),statementIds:option.statementIds.slice()}:undefined;
}

/** Deterministic, offline conversational floor; it cannot infer hidden facts. */
export function answerWren(brief:KnowledgeBrief,question:string):WrenOption {
  const words=question.toLowerCase().match(/[a-z0-9]+/g)||[];
  if(!words.length||/\b(know|summary|recap|learned|proved)\b/i.test(question))return brief.options.find(o=>o.kind==="summary")!;
  if(/\b(next|hint|help|stuck)\b/i.test(question))return brief.options[0];
  const ignored=new Set(["what","when","where","who","why","how","the","was","did","does","about","have","with","that","this","tell","me","we","you","is","a","an","i"]);
  const important=words.filter(w=>!ignored.has(w));
  let best:WrenOption|undefined,score=0;
  for(const option of brief.options.filter(o=>o.kind==="fact"||o.kind==="account")) {
    const terms=new Set(option.text.toLowerCase().match(/[a-z0-9]+/g)||[]);
    const match=important.filter(w=>terms.has(w)).length;
    if(match>score){best=option;score=match;}
  }
  return best||brief.options[1];
}
