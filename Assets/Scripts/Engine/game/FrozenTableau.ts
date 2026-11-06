import {CaseGraph,GameState,ObjectType,Vec3} from "../core/Types";
import {reconstructionBeats} from "./Closing";

export interface Tableau {
  slot:string;zone:string;
  figures:{suspect:string;pose:string;position:[number,number,number];holding?:string}[];
  suspended:{object:string;position:[number,number,number];note:string}[];
}
/** Height above the object's resting surface at which a disturbed object hangs in the freeze (cm). */
export const TABLEAU_LIFT_CM=18;
const WEAPON_POSES:Partial<Record<ObjectType,string>>={cord:"strangling",blunt:"striking",heavy:"striking",sharp:"stabbing",poison:"pouring"};

/** The murder-slot freeze, read from the engine's verdict-gated reconstruction. Null before a correct or wrong verdict. */
export function frozenTableau(graph:CaseGraph,state:GameState):Tableau|null {
  if(state.caseId!==graph.caseId)return null;
  const freeze=reconstructionBeats(graph,state).find(b=>b.kind==="freeze");
  if(!freeze||!freeze.positions)return null;
  const {who,where,what}=graph.envelope,victim=graph.cast.victim.id;
  const weapon=graph.room.objects.find(o=>o.id===what);
  const order=[who,victim,...graph.cast.suspects.map(s=>s.id).filter(id=>id!==who)];
  const figures:Tableau["figures"]=order.filter(id=>!!freeze.positions![id]).map(id=>{
    const position=freeze.positions![id].slice() as [number,number,number];
    if(id===who)return {suspect:id,pose:(weapon&&WEAPON_POSES[weapon.type])||"attacking",position,holding:what};
    return {suspect:id,pose:id===victim?"victim":"standing",position};
  });
  // Objects the victim disturbed at the murder slot, per sealed true facts in the murder zone (the weapon is held, not suspended).
  const suspended:Tableau["suspended"]=[];
  for(const fact of graph.facts){
    if(!fact.truth||fact.slot!==graph.murderSlot||fact.args.who!==victim||!fact.canonical)continue;
    for(const id of fact.entities||[]){
      const object=graph.room.objects.find(o=>o.id===id);
      if(!object||object.id===what||object.zone!==where||suspended.some(s=>s.object===id))continue;
      const pos=object.pos as Vec3;
      suspended.push({object:id,position:[pos[0],pos[1]+TABLEAU_LIFT_CM,pos[2]],note:fact.canonical});
    }
  }
  return {slot:graph.slots[graph.murderSlot],zone:where,figures,suspended};
}
