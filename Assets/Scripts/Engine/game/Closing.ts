import {CaseGraph,GameState,Vec3,ArgumentClaim} from "../core/Types";
import {knownRefs} from "./Actions";

/** The player explicitly files these exact, already observed support sets. */
export function availableArguments(graph:CaseGraph,state:GameState):ArgumentClaim[] {
  const known=knownRefs(state);
  return graph.requiredDeductions.flatMap(d=>{const refs=d.supports.find(route=>route.every(id=>known.has(id)));return refs?[{deduction:d.id,refs:refs.slice()}]:[];});
}
export interface ReconstructionFrame {slot:string;positions:Record<string,Vec3>;murder:boolean;caption:string;}
/** Sealed facts become visible only after a final engine verdict, never at timeout alone. */
export function reconstruction(graph:CaseGraph,state:GameState):ReconstructionFrame[] {
  if(state.verdict!=="correct"&&state.verdict!=="wrong")return [];
  const prior:Record<string,Vec3>={};
  return graph.slots.map((slot,index)=>{
    for(const person of [...graph.cast.suspects,graph.cast.victim]){
      const fact=graph.facts.find(f=>f.truth&&f.pred==="at"&&f.args.who===person.id&&(f.slot===index||!!f.slotRange&&f.slotRange[0]<=index&&f.slotRange[1]>=index));
      const zone=fact&&graph.room.zones.find(z=>z.id===fact.args.zone);if(zone)prior[person.id]=[zone.anchor[0],0,zone.anchor[2]+55];
    }
    const murder=index===graph.murderSlot;
    return {slot,positions:JSON.parse(JSON.stringify(prior)) as Record<string,Vec3>,murder,caption:murder?
      graph.cast.suspects.find(s=>s.id===graph.envelope.who)!.name+" killed "+graph.cast.victim.name+" in the "+graph.room.zones.find(z=>z.id===graph.envelope.where)!.clueName+" with the "+graph.room.objects.find(o=>o.id===graph.envelope.what)!.label+".":"The room at "+slot};
  });
}
