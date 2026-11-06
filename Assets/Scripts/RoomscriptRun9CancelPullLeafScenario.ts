import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";

/** Run 9 regression (Run 8 review bug 2): a cancelled or tracking-lost objection pull leaves objection mode,
 * so the next ordinary pull opens a memory and never sends an Object action or costs a pip. */
@component export class RoomscriptRun9CancelPullLeafScenario extends Scenario {
  async run():Promise<void> {await enterCase();await sleep(1200);
    const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const flow=opening.cast.flow,engine=flow.engine,objection=opening.clue.objection,hand=new DefaultLeafInteractor();flow.client.forceOffline=true;
    const tap=async(name:string)=>{let hits=findInteractablesByName(name,undefined,true);for(let i=0;i<30&&!hits.length;i++){await sleep(50);hits=findInteractablesByName(name,undefined,true);}expect(hits.length).toBe(1);await hand.trigger(hits[0]);await sleep(250);};
    const done=async()=>{for(let i=0;i<150&&flow.diagnostics().busy;i++)await sleep(100);expect(flow.diagnostics().busy).toBe(false);};
    const objects=()=>engine.snapshot().log.filter(a=>a.type==="Object").length;
    try{
      await tap("Question S2");await tap("Question 1");await done();
      await tap("Object");expect(objection.diagnostics().objecting).toBe(true);
      // Tracking lost mid-pull: the same path as a cancelled SIK trigger.
      objection.cancelActivePull();expect(objection.diagnostics().objecting).toBe(false);expect(objection.diagnostics().opened).toBe(false);
      const pips=engine.snapshot().pips,before=objects(),pulls=objection.diagnostics().pulls;
      // An ordinary pull straight up from the kettle, released away from any suspect.
      const kettle=findInteractablesByName("RoomscriptObject_O11",undefined,true)[0];expect(!!kettle).toBe(true);
      await hand.drag(kettle,new vec3(0,14,0),900);await sleep(500);
      console.log("RUN9_CANCEL_PULL|"+JSON.stringify({objecting:objection.diagnostics().objecting,objects:objects()-before,pips:[pips,engine.snapshot().pips],pulls:[pulls,objection.diagnostics().pulls],card:objection.cardDiagnostics().id}));
      expect(objects()).toBe(before);expect(engine.snapshot().pips).toBe(pips);expect(objection.diagnostics().objecting).toBe(false);
      expect(objection.diagnostics().pulls).toBe(pulls+1);
    }finally{flow.cancel();flow.client.forceOffline=false;}
  }
}
