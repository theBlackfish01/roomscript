import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
/** Inject tracked poses into the real proximity controller, then use its Preview pinch fallback. */
@component export class RoomscriptProximityLeafScenario extends Scenario {
  async run():Promise<void>{
    await sleep(700);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const cast=opening.cast,flow=cast.flow;flow.engine.configurePreset();opening.finish();await sleep(400);
    const actors=cast.actors(),cameras=actors.map(a=>a.camera),eye=global.scene.createSceneObject("RoomscriptProximityTestEye"),hand=new DefaultLeafInteractor();
    const targets=(name:string)=>findInteractablesByName(name,undefined,true),far=()=>eye.getTransform().setWorldPosition(new vec3(0,0,1000));
    actors.forEach(a=>a.camera=eye);const mark=actors.find(a=>a.suspect==="S4")!.getTransform().getWorldPosition();
    try{
      far();await sleep(400);expect(targets("Question 1").length).toBe(0);expect(targets("Believe").length).toBe(0);
      eye.getTransform().setWorldPosition(mark.add(new vec3(0,130,100)));await sleep(400);expect(cast.proximityState().nearest).toBe("S4");expect(targets("Question 1").length).toBe(1);
      far();await sleep(400);expect(targets("Question 1").length).toBe(0);
      flow.controlsBlocked=true;eye.getTransform().setWorldPosition(mark.add(new vec3(0,130,100)));await sleep(400);expect(targets("Question 1").length).toBe(0);
      flow.controlsBlocked=false;far();const fallback=targets("Question S2");expect(fallback.length).toBe(1);await hand.trigger(fallback[0]);await sleep(350);
      expect(cast.proximityState().previewFallback).toBe(true);expect(targets("Question 1").length).toBe(1);expect(targets("Believe").length).toBe(0);
      console.log("PROXIMITY_CHECK|far_hidden,near_S4,modal_blocked,Preview_pinch_fallback");
    }finally{actors.forEach((a,i)=>a.camera=cameras[i]);eye.destroy();flow.controlsBlocked=false;}
  }
}
