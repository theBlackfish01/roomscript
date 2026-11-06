import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";

/** Run 8 physical asking: pull a memory photo from the kettle and hold it up to Vale's face, then point at
 * Okafor while facing Vale. Both must reach the engine as ordinary Ask actions by the focused suspect. */
@component export class RoomscriptRun8PresentLeafScenario extends Scenario {
  async run():Promise<void> {await enterCase();await sleep(1200);
    const flow=findSceneObjectByName("RoomscriptInterrogation").getComponent(RoomscriptInterrogationController.getTypeName()) as RoomscriptInterrogationController;
    const engine=flow.engine,hand=new DefaultLeafInteractor();flow.client.forceOffline=true;
    const tap=async(name:string)=>{let hits=findInteractablesByName(name,undefined,true);for(let i=0;i<30&&!hits.length;i++){await sleep(50);hits=findInteractablesByName(name,undefined,true);}expect(hits.length).toBe(1);await hand.trigger(hits[0]);await sleep(250);};
    const done=async()=>{for(let i=0;i<80&&flow.diagnostics().busy;i++)await sleep(200);expect(flow.diagnostics().busy).toBe(false);};
    const asks=()=>engine.snapshot().log.filter(a=>a.type==="Ask") as {type:"Ask";suspect:string;topic:string}[];
    await tap("Question S2");expect(flow.diagnostics().suspect).toBe("S2");
    // 1. Present: drag the kettle's memory photo to Vale's face.
    const kettle=findInteractablesByName("RoomscriptObject_O11",undefined,true)[0];expect(!!kettle).toBe(true);
    const face=flow.actorFor("S2")!.getTransform().getWorldPosition().add(new vec3(0,140,0)),vector=new vec3(0,1,0),askedBefore=asks().length;
    const remove=kettle.onDragUpdate.add(()=>{const photo=findSceneObjectByName("RoomscriptPulledMemory");if(!photo||!photo.enabled)return;const d=face.sub(photo.getTransform().getWorldPosition()).uniformScale(.5);vector.x=d.x;vector.y=d.y;vector.z=d.z;});
    try{await hand.drag(kettle,vector,5000);}finally{remove();}
    await sleep(400);await done();const presented=asks().slice(askedBefore);
    console.log("RUN8_PRESENT|"+JSON.stringify(presented));expect(presented.length).toBe(1);expect(presented[0].suspect).toBe("S2");
    // 2. Point at Okafor while facing Vale.
    await tap("Question S2");const pointedBefore=asks().length;await tap("RoomscriptAccuse_S3");await sleep(300);await done();
    const pointed=asks().slice(pointedBefore);console.log("RUN8_POINT|"+JSON.stringify(pointed));
    expect(pointed.length).toBe(1);expect(pointed[0].suspect).toBe("S2");
  }
}
