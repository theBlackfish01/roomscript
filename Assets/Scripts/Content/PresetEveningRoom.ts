import {CaseGraph,Vec3} from "../Engine/core/Types";
import {EVENING_ROOM_SCAN} from "./EveningRoomScan";

/** v2 (historical): hand-tuned fictional Preset roles on recorded Preview surfaces, not new vision findings.
 * Surface heights are measured; lateral offsets require the main Director capture gate.
 * GLBs are bottom-origin and already imported from meters to centimeters: scale one.
 */
export type PresetEveningLayout="evening-v2"|"evening-v3";
/** Current Preset layout. Historical v2 tapes build their graph with {layout:"evening-v2"}. */
export const PRESET_EVENING_LAYOUT:PresetEveningLayout="evening-v3";
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

/** Run 8 survey of the real Evening Room, floor-local cm (world x,z; floor y=-176). */
export const PRESET_DOOR_LATCH:Vec3=[-268,106,-395]; // recessed door, left wall x=-271
export const PRESET_WINDOW_POINT:Vec3=[200,120,-240]; // curtained window, right wall x~205
export const PRESET_TABLE={centre:[11,-314] as [number,number],radius:60,topY:31.3};
export const PRESET_SOFA={x0:-175,x1:125,z0:-200,z1:-125,seatY:30.6};
export const PRESET_CONSOLE={x0:-175,x1:175,z0:-479,z1:-447,topY:PRESET_CONSOLE_TOP[1]};
/** Console-top items that props must clear (record player, speakers), floor-local x,z. */
export const PRESET_CONSOLE_FIXTURES:{label:string;x:number;z:number;radius:number}[]=[
  {label:"record player",x:-98,z:-457,radius:20},{label:"left speaker",x:-163,z:-470,radius:13},{label:"right speaker",x:120,z:-470,radius:13}
];
export type PresetSupport="console"|"table"|"sofa"|"door"|"window";
const C=PRESET_CONSOLE_TOP[1],CZ=PRESET_CONSOLE_TOP[2];
/** v3: every role on a real surface by its fictional zone. Zones: Study=console centre, Lounge=sofa,
 * Hall=by the door, Kitchen=coffee table, Conservatory=by the window. */
export const PRESET_EVENING_V3:{zones:Record<string,Vec3>;objects:Record<string,{support:PresetSupport;pos:Vec3}>}={
  zones:{Z1:[0,0,-440],Z2:[-25,0,-162],Z3:[-215,0,-395],Z4:[11,0,-314],Z5:[160,0,-260]},
  objects:{
    O1:{support:"console",pos:[-12,C,CZ]},          // Study: charger cable, console centre
    O6:{support:"console",pos:[-50,C,CZ]},          // Study: desk lamp
    O9:{support:"console",pos:[22,C,CZ]},           // Study: chipped mug
    O12:{support:"console",pos:[58,C,CZ]},          // Study: dictation recorder
    O2:{support:"sofa",pos:[-70,PRESET_SOFA.seatY,-172]}, // Lounge: candlestick on the seat
    O13:{support:"sofa",pos:[20,PRESET_SOFA.seatY,-172]}, // Lounge: cover
    O3:{support:"console",pos:[-160,C,-451]},       // Hall: letter knife, console left end, in front of the speaker
    O7:{support:"console",pos:[-134,C,CZ]},         // Hall: clock, between speaker and record player
    O8:{support:"door",pos:PRESET_DOOR_LATCH.slice() as Vec3}, // Hall: on the real door
    O4:{support:"table",pos:[31,PRESET_TABLE.topY,-314]}, // Kitchen: medicine bottle
    O11:{support:"table",pos:[-9,PRESET_TABLE.topY,-314]}, // Kitchen: kettle
    O5:{support:"console",pos:[155,C,CZ]},          // Conservatory: bookend, console right end by the window wall
    O10:{support:"window",pos:PRESET_WINDOW_POINT.slice() as Vec3} // Conservatory: on the real window
  }
};

/** Keep the historical factory intact. New spatial tapes identify this exact layout.
 * No fact, statement, beat, evidence, card, performance, or role assignment is changed.
 */
export function applyPresetEveningRoom(source:CaseGraph,opts:{layout?:PresetEveningLayout}={}):CaseGraph {
  if(!source.caseId.startsWith("HARLOW-1041@"))throw new Error("Evening Preset placement requires HARLOW-1041");
  const layout=opts.layout||PRESET_EVENING_LAYOUT;
  const graph=JSON.parse(JSON.stringify(source)) as CaseGraph;
  graph.room.roomId=graph.room.roomId.replace(/:evening-v\d+$/,"")+":"+layout;
  graph.caseId="HARLOW-1041@"+graph.room.roomId;
  for(const zone of graph.room.zones){
    const pos=layout==="evening-v3"?PRESET_EVENING_V3.zones[zone.id]:zonePositions[zone.id];if(!pos)throw new Error("Unmapped Preset zone "+zone.id);
    zone.anchor=pos.slice() as Vec3;
  }
  for(const object of graph.room.objects){
    if(layout==="evening-v3"){
      const placed=PRESET_EVENING_V3.objects[object.id];if(!placed)throw new Error("Unmapped Preset support "+object.id);
      object.pos=placed.pos.slice() as Vec3;continue;
    }
    const support=PRESET_EVENING_SUPPORTS[object.id];
    const surface=support&&EVENING_ROOM_SCAN.objects.find(item=>item.id===support.surfaceId);
    if(!surface)throw new Error("Unmapped Preset support "+object.id);
    const base=support.surfaceId==="SCAN_1"?PRESET_CONSOLE_TOP:surface.pos;
    object.pos=base.map((value,axis)=>value+support.offset[axis]) as Vec3;
  }
  return graph;
}
