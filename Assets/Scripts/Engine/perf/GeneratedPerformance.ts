import {AnswerMode,CaseGraph,LineBankEntry,RegisterEntry,VariantEntry} from "../core/Types";
import {performanceRef} from "./ReferenceIds";
import {hashHex} from "../core/Hash";

export interface PhraseSegment {id:string;speaker:string;text:string;}
export interface PhrasePlan {speaker:string;text:string;segments:PhraseSegment[];}
const neutral={deflect:"Ask me something more specific.",filler:"Give me a moment to collect myself.",lawyered:"I have answered enough. Give me some space."};

/** Exact compiler-authored statements only. No model writes this bank. */
export function generatedLineBank(graph:CaseGraph):LineBankEntry[] {
  const bank:LineBankEntry[]=[];
  for(const statement of graph.statements) {
    for(const mode of ["answer","broken",...(statement.pressed?["press"]:[])] as AnswerMode[]) {
      const pressed=mode==="press";
      bank.push({suspect:statement.speaker,topic:statement.topic,layer:statement.layer,mode,answer:{topic:statement.topic,
        cites:[performanceRef(pressed?"p":"a",statement.id)],line:pressed?statement.pressed!.canonical:statement.canonical,
        emotion:mode==="broken"?"rattled":pressed?"irritated":"guarded"}});
    }
  }
  for(const suspect of graph.cast.suspects)for(const mode of ["deflect","filler","lawyered"] as const)
    bank.push({suspect:suspect.id,topic:"unclear",layer:0,mode,answer:{topic:"unclear",cites:["none"],line:neutral[mode],emotion:"guarded"}});
  return bank;
}

/** Gives the live director closed, already admitted choices for a generated case. */
export function generatedPerformances(graph:CaseGraph):{variants:VariantEntry[];register:RegisterEntry[]} {
  const bank=generatedLineBank(graph);
  return {variants:bank.filter(e=>e.answer.cites[0]!=="none").map(e=>({id:"generated:"+hashHex(e.suspect+"|"+e.answer.cites[0]+"|"+e.mode),
    suspect:e.suspect,ref:e.answer.cites[0],mode:e.mode,text:e.answer.line,emotion:e.answer.emotion})),
    register:graph.cast.suspects.flatMap(s=>[{id:s.id+":opener",suspect:s.id,kind:"opener" as const,text:"Well, detective."},
      {id:s.id+":tail",suspect:s.id,kind:"tail" as const,text:"Write that down."}])};
}

/** Reusable phrase pieces retain exact text, including whitespace/punctuation.
 * Playback must join every piece or fall back to captions; never drop missing words.
 */
export function phrasePlan(graph:CaseGraph,speaker:string,text:string):PhrasePlan {
  const terms=Array.from(new Set([...graph.room.zones.map(z=>z.clueName),...graph.room.objects.map(o=>o.label),
    ...graph.cast.suspects.map(s=>s.name),graph.cast.victim.name,...graph.slots]))
    .filter(Boolean).sort((a,b)=>b.length-a.length||(a<b?-1:1));
  const pieces:string[]=[];let buffer="";
  for(let i=0;i<text.length;) {
    const term=terms.find(t=>text.slice(i,i+t.length)===t&&(!i||!/[A-Za-z0-9]/.test(text[i-1]))&&(!text[i+t.length]||!/[A-Za-z0-9]/.test(text[i+t.length])));
    if(term){if(buffer)pieces.push(buffer);buffer="";pieces.push(term);i+=term.length;}
    else {buffer+=text[i++];if(/[.!?]/.test(buffer.slice(-1))){pieces.push(buffer);buffer="";}}
  }
  if(buffer)pieces.push(buffer);
  return {speaker,text,segments:pieces.map(text=>({id:"phrase:"+speaker+":"+hashHex(text),speaker,text}))};
}

export function generatedPhrasePlans(graph:CaseGraph):PhrasePlan[] {
  const seen=new Set<string>();return generatedLineBank(graph).filter(row=>{
    const key=row.suspect+"|"+row.answer.line;if(seen.has(key))return false;seen.add(key);return true;
  }).map(row=>phrasePlan(graph,row.suspect,row.answer.line));
}
