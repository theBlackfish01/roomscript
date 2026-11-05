import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";

/** Pull/lift admission, no double tap, and fixed physical anchors.
 * Set ik=true for a separate strict IK reach check; it has no scripted fallback.
 * Set hold=true for a ten-second photograph capture during each plain SIK drag.
 */
@component export class RoomscriptPhysicalMemoryLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void>{
    await sleep(1200);
    const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const flow=opening.cast.flow,engine=flow.engine,room=opening.cast.room,objection=opening.clue.objection;
    const scripted=new DefaultLeafInteractor(),ik=config?.get("ik")==="true"?createIKInteractor({body:{fallback:undefined}}):undefined;
    const duration=config?.get("hold")==="true"?10000:650;
    const target=(name:string)=>{const matches=findInteractablesByName(name,undefined,true);expect(matches.length).toBe(1);return matches[0];};
    const close=async()=>{await sleep(200);if(ik)await ik.trigger(target("Close memory"));else await scripted.trigger(target("Close memory"));await sleep(150);};
    const count=()=>engine.snapshot().log.filter(a=>a.type==="PinchObject").length;
    try{
      engine.configurePreset();opening.finish();await sleep(350);
      const graph=engine.graphRef(),kettle=graph.room.objects.find(o=>o.type==="kettle")!,cup=graph.room.objects.find(o=>o.type==="cup")!,cord=graph.room.objects.find(o=>o.type==="cord")!;
      expect(!!kettle&&!!cup&&!!cord).toBe(true);
      if(!ik){
        const before=count();await scripted.drag(target("RoomscriptObject_"+kettle.id),new vec3(0,.001,0),300);
        expect(count()).toBe(before);expect(objection.diagnostics().opened).toBe(false);await sleep(300);
      }
      for(const object of ik?[cup]:[kettle,cup,cord]){
        const anchor=room.objectAnchor(object.id),position=anchor.getTransform().getWorldPosition(),before=count(),counters=objection.diagnostics();
        const item=target("RoomscriptObject_"+object.id);
        if(ik){console.log("MEMORY_REACH_ROUTE|"+JSON.stringify({object:object.id,indirect:ik.right.isIndirect(item)}));await ik.drag(item,new vec3(0,18,0));}
        else await scripted.drag(item,new vec3(0,1,0),duration);
        expect(count()).toBe(before+1);expect(objection.diagnostics().pulls).toBe(counters.pulls+1);
        expect(objection.diagnostics().lifts).toBe(counters.lifts+(object.type==="cup"||object.type==="cord"?1:0));
        expect(objection.diagnostics().opened).toBe(true);expect(anchor.getTransform().getWorldPosition().distance(position)<.001).toBe(true);expect(room.audit().length).toBe(0);
        await close();
      }
      if(!ik){
        const before=count();await scripted.trigger(target("RoomscriptObject_"+kettle.id));expect(count()).toBe(before+1);expect(objection.diagnostics().opened).toBe(true);await close();
      }
      console.log("PHYSICAL_MEMORY_CHECK|"+JSON.stringify({ik:!!ik,...objection.diagnostics(),bindings:room.audit().length}));
    }finally{flow.cancel();engine.configurePreset();opening.finish();}
  }
}
