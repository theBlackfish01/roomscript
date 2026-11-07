import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptAudio} from "./RoomscriptAudio";
/** Inject walking and turning into the production controller, with real row visibility checks. */
@component export class RoomscriptRowStabilityLeafScenario extends Scenario {
  async run():Promise<void>{await enterCase();await sleep(500);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const cast=opening.cast,flow=cast.flow;RoomscriptAudio.active.silence(true);await RoomscriptAudio.active.speech.idle();
    const actors=cast.actors(),cameras=actors.map(a=>a.camera),eye=global.scene.createSceneObject("Run10RowTestEye"),target=flow.actorFor("S2"),mark=target.getTransform().getWorldPosition().add(new vec3(0,target.heights().facing,0));
    actors.forEach(a=>a.camera=eye);cast.clearPreviewFocus();
    const pose=(distance:number,degrees:number)=>{eye.getTransform().setWorldPosition(mark.add(new vec3(0,0,distance)));eye.getTransform().setWorldRotation(quat.fromEulerAngles(0,degrees*Math.PI/180,0));};
    try{pose(500,0);await sleep(1300);expect(flow.row.diagnostics().visible).toBe(false);
      pose(140,0);await sleep(600);expect(cast.proximityState().nearest).toBe("S2");expect(flow.row.diagnostics().visible).toBe(true);
      let toggles=0;for(let i=0;i<40;i++){pose(i%2?210:245,i%2?40:65);await sleep(60);if(!flow.row.diagnostics().visible)toggles++;}expect(toggles).toBe(0);
      pose(280,75);await sleep(450);expect(flow.row.diagnostics().visible).toBe(true);pose(220,50);await sleep(200);expect(flow.row.diagnostics().visible).toBe(true);
      pose(280,75);await sleep(1250);expect(flow.row.diagnostics().visible).toBe(false);console.log("ROW_STABILITY_CHECK|jitterToggles="+toggles);
    }finally{actors.forEach((a,i)=>a.camera=cameras[i]);eye.destroy();RoomscriptAudio.active.silence(false);}
  }
}
