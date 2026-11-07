import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptAudio} from "./RoomscriptAudio";
/** Production feature scenarios start after the separately tested pre-show. */
export async function enterCase():Promise<void>{await sleep(100);const root=findSceneObjectByName("RoomscriptOpening");if(root)(root.getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController).finish(true);await sleep(200);await RoomscriptAudio.active?.speech.idle();}
