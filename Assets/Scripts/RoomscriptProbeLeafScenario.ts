// LEAF scenario pattern adapted from CLAD, Apache-2.0; see NOTICE.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout";

/** Regression: all rows initialize and backing plane does not block button dispatch. */
@component
export class RoomscriptProbeLeafScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500);
    const panel = findSceneObjectByName("RoomscriptProbeLab");
    expect(!!panel).toBe(true);
    const column = findSceneObjectByName("Probe column", panel);
    expect((column.getComponent(FlexLayout.getTypeName()) as FlexLayout).itemCount).toBe(10);
    const image = findSceneObjectByName("Generated image or camera", panel).getComponent("Component.Image") as Image;
    expect(image.getMaterialsCount()).toBe(1);
    expect(!!image.mainPass).toBe(true);
    let previousY = Infinity;
    for (const key of ["A", "B", "C", "D", "E", "F", "G"]) {
      const matches = findInteractablesByName("Probe " + key, undefined, true);
      expect(matches.length).toBe(1);
      const y = matches[0].getTransform().getWorldPosition().y;
      expect(previousY - y).toBeGreaterThan(4.3);
      previousY = y;
    }
    const status = findSceneObjectByName("Probe status", panel).getComponent("Component.Text") as Text;
    const before = status.text;
    await new DefaultLeafInteractor().trigger(findInteractablesByName("Probe D", undefined, true)[0]);
    await sleep(3500);
    expect(status.text).not.toBe(before);
    expect(status.text).toBe("P-d complete · results in Logger");
  }
}
