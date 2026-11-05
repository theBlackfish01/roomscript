import {CaseGraph,Vec3} from "../Engine/core/Types";
import {refuterMarks} from "../Engine/game/CluePresentation";

/** Actor artwork is staging, not testimony. The case's zone/clockwise marks stay intact.
 * Only the current recorded Preview layout uses this offset; historical tapes and
 * Dynamic layouts keep their original marks. Coordinates are floor-local cm.
 */
export function actorPresentationMarks(graph:CaseGraph,mode:"preset"|"dynamic"):Record<string,Vec3> {
  const marks=refuterMarks(graph);
  if(mode==="preset"&&graph.caseId.startsWith("HARLOW-1041@")&&graph.room.roomId.endsWith(":evening-v2")&&marks.S2)
    marks.S2=[100,0,-230];
  return marks;
}
