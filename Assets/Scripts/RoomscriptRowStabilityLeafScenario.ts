import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
/** Inject walking and turning into the production controller, with real row visibility checks. */
@component export class RoomscriptRowStabilityLeafScenario extends Scenario {
  async run():Promise<void>{await enterCase();await sleep(500);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const cast=opening.cast,flow=cast.flow;RoomscriptAudio.active.silence(true);await RoomscriptAudio.active.speech.idle();
    const actors=cast.actors(),cameras=actors.map(a=>a.camera),eye=global.scene.createSceneObject("Run10RowTestEye"),target=flow.actorFor("S2"),mark=target.getTransform().getWorldPosition().add(new vec3(0,target.heights().facing,0));
    actors.forEach(a=>a.camera=eye);cast.clearPreviewFocus();
    const pose=(distance:number,degrees:number)=>{eye.getTransform().setWorldPosition(mark.add(new vec3(0,0,distance)));eye.getTransform().setWorldRotation(quat.fromEulerAngles(0,degrees*Math.PI/180,0));};
    try{pose(800,0);await sleep(1300);expect(flow.row.diagnostics().visible).toBe(false);
      pose(400,0);await sleep(600);expect(cast.proximityState().nearest).toBe("S2");expect(flow.row.diagnostics().visible).toBe(true);
      let toggles=0;for(let i=0;i<40;i++){pose(i%2?510:620,i%2?40:65);await sleep(60);if(!flow.row.diagnostics().visible)toggles++;}expect(toggles).toBe(0);
      pose(700,80);await sleep(450);expect(flow.row.diagnostics().visible).toBe(true);pose(600,50);await sleep(200);expect(flow.row.diagnostics().visible).toBe(true);
      pose(700,80);await sleep(1250);expect(flow.row.diagnostics().visible).toBe(false);
      pose(400,0);await sleep(500);const hand=new DefaultLeafInteractor();await hand.trigger(findInteractablesByName("Ask")[0]);await sleep(100);
      expect(flow.row.diagnostics().mode).toBe("ask");pose(700,80);await sleep(1400);
      expect(flow.row.diagnostics().visible).toBe(true);expect(flow.diagnostics().suspect).toBe("S2");
      flow.row.speaking(true);expect(flow.row.diagnostics().visible).toBe(true);expect(flow.row.diagnostics().blocked).toBe(true);flow.row.speaking(false);flow.row.close();
      const click=findSceneObjectByName("Question S2"),box=click.getComponent("Physics.ColliderComponent").shape as BoxShape;
      expect(click.getTransform().getLocalPosition().y+box.size.y/2>=target.heights().top).toBe(true);
      console.log("ROW_STABILITY_CHECK|jitterToggles="+toggles+"|acquireCm=400|menuRetained=true|headCovered=true");
    }finally{actors.forEach((a,i)=>a.camera=cameras[i]);eye.destroy();RoomscriptAudio.active.silence(false);}
  }
}
