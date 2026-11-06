import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptClueController} from "./RoomscriptClueController";
import {replayGame} from "./Engine/game/Reducer";

@component export class RoomscriptClueLeafScenario extends Scenario {
  async run():Promise<void> { await enterCase();
    await sleep(1800);const clue=findSceneObjectByName("RoomscriptClue").getComponent(RoomscriptClueController.getTypeName()) as RoomscriptClueController;
    const flow=clue.objection.flow,engine=flow.engine,room=clue.objection.tells.room,hand=new DefaultLeafInteractor();flow.client.forceOffline=true;
    const audioOrigin=clue.objection.tells.audio.getTransform().getWorldPosition(),camera=flow.actor.camera.getTransform(),cameraHome=camera.getWorldPosition(),cameraRotation=camera.getWorldRotation();
    expect(!!flow.actor.camera.getComponent("Component.AudioListenerComponent")).toBe(true);
    const starts:{busy:boolean;card:string}[]=[];clue.onSelection.add(()=>{const view=clue.diagnostics();starts.push({busy:view.busy,card:view.card});});
    const checkRefutationBounds=()=>{const panel=findSceneObjectByName("RoomscriptRefutationCard"),transform=panel.getTransform(),world=transform.getWorldTransform(),inverse=transform.getInvertedWorldTransform();
      const bottom=Math.min(...[-1,1].flatMap(x=>[-1,1].map(y=>world.multiplyPoint(new vec3(x*27,y*18,0)).y))),floor=room.getTransform().getWorldPosition().y;
      expect(transform.getWorldScale().distance(vec3.one())<.001).toBe(true);expect(bottom>=floor+59.99).toBe(true);
      const matches=findInteractablesByName("Close refutation",undefined,true);expect(matches.length).toBe(1);const node=matches[0].getSceneObject(),button=node.getComponent(RectangleButton.getTypeName()) as RectangleButton;expect(!!button).toBe(true);
      const matrix=node.getTransform().getWorldTransform();for(const x of [-1,1])for(const y of [-1,1]){const local=inverse.multiplyPoint(matrix.multiplyPoint(new vec3(x*button.size.x/2,y*button.size.y/2,0)));expect(Math.abs(local.x)<=27.1).toBe(true);expect(Math.abs(local.y)<=18.1).toBe(true);}
      console.log("REFUTATION_PANEL_BOUNDS|"+JSON.stringify({bottom,floor,scaleOne:true,closeInside:true}));
    };
    const finishSweep=async()=>{for(let i=0;i<150&&clue.diagnostics().busy;i++)await sleep(100);expect(clue.diagnostics().busy).toBe(false);await sleep(200);};
    const tap=async(name:string)=>{const targets=findInteractablesByName(name,undefined,true);console.log("CLUE_TAP|"+name+"|"+targets.length);expect(targets.length).toBe(1);await hand.trigger(targets[0]);await sleep(100);};
    const dragPawn=async(id:string,zone:string)=>{const pawn=findInteractablesByName("RoomscriptPawn_"+id,undefined,true)[0],target=vec3.lerp(flow.actor.camera.getTransform().getWorldPosition(),room.zoneAnchor(zone).getTransform().getWorldPosition(),.3),vector=new vec3(1,0,0);
      const remove=pawn.onDragUpdate.add(()=>{const delta=target.sub(pawn.getTransform().getWorldPosition()).uniformScale(.5);vector.x=delta.x;vector.y=delta.y;vector.z=delta.z;});try{await hand.drag(pawn,vector,2200);}finally{remove();}await sleep(200);};
    try {
      await dragPawn("S1","Z1");expect(clue.diagnostics().pending).toBe("S1");expect(findSceneObjectByName("RoomscriptSuggestionGhost").enabled).toBe(true);expect(engine.snapshot().elapsedMinutes).toBe(0);
      await tap("RoomscriptObject_O1");expect(engine.snapshot().elapsedMinutes).toBe(15);expect(engine.snapshot().knowledge.evidenceIds.includes("E_CABLE")).toBe(false);expect(starts[0].busy).toBe(true);expect(starts[0].card).toBe("");
      await finishSweep();expect(clue.diagnostics().refuter).toBe("O8");expect(clue.diagnostics().visited.slice(-1)[0]).toBe("O8");expect(clue.diagnostics().card.length>0).toBe(true);expect(engine.snapshot().grid.suspects.includes("S1")).toBe(false);expect(findSceneObjectByName("RoomscriptSuspectGrid_S1").enabled).toBe(false);
      expect(findSceneObjectByName("RoomscriptPawn_S1").getChildrenCount()>2).toBe(true);checkRefutationBounds();await tap("Close refutation");
      expect(findSceneObjectByName("RoomscriptCaseLidUI").getChild(0).getComponent("ColliderComponent").enabled).toBe(false);
      await tap("RoomscriptObject_O6");await tap("Close memory");expect(engine.snapshot().grid.suspects.includes("S1")).toBe(true);
      // The exclusion stays certified while its room marker yields to a nearby speaker.
      await tap("Question S2");const face=flow.actor.getTransform().getWorldPosition().add(new vec3(0,130,0));camera.setWorldPosition(face.add(new vec3(0,0,100)));camera.setWorldRotation(quat.quatIdentity());await sleep(350);
      expect(engine.snapshot().grid.suspects.includes("S1")).toBe(true);expect(findSceneObjectByName("RoomscriptSuspectGrid_S1").enabled).toBe(false);expect(clue.objection.tells.diagnostics().visibleSegments).toBe(0);
      camera.setWorldRotation(quat.fromEulerAngles(-Math.PI/3,0,0));await sleep(350);expect(findSceneObjectByName("RoomscriptSuspectGrid_S1").enabled).toBe(true);expect(engine.snapshot().grid.suspects.includes("S1")).toBe(true);
      camera.setWorldPosition(cameraHome);camera.setWorldRotation(cameraRotation);await sleep(250);
      await dragPawn("S2","Z1");expect(clue.diagnostics().pending).toBe("S2");await tap("RoomscriptObject_O1");await finishSweep();expect(clue.diagnostics().refuter).toBe(null);expect(clue.diagnostics().breaths).toBe(0);expect(engine.snapshot().elapsedMinutes).toBe(40);expect(engine.snapshot().verdict).toBe(null);
      expect(JSON.stringify(replayGame(engine.caseGraph(),engine.snapshot().log))).toBe(JSON.stringify(engine.snapshot()));
      expect(clue.objection.tells.audio.getTransform().getWorldPosition().distance(audioOrigin)<.01).toBe(true);
      console.log("CLUE_CHECK|"+JSON.stringify({refuter:"O8",privateCard:true,noRefuter:true,pawnDrag:true,clock:40,replay:true}));
    }finally{camera.setWorldPosition(cameraHome);camera.setWorldRotation(cameraRotation);flow.cancel();flow.client.forceOffline=false;}
  }
}
