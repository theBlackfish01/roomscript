import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata";
import {RoomscriptProbeLeafScenario} from "./RoomscriptProbeLeafScenario";
import {RoomscriptProbeIKScenario} from "./RoomscriptProbeIKScenario";
import {RoomscriptShellLeafScenario} from "./RoomscriptShellLeafScenario";
import {RoomscriptShellIKScenario} from "./RoomscriptShellIKScenario";
import {RoomscriptEngineLeafScenario} from "./RoomscriptEngineLeafScenario";
import {RoomscriptActorLeafScenario} from "./RoomscriptActorLeafScenario";
import {RoomscriptAiLeafScenario} from "./RoomscriptAiLeafScenario";
import {RoomscriptLatencyLeafScenario} from "./RoomscriptLatencyLeafScenario";
import {RoomscriptFallbackLeafScenario} from "./RoomscriptFallbackLeafScenario";
import {RoomscriptSpeechLeafScenario} from "./RoomscriptSpeechLeafScenario";
import {RoomscriptBindingLeafScenario} from "./RoomscriptBindingLeafScenario";
import {RoomscriptInterrogationLeafScenario} from "./RoomscriptInterrogationLeafScenario";
import {RoomscriptLiveInterrogationLeafScenario} from "./RoomscriptLiveInterrogationLeafScenario";
import {RoomscriptStagingLeafScenario} from "./RoomscriptStagingLeafScenario";
import {RoomscriptTellsLeafScenario} from "./RoomscriptTellsLeafScenario";
import {RoomscriptObjectionLeafScenario} from "./RoomscriptObjectionLeafScenario";
import {RoomscriptClueLeafScenario} from "./RoomscriptClueLeafScenario";

@component
export class RoomscriptLeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id: "roomscript-probe-layout-and-button", typename: RoomscriptProbeLeafScenario.getTypeName()},
    {id: "roomscript-probe-ik-reach", typename: RoomscriptProbeIKScenario.getTypeName()},
    {id: "roomscript-shell-navigation", typename: RoomscriptShellLeafScenario.getTypeName()},
    {id: "roomscript-shell-ik-reach", typename: RoomscriptShellIKScenario.getTypeName()},
    {id: "roomscript-engine-bridge", typename: RoomscriptEngineLeafScenario.getTypeName()},
    {id: "roomscript-suspect-actor", typename: RoomscriptActorLeafScenario.getTypeName()},
    {id: "roomscript-ai-record-replay", typename: RoomscriptAiLeafScenario.getTypeName()},
    {id: "roomscript-live-latency", typename: RoomscriptLatencyLeafScenario.getTypeName()},
    {id: "roomscript-openai-fallback", typename: RoomscriptFallbackLeafScenario.getTypeName()},
    {id: "roomscript-speech-budget", typename: RoomscriptSpeechLeafScenario.getTypeName()},
    {id: "roomscript-room-binding", typename: RoomscriptBindingLeafScenario.getTypeName()},
    {id: "roomscript-interrogation", typename: RoomscriptInterrogationLeafScenario.getTypeName()},
    {id: "roomscript-live-interrogation", typename: RoomscriptLiveInterrogationLeafScenario.getTypeName()},
    {id: "roomscript-staging", typename: RoomscriptStagingLeafScenario.getTypeName()},
    {id: "roomscript-tells", typename: RoomscriptTellsLeafScenario.getTypeName()},
    {id: "roomscript-objection", typename: RoomscriptObjectionLeafScenario.getTypeName(),parameters:{capture:""}},
    {id: "roomscript-clue", typename: RoomscriptClueLeafScenario.getTypeName()}
  ];
}
