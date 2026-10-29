import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
@component export class RoomscriptOpeningLeafScenario extends Scenario {
  async run():Promise<void>{await sleep(4500);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;expect(opening.diagnostics().phase).toBe("tab");expect(opening.cast.flow.engine.snapshot().elapsedMinutes).toBe(0);expect(opening.clue.envelope.enabled).toBe(false);opening.cast.flow.engine.dispatch({type:"PinchObject",object:"O6"});expect(opening.cast.flow.engine.snapshot().elapsedMinutes).toBe(0);const tab=findInteractablesByName("RoomscriptPullTab",undefined,true);expect(tab.length).toBe(1);await new DefaultLeafInteractor().drag(tab[0],new vec3(12,0,0),500);expect(opening.diagnostics().phase).toBe("reveal");for(let i=0;i<160&&opening.diagnostics().phase!=="ready";i++)await sleep(100);expect(opening.diagnostics().phase).toBe("ready");expect(opening.diagnostics().trace.filter(s=>s==="knock").length).toBe(3);expect(opening.diagnostics().trace.filter(s=>s.startsWith("arrival:")).length).toBe(4);expect(opening.diagnostics().chalk>20).toBe(true);expect(opening.clue.envelope.enabled).toBe(true);expect(opening.cast.flow.engine.snapshot().elapsedMinutes).toBe(0);console.log("OPENING_CHECK|"+JSON.stringify(opening.diagnostics()));}
}
