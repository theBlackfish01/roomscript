import {CaseGraph,PlayerKnowledge} from "../core/Types";
import {solvePlayerKnowledge} from "../case/Solver";
export type PartnerTrigger="opening"|"first-tell"|"first-objection"|"letter"|"voicemail"|"flight"|"blackout"|"idle"|"seal";
export interface PartnerLine {id:string;text:string;factIds:string[];}
/** Truth-blind partner: future facts, secret labels and the envelope are never read. */
export function partnerLine(graph:CaseGraph,knowledge:PlayerKnowledge,trigger:PartnerTrigger):PartnerLine {
  const common:Record<PartnerTrigger,string>={opening:"Four guests. Ask, listen, and compare their words with the room.","first-tell":"Notice that movement. It is a reason to check the account, not a verdict.","first-objection":"The evidence changed the account. Keep the old slip beside the proof.",letter:"A letter. Read it before you decide what it means.",voicemail:"Listen to the order of the voices.",flight:"Nobody leaves before we finish.",blackout:"Follow the trace. Keep to what it actually proves.",idle:"Choose a suspect or inspect an object. The notebook keeps what you learn.",seal:"Check who, where, and with what before you break the seal."};
  if(trigger==="seal"){
    const result=solvePlayerKnowledge(graph,knowledge);
    if(result.hypotheses.length===1){const h=result.hypotheses[0];return {id:"wren:seal:proven",text:"Your evidence leaves one possibility: "+graph.cast.suspects.find(s=>s.id===h.who)!.name+", "+graph.room.zones.find(z=>z.id===h.where)!.clueName+", "+graph.room.objects.find(o=>o.id===h.what)!.label+". Check your deductions.",factIds:knowledge.factIds.slice()};}
  }
  return {id:"wren:"+trigger,text:common[trigger],factIds:[]};
}
