import {CaseGraph,Vec3} from "../core/Types";
/** A theatrical exit uses the room's doorway, or an explicit edge beyond a real zone. */
export function caseExitPosition(graph:CaseGraph):Vec3 {
  const door=graph.room.objects.find(o=>o.type==="door"),zone=door?graph.room.zones.find(z=>z.id===door.zone):graph.room.zones.slice().sort((a,b)=>b.anchor[0]-a.anchor[0]||(a.id<b.id?-1:1))[0];
  if(door)return [door.pos[0],zone?.anchor[1]||0,door.pos[2]];
  if(!zone)throw new Error("A case needs a room zone for its exit.");
  return [zone.anchor[0]+120,zone.anchor[1],zone.anchor[2]];
}
