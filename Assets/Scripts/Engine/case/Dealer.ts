import {Evidence,Fact,Id} from "../core/Types";
import {Prng} from "../core/Prng";
import {Simulation} from "./Simulator";
export function evidenceForFact(fact:Id,index:number):Id {return "E_"+fact+"_"+index;}
/** Each observation records one proposition; its two copies come from distinct physical witnesses. */
export function dealEvidence(sim:Simulation):void {
  const g=sim.graph;const rng=new Prng(g.seed,"dealer");
  for(const id of sim.observedFacts) {
    const f=g.facts.find(f=>f.id===id)!;
    let zone=typeof f.args.zone==="string"?f.args.zone:undefined;
    const subject=typeof f.args.who==="string"?f.args.who:typeof f.args.obj==="string"?f.args.obj:undefined;
    if(!zone&&subject)zone=sim.timeline.find(e=>e.actor===subject&&e.slot===(f.slot??g.murderSlot))?.zone;
    const holders=sim.witnesses[zone||g.envelope.where];
    const chosen=rng.fork(f.id).shuffle(holders).slice(0,2);
    chosen.forEach((holder,i)=>{
      const e:Evidence={id:evidenceForFact(f.id,i),holder,kind:"object_memory",proves:[f.id],canonical:f.canonical||f.id,entities:f.entities?.slice()||[],costMinutes:0};
      g.evidence.push(e);g.witnessing.push({witness:holder,fact:f.id,channel:"record"});
    });
  }
  const cards:Record<string,{eliminates:Id;via:Id}[]>={};
  const add=(holder:Id,eliminates:Id,fact:Fact)=>{(cards[holder]||(cards[holder]=[])).push({eliminates,via:fact.id});};
  for(const evidence of g.evidence) {
    const f=g.facts.find(f=>f.id===evidence.proves[0])!;
    if(f.pred==="at"&&f.args.who!=="V"&&f.args.who!==g.envelope.who&&f.slot===g.murderSlot)add(evidence.holder,String(f.args.who),f);
    if(f.pred==="at"&&f.args.who==="V"&&f.slot===g.murderSlot)for(const zone of g.room.zones.filter(z=>z.id!==g.envelope.where))add(evidence.holder,zone.id,f);
    if(f.pred==="in"&&f.args.obj!==g.envelope.what&&f.slot===g.murderSlot)add(evidence.holder,String(f.args.obj),f);
  }
  g.refutation={order:rng.fork("clockwise").shuffle(Object.keys(cards)),cards};
}
