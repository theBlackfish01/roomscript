import {Vec3} from "../Engine/core/Types";
import {EVENING_ROOM_SCAN,EVENING_ROOM_FLOOR_Y} from "./EveningRoomScan";
export interface CrateSurfaceLayout {
  surfaceWorld:Vec3;rootWorld:Vec3;scale:number;baseBottomLocal:number;
  openingCard:{position:Vec3;width:number;height:number};
  pullTab:{position:Vec3;width:number;height:number;buttonHeight:number};
}
/** Authored crate base is centered at y=-5 with height2cm, hence bottom y=-6.
 * This layout assumes an upright crate and identity Roomscript parent, checked by the Preview regression.
 */
export function crateSurfaceLayout(surfaceWorld:Vec3,scale=.75):CrateSurfaceLayout {
  if(!surfaceWorld.every(Number.isFinite)||!Number.isFinite(scale)||scale<=0)throw Error("Invalid crate support transform");
  return {surfaceWorld:[...surfaceWorld] as Vec3,rootWorld:[surfaceWorld[0],surfaceWorld[1]+6*scale,surfaceWorld[2]],scale,baseBottomLocal:-6,
    openingCard:{position:[0,32,30],width:58,height:32},pullTab:{position:[0,8,27],width:38,height:10,buttonHeight:9}};
}
export function recordedCrateSurfaceLayout():CrateSurfaceLayout {
  const support=EVENING_ROOM_SCAN.objects.find(object=>object.id==="SCAN_6");
  if(!support)throw Error("Recorded coffee-table support missing");
  return crateSurfaceLayout([support.pos[0],support.pos[1]+EVENING_ROOM_FLOOR_Y,support.pos[2]]);
}
