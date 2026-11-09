import {CaseGraph,Vec3} from "../Engine/core/Types";
import {refuterMarks} from "../Engine/game/CluePresentation";
import {translate} from "./HarlowRoomLayout";

/** Actor artwork is staging, not testimony. The case's zone/clockwise marks stay intact.
 * Only the current recorded Preview layout uses these marks; historical tapes and
 * Dynamic layouts keep their original marks. Coordinates are floor-local cm.
 *
 * Run 8 (WEARER_UX "Housekeeping"): every suspect stands on free floor measured by the
 * Nov 6 World Query heightmap of the Evening Room, never on the sofa, table, crate or chair.
 * Left lane: x -225..-110, z -225..-420. Right pocket: x 60..170, z -180..-330.
 */
export const PRESET_FREE_FLOOR_MARKS:Record<string,Vec3>={
  S2:[-140,0,-340], // Vale: left of the coffee table, first conversation.
  S3:[-215,0,-250], // Okafor: left lane, clear of the sofa end.
  S1:[120,0,-270], // Qadir: right pocket, clear of the table and woven chair.
  S4:[165,0,-185]  // Pike: right, by the window.
};
/** Where the player stands to talk: about 1.4 m from each suspect, on measured free floor
 * (the straight line from the Preview start would cross the sofa for Qadir and Okafor). */
export const CONVERSATION_DISTANCE_CM=140;
export const PRESET_CONVERSATION_SPOTS:Record<string,Vec3>={
  S2:[-200,0,-210], // left lane, beside the sofa end
  S3:[-215,0,-110], // behind the sofa, left
  S1:[180,0,-150],  // right lane, in front of the window plant
  S4:[60,0,-90]     // behind the sofa, right
};
export function conversationSpot(id:string):Vec3 {return (PRESET_CONVERSATION_SPOTS[id]||[0,0,-40]).slice() as Vec3;}
export function actorPresentationMarks(graph:CaseGraph,mode:"preset"|"dynamic"):Record<string,Vec3> {
  const marks=refuterMarks(graph);
  if(graph.roomMapping){
    // Presentation homes are the nearest authored floor zones, not claims of an alibi.
    const homes:Record<string,string>={S1:"Z5",S2:"Z3",S3:"Z3",S4:"Z5"};
    for(const id of Object.keys(PRESET_FREE_FLOOR_MARKS))marks[id]=translate(PRESET_FREE_FLOOR_MARKS[id],graph.roomMapping.zoneOffsets[homes[id]]);
    return marks;
  }
  if(mode==="preset"&&graph.caseId.startsWith("HARLOW-1041@")&&/:evening-v[23](?::run10)?$/.test(graph.room.roomId))
    for(const id of Object.keys(PRESET_FREE_FLOOR_MARKS))if(marks[id])marks[id]=PRESET_FREE_FLOOR_MARKS[id].slice() as Vec3;
  return marks;
}
