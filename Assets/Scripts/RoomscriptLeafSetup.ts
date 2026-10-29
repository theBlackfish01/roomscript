import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
/** Production feature scenarios start after the separately tested pre-show. */
export async function enterCase():Promise<void>{await sleep(300);const root=findSceneObjectByName("RoomscriptOpening");if(root)(root.getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController).finish();await sleep(200);}
