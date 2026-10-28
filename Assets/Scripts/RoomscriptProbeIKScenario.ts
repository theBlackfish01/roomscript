import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar";

/** Physical reach/ray diagnostics for the middle button. */
@component
export class RoomscriptProbeIKScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500);
    const ik = createIKInteractor();
    await ik.trigger(findInteractablesByName("Probe D", undefined, true)[0]);
    await sleep(3500);
    const status = findSceneObjectByName("Probe status").getComponent("Component.Text") as Text;
    expect(status.text).toBe("P-d complete · results in Logger");
  }
}
