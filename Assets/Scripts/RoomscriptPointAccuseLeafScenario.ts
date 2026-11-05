import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptClosingController} from "./RoomscriptClosingController";
/** Strict SIK hand rays: no scripted fallback; candidate choice never seals a case. */
@component export class RoomscriptPointAccuseLeafScenario extends Scenario {
  async run():Promise<void>{
    await sleep(1000);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const closing=findSceneObjectByName("RoomscriptClosing").getComponent(RoomscriptClosingController.getTypeName()) as RoomscriptClosingController;
    const cast=opening.cast,flow=cast.flow,engine=flow.engine,hand=createIKInteractor({body:{fallback:undefined}}),offline=flow.client.forceOffline;
    const targets=(name:string)=>findInteractablesByName(name,undefined,true);
    const target=(name:string)=>{const found=targets(name);expect(found.length).toBe(1);return found[0];};
    try{
      flow.client.forceOffline=true;engine.configurePreset();opening.finish();await sleep(500);
      expect(cast.accusationTargeting()).toBe(false);expect(targets("RoomscriptAccuse_S4").length).toBe(0);
      closing.open();await sleep(400);expect(closing.diagnostics().opened).toBe(true);expect(cast.accusationTargeting()).toBe(true);
      expect(targets("Question S4").length).toBe(0);expect(targets("Question 1").length).toBe(0);expect(targets("Believe").length).toBe(0);
      const before=engine.snapshot().log.filter(a=>a.type==="Accuse").length,body=target("RoomscriptAccuse_S4");
      expect(hand.right.isIndirect(body)).toBe(true);await hand.trigger(body);await sleep(250);
      expect(closing.diagnostics().picked.who).toBe("S4");expect(engine.snapshot().log.filter(a=>a.type==="Accuse").length).toBe(before);expect(engine.snapshot().verdict).toBe(null);
      await hand.trigger(target("Cancel accusation"));await sleep(350);
      expect(closing.diagnostics().opened).toBe(false);expect(cast.accusationTargeting()).toBe(false);expect(targets("RoomscriptAccuse_S4").length).toBe(0);
      expect(targets("Question 1").length>0&&targets("Believe").length===0).toBe(true);expect(targets("Question S4").length).toBe(1);
      expect(engine.snapshot().log.filter(a=>a.type==="Accuse").length).toBe(before);
      console.log("POINT_ACCUSE_CHECK|"+JSON.stringify({strictIK:true,indirect:true,picked:"S4",accusations:before,cancelRestored:true}));
    }finally{flow.cancel();flow.client.forceOffline=offline;engine.configurePreset();opening.finish();}
  }
}
