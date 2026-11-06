import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar";
import {SIK} from "SpectaclesInteractionKit.lspkg/SIK";
import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptClosingController} from "./RoomscriptClosingController";
import {recordedCrateSurfaceLayout} from "./Content/CrateSurfaceLayout";
/** Strict SIK hand rays: no scripted fallback; candidate choice never seals a case. */
@component export class RoomscriptPointAccuseLeafScenario extends Scenario {
  async run():Promise<void>{
    await sleep(1000);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const closing=findSceneObjectByName("RoomscriptClosing").getComponent(RoomscriptClosingController.getTypeName()) as RoomscriptClosingController;
    const cast=opening.cast,flow=cast.flow,engine=flow.engine,hand=createIKInteractor({body:{fallback:undefined}}),offline=flow.client.forceOffline;
    const targets=(name:string)=>findInteractablesByName(name,undefined,true);let lastCheck="setup";
    const point=(v:vec3)=>[v.x,v.y,v.z];
    const report=(step:string,extra:Record<string,unknown>={})=>{const state=engine.snapshot();console.log("POINT_ACCUSE_STEP|"+JSON.stringify({step,lastCheck,closing:closing.diagnostics(),targeting:cast.accusationTargeting(),controlsBlocked:flow.controlsBlocked,proximity:cast.proximityState(),busy:flow.diagnostics().busy,rightPinching:SIK.HandInputData.getHand("right").isPinching(),camera:point(flow.actor.camera.getTransform().getWorldPosition()),questions:targets("Question 1").length,verbs:targets("Believe").length,nameS4:targets("Question S4").length,bodyS4:targets("RoomscriptAccuse_S4").length,cancel:targets("Cancel accusation").length,accusations:state.log.filter(a=>a.type==="Accuse").length,verdict:state.verdict,...extra}));};
    const check=(name:string,received:unknown,expected:unknown)=>{lastCheck=name;console.log("POINT_ACCUSE_ASSERT|"+JSON.stringify({name,received,expected}));expect(received).toBe(expected);};
    const target=(name:string)=>{const found=targets(name);check("unique target: "+name,found.length,1);return found[0];};
    const pinch=async(name:string)=>{const item=target(name),node=item.getSceneObject(),button=node.getComponent(RectangleButton.getTypeName()) as RectangleButton;
      if(name==="Cancel accusation"){const transform=node.getTransform().getWorldTransform(),bottom=Math.min(...[-1,1].flatMap(x=>[-1,1].map(y=>transform.multiplyPoint(new vec3(x*button.size.x/2,y*button.size.y/2,0)).y)));check("cancel target clears tabletop",bottom>recordedCrateSurfaceLayout().surfaceWorld[1],true);}
      let downs=0,ends=0,ups=0;const down=()=>downs++,end=()=>ends++,up=()=>ups++;
      item.onTriggerStart.add(down);item.onTriggerEnd.add(end);if(button)button.onTriggerUp.add(up);
      report("before pinch "+name,{targetPosition:point(node.getTransform().getWorldPosition()),indirect:hand.right.isIndirect(item)});
      try{await hand.trigger(item);report("after pinch "+name,{downs,ends,buttonUps:button?ups:null});}
      finally{item.onTriggerStart.remove(down);item.onTriggerEnd.remove(end);if(button)button.onTriggerUp.remove(up);}
    };
    try{
      flow.client.forceOffline=true;engine.configurePreset();opening.finish();await sleep(500);report("Preset ready");
      await hand.ready;await pinch("Question S2");await sleep(200);report("question selected");
      check("questions shown before accusation",targets("Question 1").length,1);check("verbs hidden before accusation",targets("Believe").length,0);
      check("body targeting initially off",cast.accusationTargeting(),false);check("body S4 initially hidden",targets("RoomscriptAccuse_S4").length,0);
      closing.open();await sleep(400);report("accusation opened");check("accusation modal open",closing.diagnostics().opened,true);check("body targeting on",cast.accusationTargeting(),true);for(const person of engine.graphRef().cast.suspects)check("modal hides pawn "+person.id,findSceneObjectByName("RoomscriptPawn_"+person.id).enabled,false);
      check("name S4 hidden in accusation",targets("Question S4").length,0);check("questions hidden in accusation",targets("Question 1").length,0);check("verbs hidden in accusation",targets("Believe").length,0);
      const before=engine.snapshot().log.filter(a=>a.type==="Accuse").length,body=target("RoomscriptAccuse_S4");
      check("body S4 uses indirect hand ray",hand.right.isIndirect(body),true);await pinch("RoomscriptAccuse_S4");await sleep(250);report("body selection settled");
      check("body pinch selects S4",closing.diagnostics().picked.who,"S4");check("body pinch never seals",engine.snapshot().log.filter(a=>a.type==="Accuse").length,before);check("body pinch leaves verdict empty",engine.snapshot().verdict,null);
      await pinch("Cancel accusation");await sleep(350);report("cancel settled");
      check("cancel closes modal",closing.diagnostics().opened,false);check("cancel disables body targeting",cast.accusationTargeting(),false);check("cancel hides body S4",targets("RoomscriptAccuse_S4").length,0);
      check("cancel restores only questions",targets("Question 1").length>0&&targets("Believe").length===0,true);check("cancel restores name S4",targets("Question S4").length,1);for(const person of engine.graphRef().cast.suspects)check("cancel restores pawn "+person.id,findSceneObjectByName("RoomscriptPawn_"+person.id).enabled,true);
      check("cancel never seals",engine.snapshot().log.filter(a=>a.type==="Accuse").length,before);
      console.log("POINT_ACCUSE_CHECK|"+JSON.stringify({strictIK:true,indirect:true,picked:"S4",accusations:before,cancelRestored:true}));
    }catch(error){report("FAILED before cleanup",{error:String(error)});throw error;}
    finally{flow.cancel();flow.client.forceOffline=offline;engine.configurePreset();opening.finish();}
  }
}
