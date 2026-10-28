import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptCaseCrate} from "./RoomscriptCaseCrate";

@component export class RoomscriptStagingLeafScenario extends Scenario {
  async run():Promise<void> {
    await sleep(1800);
    const camera=findSceneObjectByName("Camera Object").getTransform().getWorldPosition();
    const actor=findSceneObjectByName("RoomscriptSuspectSlot"),mark=actor.getTransform().getWorldPosition();
    const range=Math.sqrt((mark.x-camera.x)**2+(mark.z-camera.z)**2);
    console.log("STAGING_RANGE|"+range);expect(range>=130&&range<=200).toBe(true);
    expect(findSceneObjectByName("RoomscriptCaseLidUI").getParent().name).toBe("CrateLid");
    expect(findSceneObjectByName("RoomscriptSubtitleUI").getParent().name).toBe("RoomscriptSuspectSlot");
    const crate=findSceneObjectByName("RoomscriptCrate").getComponent(RoomscriptCaseCrate.getTypeName()) as RoomscriptCaseCrate;
    expect(crate.isAnimating()).toBe(false);
    const textIn=(root:SceneObject):Text|null=>{const own=root.getComponent("Component.Text") as Text;if(own)return own;for(let i=0;i<root.getChildrenCount();i++){const found=textIn(root.getChild(i));if(found)return found;}return null;};
    const rows:unknown[]=[];
    for(const name of ["Study plaque","Lounge plaque","Hall plaque","Kitchen plaque","Conservatory plaque"]) {
      const root=findSceneObjectByName(name),text=textIn(root)!;expect(!!text).toBe(true);
      const bounds=text.getBoundingBox(),height=(bounds.top-bounds.bottom)*text.getTransform().getWorldScale().y;
      const distance=root.getTransform().getWorldPosition().distance(camera),degrees=2*Math.atan(height/(2*distance))*180/Math.PI;
      console.log("STAGING_PLAQUE|"+JSON.stringify({name,degrees,height,distance}));expect(degrees>=1&&degrees<=1.5).toBe(true);rows.push({name,degrees});
    }
    console.log("STAGING_CHECK|"+JSON.stringify({suspectRangeCm:range,plaques:rows,lidHud:true,idleAnimation:false}));
  }
}
