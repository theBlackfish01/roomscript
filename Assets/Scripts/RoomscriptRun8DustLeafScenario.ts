import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {dustableObjects} from "./Engine/game/Fingerprints";

/** Run 8 wow 9, Run 9 contract (review bug 3): hovering a hand over a dustable object reveals glowing prints
 * and collects nothing; a pinch on the object then files its memory through the ordinary PinchObject path. */
@component export class RoomscriptRun8DustLeafScenario extends Scenario {
  async run():Promise<void> {await enterCase();await sleep(1500);
    const flow=findSceneObjectByName("RoomscriptInterrogation").getComponent(RoomscriptInterrogationController.getTypeName()) as RoomscriptInterrogationController;
    const engine=flow.engine,hand=new DefaultLeafInteractor(),target=dustableObjects(engine.graphRef())[0];expect(!!target).toBe(true);flow.client.forceOffline=true;
    const pinches=()=>engine.snapshot().log.filter(a=>a.type==="PinchObject"&&(a as any).object===target).length,before=pinches(),minutes=engine.snapshot().elapsedMinutes;
    const item=findInteractablesByName("RoomscriptObject_"+target,undefined,true)[0];expect(!!item).toBe(true);
    await hand.hover(item,2600);await sleep(600);
    const prints=findSceneObjectByName("RoomscriptPrints_"+target);
    console.log("RUN9_DUST_REVEAL|"+JSON.stringify({target,pinches:pinches()-before,prints:!!prints&&prints.enabled,minutes:engine.snapshot().elapsedMinutes-minutes,busy:flow.diagnostics().busy,blocked:flow.controlsBlocked}));
    expect(!!prints&&prints.enabled).toBe(true);expect(pinches()-before).toBe(0);expect(engine.snapshot().elapsedMinutes).toBe(minutes);
    await hand.trigger(item);await sleep(500);
    console.log("RUN9_DUST_PINCH|"+JSON.stringify({target,pinches:pinches()-before,prints:prints.enabled}));
    expect(pinches()-before).toBe(1);expect(prints.enabled).toBe(false);
    for(const name of ["Close memory"]){const close=findInteractablesByName(name,undefined,true);if(close.length)await hand.trigger(close[0]);}
    flow.client.forceOffline=false;
  }
}
