import {CaseGraph,Vec3,RoomScan} from "../Engine/core/Types";
import {CheckedRoomCast} from "../Engine/room/HarlowRoomCast";
import {restVirtualProps} from "../Engine/room/PropSupport";
import {hashHex} from "../Engine/core/Hash";

/** Translate authored staging; the model never supplies a case graph or edits evidence/performances. */
export function mapHarlowLayout(source:CaseGraph,cast:CheckedRoomCast):CaseGraph {
 if(source.envelope.who!=="S2"||source.envelope.where!=="Z1"||source.envelope.what!=="O1")throw Error("unexpected_harlow_envelope");
 const graph=JSON.parse(JSON.stringify(source)) as CaseGraph,offsets:Record<string,Vec3>={};
 for(const zone of source.room.zones){
  const origin=zone.id==="Z5"?source.room.zones.find(z=>z.id==="Z4")!:zone;
  const target=cast.zones[origin.id];if(!target)throw Error("missing_zone_anchor");
  offsets[zone.id]=[target[0]-origin.anchor[0],target[1]-origin.anchor[1],target[2]-origin.anchor[2]];
 }
 for(const z of graph.room.zones)z.anchor=translate(z.anchor,offsets[z.id]);
 for(const o of graph.room.objects)o.pos=translate(o.pos,offsets[o.zone]);
 // Selected measured tops support the six props; furniture never becomes evidence.
 for(const id of Object.keys(cast.items)){
  const o=graph.room.objects.find(o=>o.id===id);if(!o)throw Error("missing_evidence_item");
  const top=cast.items[id],room:RoomScan={schema:1,source:"vision",roomId:cast.scanId,zones:[{id:o.zone,label:o.zone,clueName:o.zone,anchor:[top[0],0,top[2]]}],objects:[
   {id:"support",label:"scanned table",type:"container",zone:o.zone,pos:top.slice() as Vec3,origin:"vision",affordances:[]},
   {...o,virtual:true,pos:top.slice() as Vec3}
  ]};
  o.pos=restVirtualProps(room).objects.find(p=>p.id===id)!.pos;
 }
 // Carry the four unchanged decoy props on the selected tops in their zones.
 // They add no model-controlled slots; spacing uses the existing deterministic helper.
 const decoys=["O2","O3","O4","O5"],supported=JSON.parse(JSON.stringify(graph.room)) as RoomScan;
 supported.objects=supported.objects.filter(o=>decoys.includes(o.id)||!!cast.items[o.id]);
 for(const o of supported.objects)o.virtual=decoys.includes(o.id);
 for(const id of Object.keys(cast.items)){const o=graph.room.objects.find(o=>o.id===id)!;supported.objects.push({id:"support:"+id,label:"scanned table",zone:o.zone,pos:o.pos.slice() as Vec3,type:"container",origin:"vision",affordances:[]});}
 const rested=restVirtualProps(supported);for(const id of decoys)graph.room.objects.find(o=>o.id===id)!.pos=rested.objects.find(o=>o.id===id)!.pos;
 const hash=hashHex(JSON.stringify(cast));graph.room.roomId=source.room.roomId.replace(/:run10$/,"")+":mapped-"+hash+":run10";
 graph.caseId="HARLOW-1041@"+graph.room.roomId;graph.pitchHash=hashHex(source.pitchHash+hash);
 graph.roomMapping={scanId:cast.scanId,floorY:cast.floorY,zoneOffsets:offsets,castingLines:cast.lines};delete graph.solver;
 return graph;
}
export function translate(p:Vec3,delta:Vec3):Vec3{return [p[0]+delta[0],p[1]+delta[1],p[2]+delta[2]];}
