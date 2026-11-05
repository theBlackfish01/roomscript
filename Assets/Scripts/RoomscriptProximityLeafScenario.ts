import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
/** Inject tracked poses into the real proximity controller, then use its Preview pinch fallback. */
@component export class RoomscriptProximityLeafScenario extends Scenario {
  async run():Promise<void>{
    await sleep(700);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const cast=opening.cast,flow=cast.flow;flow.engine.configurePreset();opening.finish();await sleep(400);
    const actors=cast.actors(),cameras=actors.map(a=>a.camera),eye=global.scene.createSceneObject("RoomscriptProximityTestEye"),hand=new DefaultLeafInteractor();
    const targets=(name:string)=>findInteractablesByName(name,undefined,true),far=()=>eye.getTransform().setWorldPosition(new vec3(0,0,1000));
    actors.forEach(a=>a.camera=eye);const mark=actors.find(a=>a.suspect==="S4")!.getTransform().getWorldPosition();
    const checkQuestionSize=()=>{const buttons=targets("Question 1");expect(buttons.length).toBe(1);const node=buttons[0].getSceneObject(),button=node.getComponent(RectangleButton.getTypeName()) as RectangleButton;expect(!!button).toBe(true);
      const transform=node.getTransform().getWorldTransform(),bottom=transform.multiplyPoint(new vec3(0,-button.size.y/2,0)),top=transform.multiplyPoint(new vec3(0,button.size.y/2,0)),height=top.distance(bottom),minimum=2*Math.tan(1.25*Math.PI/180)*150;
      console.log("QUESTION_TARGET_SIZE|"+JSON.stringify({heightCm:height,minimumCm:minimum,degreesAt150cm:2*Math.atan(height/300)*180/Math.PI}));expect(height).toBeGreaterThan(minimum);
    };
    const waitForChecks=async(label:string,condition:()=>boolean)=>{
      const before=cast.proximityState().checks,deadline=Date.now()+20000;
      while(Date.now()<deadline){await sleep(50);if(cast.proximityState().checks>=before+2&&condition())return;}
      const position=eye.getTransform().getWorldPosition(),forward=eye.getTransform().getWorldRotation().multiplyVec3(vec3.back());
      console.log("PROXIMITY_WAIT_FAILED|"+JSON.stringify({label,state:cast.proximityState(),blocked:flow.controlsBlocked,busy:flow.diagnostics().busy,investigation:flow.engine.investigationEnabled,questions:targets("Question 1").length,eye:[position.x,position.y,position.z],actors:actors.map(actor=>{const delta=actor.getTransform().getWorldPosition().add(new vec3(0,130,0)).sub(position);return {id:actor.suspect,enabled:actor.getSceneObject().enabled,distance:delta.length,facing:delta.length>.001?delta.normalize().dot(forward):0};})}));
      throw Error("Proximity did not settle after two controller checks: "+label);
    };
    try{
      far();await waitForChecks("initial far",()=>cast.proximityState().reason==="scanned"&&targets("Question 1").length===0);expect(targets("Question 1").length).toBe(0);expect(targets("Believe").length).toBe(0);
      eye.getTransform().setWorldPosition(mark.add(new vec3(0,130,100)));await waitForChecks("near S4",()=>cast.proximityState().nearest==="S4"&&targets("Question 1").length===1);expect(cast.proximityState().nearest).toBe("S4");expect(targets("Question 1").length).toBe(1);checkQuestionSize();
      far();await waitForChecks("leave S4",()=>cast.proximityState().nearest===""&&targets("Question 1").length===0);expect(targets("Question 1").length).toBe(0);
      flow.controlsBlocked=true;eye.getTransform().setWorldPosition(mark.add(new vec3(0,130,100)));await waitForChecks("blocked near S4",()=>cast.proximityState().reason==="modal"&&targets("Question 1").length===0);expect(targets("Question 1").length).toBe(0);
      flow.controlsBlocked=false;far();const fallback=targets("Question S2");expect(fallback.length).toBe(1);await hand.trigger(fallback[0]);await waitForChecks("Preview pinch",()=>cast.proximityState().previewFallback&&targets("Question 1").length===1);
      expect(cast.proximityState().previewFallback).toBe(true);expect(targets("Question 1").length).toBe(1);expect(targets("Believe").length).toBe(0);checkQuestionSize();
      console.log("PROXIMITY_CHECK|far_hidden,near_S4,modal_blocked,Preview_pinch_fallback");
    }finally{actors.forEach((a,i)=>a.camera=cameras[i]);eye.destroy();flow.controlsBlocked=false;}
  }
}
