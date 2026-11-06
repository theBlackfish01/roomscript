import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {dustableObjects} from "./Engine/game/Fingerprints";

/** Run 8 wow 9: hovering a hand over a dustable object reveals prints and files its memory through a
 * PinchObject action, the same engine path as pinching it. */
@component export class RoomscriptRun8DustLeafScenario extends Scenario {
  async run():Promise<void> {await enterCase();await sleep(1500);
    const flow=findSceneObjectByName("RoomscriptInterrogation").getComponent(RoomscriptInterrogationController.getTypeName()) as RoomscriptInterrogationController;
    const engine=flow.engine,hand=new DefaultLeafInteractor(),target=dustableObjects(engine.graphRef())[0];expect(!!target).toBe(true);
    const pinches=()=>engine.snapshot().log.filter(a=>a.type==="PinchObject"&&(a as any).object===target).length,before=pinches();
    const item=findInteractablesByName("RoomscriptObject_"+target,undefined,true)[0];expect(!!item).toBe(true);
    await hand.hover(item,2600);await sleep(600);
    const prints=findSceneObjectByName("RoomscriptPrints_"+target);console.log("RUN8_DUST|"+JSON.stringify({target,pinches:pinches()-before,prints:!!prints&&prints.enabled}));
    expect(pinches()-before).toBe(1);
  }
}
