import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptSpatialObjectionController} from "./RoomscriptSpatialObjectionController";
import {InteractionPlane} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractionPlane/InteractionPlane";

@component export class RoomscriptObjectionLeafScenario extends Scenario {
  async run():Promise<void> {
    await sleep(1800);const objection=findSceneObjectByName("RoomscriptObjection").getComponent(RoomscriptSpatialObjectionController.getTypeName()) as RoomscriptSpatialObjectionController;
    const flow=objection.flow,engine=flow.engine,hand=new DefaultLeafInteractor();flow.client.forceOffline=true;
    const tap=async(name:string)=>{const matches=findInteractablesByName(name,undefined,true);expect(matches.length).toBe(1);await hand.trigger(matches[0]);await sleep(180);};
    const dragTo=async(target:SceneObject)=>{const slip=findInteractablesByName("RoomscriptStatementSlip",undefined,true)[0],vector=new vec3(1,0,0);
      const remove=slip.onDragUpdate.add(()=>{const delta=target.getTransform().getWorldPosition().sub(slip.getTransform().getWorldPosition()).uniformScale(.16);vector.x=delta.x;vector.y=delta.y;vector.z=delta.z;});
      try {await hand.drag(slip,vector,1400);}finally{remove();}await sleep(120);};
    try {
      await flow.askChip("where@22:30");const time=engine.snapshot().elapsedMinutes;
      await tap("RoomscriptObject_O11");expect(engine.snapshot().knowledge.evidenceIds.includes("E_KETTLE_COLD")).toBe(true);expect(engine.snapshot().elapsedMinutes-time).toBe(10);
      await tap("Close memory");await tap("RoomscriptObject_O7");await tap("Close memory");
      objection.open("E_CLOCK_FOUND");await sleep(300);const backing=findSceneObjectByName("RoomscriptStatementSlip").getChild(0),plane=backing.getComponent(InteractionPlane.getTypeName()) as InteractionPlane;
      expect(backing.getComponent("ColliderComponent").enabled).toBe(false);expect(plane.collider===null||!plane.collider.enabled).toBe(true);const pips=engine.snapshot().pips;
      await dragTo(findSceneObjectByName("RoomscriptMemoryCard"));expect(objection.diagnostics().history.includes("bounce")).toBe(true);await sleep(1300);expect(engine.snapshot().pips).toBe(pips-1);expect(engine.snapshot().suspects.S2.layer).toBe(0);
      objection.close();objection.open("E_KETTLE_COLD");await sleep(300);await dragTo(findSceneObjectByName("RoomscriptMemoryCard"));expect(objection.diagnostics().correct).toBe(true);
      await sleep(3200);expect(engine.snapshot().suspects.S2.layer).toBe(1);expect(objection.diagnostics().history.join(",")).toBe("silence,slam,shatter,walk,idle");
      expect(flow.actor.getTransform().getWorldPosition().distance(objection.tells.room.toWorld([80,0,-125]))<.1).toBe(true);
      engine.dispatch({type:"Ask",suspect:"S3",topic:"about:V"});
      await flow.askChip("where@22:30");objection.wallet.onSelect.invoke("C_OKAFOR_REPLY");await sleep(300);
      expect(objection.diagnostics().selected).toBe("C_OKAFOR_REPLY");
      await dragTo(findSceneObjectByName("RoomscriptMemoryCard"));await sleep(3200);expect(engine.snapshot().suspects.S2.layer).toBe(2);expect(engine.snapshot().activeStatement).toBe("C_VALE_ALIBI_2");
      console.log("OBJECTION_CHECK|"+JSON.stringify({wrongPip:true,cardDrop:true,objectDrop:true,layer:2,history:objection.diagnostics().history}));
    }finally {flow.cancel();flow.client.forceOffline=false;}
  }
}
