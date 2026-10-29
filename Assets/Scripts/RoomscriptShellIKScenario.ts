import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar";
@component export class RoomscriptShellIKScenario extends Scenario {
  async run():Promise<void> { await enterCase();await sleep(1500);const ik=createIKInteractor();
    await ik.trigger(findInteractablesByName("Notebook",undefined,true)[0]);await sleep(350);
    expect(findSceneObjectByName("RoomscriptNotepadUI").enabled).toBe(true);
    await ik.trigger(findInteractablesByName("Close notebook",undefined,true)[0]);await sleep(350);
    expect(findSceneObjectByName("RoomscriptNotepadUI").enabled).toBe(false);
  }
}
