import {CaseGraph,GameState,PlayerKnowledge,Id} from "../core/Types";
import {statementFacts} from "./Actions";
export interface CitedSentence {text:string;factIds:Id[];speaker?:Id;}
export function openingCaseCard(graph:CaseGraph):{victim:string;foundAt:string;guests:string[];question:string;text:string} {
  const victim=graph.cast.victim.name,foundAt=graph.bodyFound,guests=graph.cast.suspects.map(s=>s.name);
  const question="Who killed "+victim.split(" ").slice(-1)[0]+", where, and with what?";
  return {victim,foundAt,guests,question,text:victim+" was found dead at "+foundAt+". Four guests remain. "+question};
}
/** The public record only: never uses the envelope or unobserved future evidence. */
export function knowledgeTimeline(graph:CaseGraph,knowledge:PlayerKnowledge):Array<CitedSentence&{time:string}> {
  return graph.facts.filter(f=>f.truth&&knowledge.factIds.includes(f.id)&&f.canonical&&f.slot!==undefined)
    .sort((a,b)=>a.slot!-b.slot!||(a.id<b.id?-1:1)).map(f=>({time:graph.slots[f.slot!],text:f.canonical!,factIds:[f.id]}));
}
export function accountSlips(graph:CaseGraph,state:GameState):Array<{statement:Id;speaker:Id;said:string;proven:string;factIds:Id[];crossedOut:boolean}> {
  return state.notebook.map(note=>{
    const event=state.events.find(e=>e.type==="objectionCorrect"&&e.refs?.[0]===note.statement);
    const refs=event?.refs?.slice(2)||[];
    const proved=refs.flatMap(ref=>graph.evidence.find(e=>e.id===ref)?.proves||statementFacts(graph.statements.find(s=>s.id===ref)||{asserts:[]} as any));
    const factIds=proved.filter((id,i)=>proved.indexOf(id)===i&&state.knowledge.factIds.includes(id)&&graph.facts.some(f=>f.id===id&&f.truth));
    return {statement:note.statement,speaker:note.speaker,said:"SAID: "+note.canonical,proven:factIds.length?"PROVEN: "+factIds.map(id=>graph.facts.find(f=>f.id===id)!.canonical).join(" "):"Not yet proved",factIds,crossedOut:note.broken};
  });
}
/** Ending text is the cited canonical fact itself, avoiding a second unverified story. */
export function endingSummary(graph:CaseGraph,state:GameState):CitedSentence[] {
  if(state.verdict!=="correct"&&state.verdict!=="wrong")return [];
  const sentence=(id:Id,speaker?:Id):CitedSentence[]=>{const f=graph.facts.find(f=>f.id===id&&f.truth);return f?.canonical?[{text:f.canonical,factIds:[id],...(speaker?{speaker}:{})}]:[]};
  return (graph.story?.spine||[]).flatMap(id=>sentence(id)).concat(Object.keys(graph.story?.secrets||{}).flatMap(suspect=>graph.story!.secrets[suspect].flatMap(id=>sentence(id,suspect))));
}
