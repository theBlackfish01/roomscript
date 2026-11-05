import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {enterCase} from "./RoomscriptLeafSetup";
// CLAD live-lens-tester procedure; UI dispatch, geometry and audio are exercised in Preview.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {RoomscriptCaseCrate} from "./RoomscriptCaseCrate";

@component export class RoomscriptShellLeafScenario extends Scenario {
  async run():Promise<void> { await enterCase();
    await sleep(1500);const hand=new DefaultLeafInteractor();
    const tap=async(name:string)=>{const hits=findInteractablesByName(name,undefined,true);expect(hits.length).toBe(1);await hand.trigger(hits[0]);await sleep(250);};
    const notebook=findSceneObjectByName("RoomscriptNotepadUI"),wallet=findSceneObjectByName("RoomscriptEvidenceWalletUI");
    expect(notebook.enabled).toBe(false);expect(wallet.enabled).toBe(false);
    await tap("Notebook");expect(notebook.enabled).toBe(true);expect(findSceneObjectByName("RoomscriptChipBarUI").enabled).toBe(false);
    expect(findSceneObjectByName("RoomscriptCaseLidUI").enabled).toBe(false);
    await tap("Statements");await tap("Close notebook");expect(notebook.enabled).toBe(false);
    await tap("Evidence");expect(wallet.enabled).toBe(true);await tap("Close evidence");expect(wallet.enabled).toBe(false);
    const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;expect(findSceneObjectByName("PreviewRoom").enabled).toBe(global.deviceInfoSystem.isEditor()&&!opening.filmMode);
    for(const name of ["DeskTop","BedBase","StandinDoor","StandinWindow","CrateLid"]) {
      const visual=findSceneObjectByName(name).getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      expect(!!visual).toBe(true);expect(!!visual.mesh).toBe(true);expect(visual.getMaterialsCount()).toBe(1);
    }
    const audio=findSceneObjectByName("RoomscriptAudio").getComponent(RoomscriptAudio.getTypeName()) as RoomscriptAudio;
    const played:string[]=[];for(let i=0;i<10;i++){played.push(audio.previewNext());await sleep(100);}
    expect(new Set(played).size).toBe(10);
    const components=findSceneObjectByName("RoomscriptAudio").getComponents("Component.AudioComponent") as AudioComponent[];
    expect(components.some(a=>a.isPlaying())).toBe(true);
    const crate=findSceneObjectByName("RoomscriptCrate").getComponent(RoomscriptCaseCrate.getTypeName()) as RoomscriptCaseCrate;
    expect(crate.isAnimating()).toBe(false);crate.restart();expect(crate.isAnimating()).toBe(true);await sleep(50);const before=crate.hinge.getTransform().getLocalRotation();await sleep(1500);
    const after=crate.hinge.getTransform().getLocalRotation();expect(Math.abs(after.x-before.x)).toBeGreaterThan(0.1);expect(crate.isAnimating()).toBe(false);
    const labelFacing=findSceneObjectByName("Envelope WHO").getTransform().getWorldRotation().multiplyVec3(vec3.forward());
    expect(labelFacing.z).toBeGreaterThan(0.5);
  }
}
