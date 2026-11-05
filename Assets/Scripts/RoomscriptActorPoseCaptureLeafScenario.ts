import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,nextFrame} from "Leaf.lspkg/Utils/common/Utils";
import {enterCase} from "./RoomscriptLeafSetup";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
/** Director-only texture/pose audit. Leaves the requested actor pose held for a screenshot. */
@component export class RoomscriptActorPoseCaptureLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void>{
    await enterCase();const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const actors=opening.cast.actors(),engine=opening.cast.flow.engine,poses=["neutral","listening","rattled","broken","smug"] as const;
    const suspect=config?.get("suspect")||"S2",pose=config?.get("pose")||"neutral";
    expect(actors.length).toBe(4);expect(actors.some(actor=>actor.suspect===suspect)).toBe(true);expect(poses.includes(pose as typeof poses[number])).toBe(true);
    const fingerprint=()=>{const state=engine.snapshot();return JSON.stringify({knowledge:state.knowledge,suspects:state.suspects,verdict:state.verdict,elapsed:state.elapsedMinutes,arguments:state.arguments,activeStatement:state.activeStatement});};
    const before=fingerprint(),checks:{suspect:string;pose:string;texture:string}[]=[];
    for(const actor of (config?.get("audit")==="false"?[]:actors)){
      const textures=poses.map(key=>actor[key]);expect(textures.every(texture=>!!texture)).toBe(true);
      for(let i=0;i<textures.length;i++)for(let j=i+1;j<textures.length;j++)expect(textures[i].isSame(textures[j])).toBe(false);
      for(const key of poses){actor.capturePose(key,20);await nextFrame();expect(actor.diagnostics().pose).toBe(key);
        const visual=actor.getSceneObject().getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
        expect(!!visual).toBe(true);expect((visual.mainMaterial.mainPass.baseTex as Texture).isSame(actor[key])).toBe(true);
        checks.push({suspect:actor.suspect,pose:key,texture:actor[key].name});}
      actor.capturePose("neutral",.1);
    }
    expect(fingerprint()).toBe(before);
    const selected=actors.find(actor=>actor.suspect===suspect)!;selected.capturePose(pose,120);await nextFrame();expect(selected.diagnostics().pose).toBe(pose);
    console.log("ACTOR_POSE_CAPTURE|"+JSON.stringify({checked:checks.length,checks,selected:{suspect,pose},holdSeconds:120,presentationOnly:true}));
    // Do not sleep out the hold: main captures immediately after LEAF returns.
  }
}
