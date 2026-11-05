import {CaseGraph,Vec3} from "../Engine/core/Types";
import {EVENING_ROOM_SCAN} from "./EveningRoomScan";

/** Hand-tuned fictional Preset roles on recorded Preview surfaces, not new vision findings.
 * Surface heights are measured; lateral offsets require the main Director capture gate.
 * GLBs are bottom-origin and already imported from meters to centimeters: scale one.
 */
export const PRESET_EVENING_LAYOUT="evening-v2";
/** Median upward-facing World Query support, Nov6 view11. Saved scan remains unchanged.
 * This right-hand tabletop observation supports a hand-tuned flat Preset surface;
 * it is not a claim that every prop footprint was separately scanned.
 */
export const PRESET_CONSOLE_TOP:Vec3=[0,34.70074462890625,-462.97406005859375];
export const PRESET_EVENING_SUPPORTS:Record<string,{surfaceId:string;offset:Vec3}>={
  O1:{surfaceId:"SCAN_1",offset:[-12,0,0]},
  O2:{surfaceId:"SCAN_7",offset:[-24,0,0]},
  O3:{surfaceId:"SCAN_1",offset:[-80,0,0]},
  O4:{surfaceId:"SCAN_6",offset:[20,0,0]},
  O5:{surfaceId:"SCAN_1",offset:[95,0,0]},
  O6:{surfaceId:"SCAN_1",offset:[-45,0,0]},
  O7:{surfaceId:"SCAN_1",offset:[-30,0,0]},
  O8:{surfaceId:"SCAN_1",offset:[-145,0,0]},
  O9:{surfaceId:"SCAN_1",offset:[20,0,0]},
  O10:{surfaceId:"SCAN_4",offset:[0,0,0]},
  O11:{surfaceId:"SCAN_6",offset:[-20,0,0]},
  O12:{surfaceId:"SCAN_1",offset:[55,0,0]},
  O13:{surfaceId:"SCAN_7",offset:[24,0,0]}
};
const zonePositions:Record<string,Vec3>={
  Z1:[-12,0,-447.2526550292969], // Console: fictional Study desk.
  Z2:[-60,0,-196.03656005859375], // Sofa: fictional Lounge cover.
  Z3:[-110,0,-447.2526550292969], // Left console: fictional Hall checkpoint.
  Z4:[10.701000213623047,0,-314.01275634765625], // Table: fictional Kitchen.
  Z5:[100,0,-447.2526550292969] // Right console: fictional Conservatory.
};

/** Keep the historical factory intact. New spatial tapes identify this exact layout.
 * No fact, statement, beat, evidence, card, performance, or role assignment is changed.
 */
export function applyPresetEveningRoom(source:CaseGraph):CaseGraph {
  if(!source.caseId.startsWith("HARLOW-1041@"))throw new Error("Evening Preset placement requires HARLOW-1041");
  const graph=JSON.parse(JSON.stringify(source)) as CaseGraph;
  const suffix=":"+PRESET_EVENING_LAYOUT;
  if(!graph.room.roomId.endsWith(suffix))graph.room.roomId+=suffix;
  graph.caseId="HARLOW-1041@"+graph.room.roomId;
  for(const zone of graph.room.zones){
    const pos=zonePositions[zone.id];if(!pos)throw new Error("Unmapped Preset zone "+zone.id);
    zone.anchor=pos.slice() as Vec3;
  }
  for(const object of graph.room.objects){
    const support=PRESET_EVENING_SUPPORTS[object.id];
    const surface=support&&EVENING_ROOM_SCAN.objects.find(item=>item.id===support.surfaceId);
    if(!surface)throw new Error("Unmapped Preset support "+object.id);
    const base=support.surfaceId==="SCAN_1"?PRESET_CONSOLE_TOP:surface.pos;
    object.pos=base.map((value,axis)=>value+support.offset[axis]) as Vec3;
  }
  return graph;
}
