import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata";
import {RoomscriptProbeLeafScenario} from "./RoomscriptProbeLeafScenario";
import {RoomscriptProbeIKScenario} from "./RoomscriptProbeIKScenario";
import {RoomscriptShellLeafScenario} from "./RoomscriptShellLeafScenario";
import {RoomscriptShellIKScenario} from "./RoomscriptShellIKScenario";

@component
export class RoomscriptLeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id: "roomscript-probe-layout-and-button", typename: RoomscriptProbeLeafScenario.getTypeName()},
    {id: "roomscript-probe-ik-reach", typename: RoomscriptProbeIKScenario.getTypeName()},
    {id: "roomscript-shell-navigation", typename: RoomscriptShellLeafScenario.getTypeName()},
    {id: "roomscript-shell-ik-reach", typename: RoomscriptShellIKScenario.getTypeName()}
  ];
}
