import {CaseGraph,Id,ObjectType} from "../core/Types";

/** Surfaces that hold prints, best first. */
export const DUSTABLE_TYPES:readonly ObjectType[]=["cup","screen","blunt"];

/** Up to two room objects to offer the dusting gesture. Chosen by object type and non-latent evidence only,
 * never by who the evidence names, so it carries no information about the solution. */
export function dustableObjects(graph:CaseGraph):string[] {
  const hasEvidence=(id:Id)=>graph.evidence.some(e=>e.holder===id&&!e.latent);
  return graph.room.objects.map((object,index)=>({object,index,rank:DUSTABLE_TYPES.indexOf(object.type)}))
    .filter(item=>item.rank>=0&&hasEvidence(item.object.id))
    .sort((a,b)=>a.rank-b.rank||a.index-b.index).slice(0,2).map(item=>item.object.id);
}
/** Dusting is only another gesture for the same engine action as pinching the object. */
export function dustingAction(graph:CaseGraph,objectId:Id):{type:"PinchObject";object:string}|null {
  return dustableObjects(graph).includes(objectId)?{type:"PinchObject",object:objectId}:null;
}
