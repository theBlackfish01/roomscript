import {CaseGraph,GameState,Vec3,ArgumentClaim} from "../core/Types";
import {knownRefs} from "./Actions";
import {endingSummary} from "./CaseClarity";

/** The player explicitly files these exact, already observed support sets. */
export function availableArguments(graph:CaseGraph,state:GameState):ArgumentClaim[] {
  const known=knownRefs(state);
  return graph.requiredDeductions.flatMap(d=>{const refs=d.supports.find(route=>route.every(id=>known.has(id)));return refs?[{deduction:d.id,refs:refs.slice()}]:[];});
}
export interface ReconstructionBeat {
  id:string;kind:"blackout"|"claims"|"correction"|"freeze"|"resume"|"ledger"|"stamp";
  time?:string;durationSeconds:number;captureHoldSeconds?:number;caption:string;factIds:string[];
  claims?:Array<{suspect:string;fact:string;zone:string}>;
  positions?:Record<string,Vec3>;deductions?:ArgumentClaim[];
}
/** Pure, verdict-gated shot list. Dust transitions imply no physical travel. */
export function reconstructionBeats(graph:CaseGraph,state:GameState):ReconstructionBeat[] {
  const frames=reconstruction(graph,state);if(!frames.length)return [];
  const freeze=frames[graph.murderSlot],truths=graph.facts.filter(f=>f.truth&&f.slot===graph.murderSlot);
  const claims=graph.cast.suspects.flatMap(s=>{const f=graph.facts.find(f=>!f.truth&&f.pred==="at"&&f.args.who===s.id&&f.slot===graph.murderSlot);return f?[{suspect:s.id,fact:f.id,zone:String(f.args.zone)}]:[]});
  const positions:Record<string,Vec3>={};
  for(const [id,pos] of Object.entries(freeze.positions))positions[id]=[pos[0]+(id===graph.cast.victim.id?30:-25),pos[1],pos[2]+(id===graph.cast.victim.id?-35:0)];
  const summary=endingSummary(graph,state);
  return [
    {id:"recon:blackout",kind:"blackout",durationSeconds:2,caption:"Seal broken. The room's record.",factIds:[]},
    {id:"recon:claims",kind:"claims",durationSeconds:3,caption:"SAID — their accounts",factIds:[],claims},
    {id:"recon:correction",kind:"correction",durationSeconds:4,caption:"PROVEN — every small lie told you where they stood.",factIds:truths.filter(f=>f.pred==="at").map(f=>f.id),positions},
    {id:"recon:freeze",kind:"freeze",durationSeconds:6,captureHoldSeconds:20,time:graph.slots[graph.murderSlot],caption:freeze.caption,factIds:truths.map(f=>f.id),positions},
    {id:"recon:resume",kind:"resume",durationSeconds:6,time:graph.bodyFound,caption:summary.filter(l=>!l.speaker).map(l=>l.text).join(" "),factIds:summary.filter(l=>!l.speaker).flatMap(l=>l.factIds)},
    {id:"recon:ledger",kind:"ledger",durationSeconds:4,caption:"What you proved",factIds:[],deductions:state.arguments.map(a=>({...a,refs:a.refs.slice()}))},
    {id:"recon:stamp",kind:"stamp",durationSeconds:4,caption:state.verdict==="correct"?"CASE CLOSED":"THE CULPRIT ESCAPED",factIds:[]}
  ];
}
export interface ReconstructionFrame {slot:string;positions:Record<string,Vec3>;murder:boolean;caption:string;}
/** Sealed facts become visible only after a final engine verdict, never at timeout alone. */
export function reconstruction(graph:CaseGraph,state:GameState):ReconstructionFrame[] {
  if(state.verdict!=="correct"&&state.verdict!=="wrong")return [];
  return graph.slots.map((slot,index)=>{
    const prior:Record<string,Vec3>={};
    for(const person of [...graph.cast.suspects,graph.cast.victim]){
      const fact=graph.facts.find(f=>f.truth&&f.pred==="at"&&f.args.who===person.id&&(f.slot===index||!!f.slotRange&&f.slotRange[0]<=index&&f.slotRange[1]>=index));
      const zone=fact&&graph.room.zones.find(z=>z.id===fact.args.zone);if(zone)prior[person.id]=[zone.anchor[0],0,zone.anchor[2]+55];
    }
    const murder=index===graph.murderSlot;
    return {slot,positions:JSON.parse(JSON.stringify(prior)) as Record<string,Vec3>,murder,caption:murder?
      graph.cast.suspects.find(s=>s.id===graph.envelope.who)!.name+" killed "+graph.cast.victim.name+" in the "+graph.room.zones.find(z=>z.id===graph.envelope.where)!.clueName+" with the "+graph.room.objects.find(o=>o.id===graph.envelope.what)!.label+".":"The room at "+slot};
  });
}
