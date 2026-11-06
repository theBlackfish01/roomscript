import {CaseGraph,Evidence,Fact,GameState,Id} from "../core/Types";

export interface ReplayVignette {
  object:string;slot:string;title:string;
  /** suspect is a suspect id or the victim id; null + "absent" means this memory records no person, not that the zone was empty. */
  figures:{suspect:string|null;pose:"standing"|"absent";zone:string}[];
  props:{object:string;state:string}[];
  caption:string;evidence:string;
}

/** Slot label used when the collected memory carries no time. */
export const REPLAY_UNTIMED="earlier";

/** Collected memories of one object, in graph order. Never includes evidence the player has not collected. */
export function collectedObjectEvidence(graph:CaseGraph,state:GameState,objectId:Id):Evidence[] {
  return graph.evidence.filter(e=>e.holder===objectId&&state.knowledge.evidenceIds.includes(e.id));
}

export interface ObjectReplayOptions {
  /** Play this collected memory instead of the default (the murder-time memory, else the first timed, else the first). */
  evidence?:Id;
  /** Also stage other collected memories of this object from the same time slot. Default: the chosen memory only. */
  merge?:boolean;
}
/** A short "what this object saw" vignette, built only from that object's collected evidence and the facts it proves. */
export function objectReplay(graph:CaseGraph,state:GameState,objectId:Id,opts:ObjectReplayOptions={}):ReplayVignette|null {
  const evidenceId=opts.evidence;
  if(state.caseId!==graph.caseId)return null;
  const object=graph.room.objects.find(o=>o.id===objectId);if(!object)return null;
  const collected=collectedObjectEvidence(graph,state,objectId);if(!collected.length)return null;
  const factsOf=(e:Evidence)=>e.proves.filter(id=>state.knowledge.factIds.includes(id)).map(id=>graph.facts.find(f=>f.id===id&&f.truth)).filter((f):f is Fact=>!!f);
  const slotsOf=(e:Evidence)=>factsOf(e).map(f=>f.slot).filter((s):s is number=>s!==undefined);
  let primary:Evidence|undefined;
  if(evidenceId){primary=collected.find(e=>e.id===evidenceId);if(!primary)return null;}
  else primary=collected.find(e=>slotsOf(e).includes(graph.murderSlot))||collected.find(e=>slotsOf(e).length>0)||collected[0];
  const primarySlots=slotsOf(primary);
  const slot=primarySlots.includes(graph.murderSlot)?graph.murderSlot:primarySlots.length?Math.min(...primarySlots):undefined;
  // With merge, same-time memories of this object join the scene; untimed memories always stand alone.
  const scene=slot===undefined||!opts.merge?[primary]:collected.filter(e=>e===primary||slotsOf(e).includes(slot));
  const facts=scene.flatMap(e=>factsOf(e)).filter(f=>slot===undefined||f.slot===slot||f.slot===undefined);
  const figures:ReplayVignette["figures"]=[],props:ReplayVignette["props"]=[];
  const person=(id:unknown)=>typeof id==="string"&&(id===graph.cast.victim.id||graph.cast.suspects.some(s=>s.id===id));
  for(const fact of facts){
    const who=fact.args.who;
    if(fact.pred==="at"&&person(who)&&graph.room.zones.some(z=>z.id===fact.args.zone)){
      if(!figures.some(f=>f.suspect===who))figures.push({suspect:String(who),pose:"standing",zone:String(fact.args.zone)});
    }
    if(fact.pred==="touched"&&person(who)&&typeof fact.args.obj==="string"){
      // A handled object places the person at that object only if a known fact puts them in its zone at that time.
      const held=graph.room.objects.find(o=>o.id===fact.args.obj);
      const placed=held&&graph.facts.some(f=>f.truth&&f.pred==="at"&&f.args.who===who&&f.args.zone===held.zone&&f.slot===fact.slot&&state.knowledge.factIds.includes(f.id));
      if(placed&&!figures.some(f=>f.suspect===who))figures.push({suspect:String(who),pose:"standing",zone:held!.zone});
      if(held&&!props.some(p=>p.object===held.id))props.push({object:held.id,state:"handled"});
    }
    if(fact.pred==="state"&&typeof fact.args.obj==="string"&&graph.room.objects.some(o=>o.id===fact.args.obj)&&!props.some(p=>p.object===fact.args.obj))
      props.push({object:String(fact.args.obj),state:String(fact.args.value)});
  }
  if(!figures.length)figures.push({suspect:null,pose:"absent",zone:object.zone});
  if(!props.some(p=>p.object===objectId))props.unshift({object:objectId,state:"witness"});
  const time=slot===undefined?REPLAY_UNTIMED:graph.slots[slot];
  return {object:objectId,slot:time,title:"What the "+object.label+" saw",figures,props,caption:primary.canonical,evidence:primary.id};
}

/** One vignette per collected memory of the object, in graph order (for sequential playback). */
export function objectReplays(graph:CaseGraph,state:GameState,objectId:Id):ReplayVignette[] {
  return collectedObjectEvidence(graph,state,objectId).map(e=>objectReplay(graph,state,objectId,{evidence:e.id})).filter((v):v is ReplayVignette=>!!v);
}
