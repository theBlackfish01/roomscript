import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {RoomscriptRun10LeafDriver} from "./RoomscriptRun10LeafDriver";
/** One physical file, existing cast and atmosphere, no pre-show placement or pull. */
@component export class RoomscriptOpeningLeafScenario extends Scenario {
 async run():Promise<void>{await sleep(700);const d=new RoomscriptRun10LeafDriver(),muted=d.audio.speechMuted();d.audio.silence(true);
  try{expect(d.opening.diagnostics().phase).toBe("file");expect(d.engine.investigationEnabled).toBe(false);expect(d.opening.cast.actors().every(a=>a.getSceneObject().enabled)).toBe(true);
   expect(findInteractablesByName("Open case file",undefined,true).length).toBe(1);for(const old of ["Place case","RoomscriptPullTab","Floor higher"])expect(findInteractablesByName(old,undefined,true).length).toBe(0);
   expect(!!findSceneObjectByName("RoomscriptDoorTape")).toBe(true);expect(d.opening.diagnostics().chalk>20).toBe(true);expect(d.opening.cast.room.audit().length).toBe(0);
   await d.open();expect(d.engine.investigationEnabled).toBe(true);expect(d.engine.snapshot().elapsedMinutes).toBe(0);expect(d.opening.controlsHintVisible()).toBe(false);
   expect(d.opening.diagnostics().trace.filter(s=>s!=="open")).toEqual(["V10_OPEN","N10_OPEN_1","N10_OPEN_2"]);
   expect(findInteractablesByName("Open case file",undefined,true).length).toBe(0);console.log("OPENING_CHECK|"+JSON.stringify(d.opening.diagnostics()));
  }finally{d.audio.silence(muted);}
 }
}
