import {CaseGraph,Vec3} from "../Engine/core/Types";
import {translate} from "./HarlowRoomLayout";
/** Run 8 presentation: where each zone's chalk circle is drawn on the real floor.
 * Preset spots sit on measured free floor next to the zone's furniture (Nov 6 heightmap), so chalk
 * never shows through a table or sofa on an additive display. The Kitchen ring circles the coffee table.
 * Dynamic zones use their scanned anchor. Floor-local cm; presentation only, never testimony.
 */
export interface ChalkSpot {center:Vec3;radius:number;}
export const PRESET_CHALK_SPOTS:Record<string,ChalkSpot>={
  Study:{center:[20,0,-398],radius:26},        // floor in front of the console
  Hall:{center:[-215,0,-398],radius:32},       // floor by the real door
  Conservatory:{center:[178,0,-325],radius:26}, // floor by the window, clear of the woven chair
  Kitchen:{center:[11,0,-314],radius:74},      // ring around the coffee table
  Lounge:{center:[-40,0,-92],radius:28}         // floor behind the sofa
};
export function chalkSpot(graph:CaseGraph,zoneId:string,mode:"preset"|"dynamic"):ChalkSpot {
  const zone=graph.room.zones.find(z=>z.id===zoneId);if(!zone)throw new Error("Unknown zone "+zoneId);
  const authored=mode==="preset"&&graph.caseId.startsWith("HARLOW-1041@")?PRESET_CHALK_SPOTS[zone.clueName]:undefined;
  return authored?{center:graph.roomMapping?translate(authored.center,graph.roomMapping.zoneOffsets[zoneId]):authored.center.slice() as Vec3,radius:authored.radius}:{center:[zone.anchor[0],0,zone.anchor[2]],radius:32};
}
