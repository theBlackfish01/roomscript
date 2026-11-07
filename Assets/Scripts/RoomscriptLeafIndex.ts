import {RoomscriptRun10DirectorLeafScenario} from "./RoomscriptRun10DirectorLeafScenario";
import {RoomscriptRun10BoundaryLeafScenario} from "./RoomscriptRun10BoundaryLeafScenario";
import {RoomscriptAudioOverlapLeafScenario} from "./RoomscriptAudioOverlapLeafScenario";
import {RoomscriptRowStabilityLeafScenario} from "./RoomscriptRowStabilityLeafScenario";
import {RoomscriptNextGlowLeafScenario} from "./RoomscriptNextGlowLeafScenario";
import {RoomscriptProductionStudyLeafScenario} from "./RoomscriptProductionStudyLeafScenario";
import {RoomscriptBundledVoiceLeafScenario} from "./RoomscriptBundledVoiceLeafScenario";
import {RoomscriptOpeningLeafScenario} from "./RoomscriptOpeningLeafScenario";
import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata";
import {RoomscriptProbeLeafScenario} from "./RoomscriptProbeLeafScenario";
import {RoomscriptProbeIKScenario} from "./RoomscriptProbeIKScenario";
import {RoomscriptEngineLeafScenario} from "./RoomscriptEngineLeafScenario";
import {RoomscriptActorLeafScenario} from "./RoomscriptActorLeafScenario";
import {RoomscriptAiLeafScenario} from "./RoomscriptAiLeafScenario";
import {RoomscriptLatencyLeafScenario} from "./RoomscriptLatencyLeafScenario";
import {RoomscriptFallbackLeafScenario} from "./RoomscriptFallbackLeafScenario";
import {RoomscriptSpeechLeafScenario} from "./RoomscriptSpeechLeafScenario";
import {RoomscriptBindingLeafScenario} from "./RoomscriptBindingLeafScenario";
import {RoomscriptInterrogationLeafScenario} from "./RoomscriptInterrogationLeafScenario";
import {RoomscriptLiveInterrogationLeafScenario} from "./RoomscriptLiveInterrogationLeafScenario";
import {RoomscriptTellsLeafScenario} from "./RoomscriptTellsLeafScenario";
import {RoomscriptCastLeafScenario} from "./RoomscriptCastLeafScenario";
import {RoomscriptClosingLeafScenario} from "./RoomscriptClosingLeafScenario";
import {RoomscriptNaivePlayerLeafScenario} from "./RoomscriptNaivePlayerLeafScenario";
import {RoomscriptActorPoseCaptureLeafScenario} from "./RoomscriptActorPoseCaptureLeafScenario";
import {RoomscriptContinuousCaptureLeafScenario} from "./RoomscriptContinuousCaptureLeafScenario";
import {RoomscriptLiveAiBeatLeafScenario} from "./RoomscriptLiveAiBeatLeafScenario";

@component
export class RoomscriptLeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id:"roomscript-run10-boundaries",typename:RoomscriptRun10BoundaryLeafScenario.getTypeName()},
    {id:"roomscript-run10-director",typename:RoomscriptRun10DirectorLeafScenario.getTypeName(),parameters:{beat:"row",hold:"15",suspect:"S2"}},
    {id:"roomscript-audio-overlap",typename:RoomscriptAudioOverlapLeafScenario.getTypeName()},
    {id:"roomscript-row-stability",typename:RoomscriptRowStabilityLeafScenario.getTypeName()},
    {id:"roomscript-actor-pose-capture",typename:RoomscriptActorPoseCaptureLeafScenario.getTypeName(),parameters:{suspect:"S2",pose:"neutral",audit:"true"}},
    {id:"roomscript-continuous-capture",typename:RoomscriptContinuousCaptureLeafScenario.getTypeName(),parameters:{seconds:"5",input:"default",source:"capture",quiet:"true",backdrop:"false",targetWidth:"0"}},
    {id:"roomscript-live-ai-beat",typename:RoomscriptLiveAiBeatLeafScenario.getTypeName()},
    {id:"roomscript-naive-player",typename:RoomscriptNaivePlayerLeafScenario.getTypeName()},
    {id:"roomscript-next-glow",typename:RoomscriptNextGlowLeafScenario.getTypeName(),parameters:{hold:"0"}},
    {id:"roomscript-bundled-voices",typename:RoomscriptBundledVoiceLeafScenario.getTypeName()},
    {id:"roomscript-production-study",typename:RoomscriptProductionStudyLeafScenario.getTypeName(),parameters:{start:"0"}},
    {id:"roomscript-opening",typename:RoomscriptOpeningLeafScenario.getTypeName()},
    {id:"roomscript-closing",typename:RoomscriptClosingLeafScenario.getTypeName(),parameters:{mode:"correct"}},
    {id:"roomscript-cast",typename:RoomscriptCastLeafScenario.getTypeName()},
    {id: "roomscript-probe-layout-and-button", typename: RoomscriptProbeLeafScenario.getTypeName()},
    {id: "roomscript-probe-ik-reach", typename: RoomscriptProbeIKScenario.getTypeName()},
    {id: "roomscript-engine-bridge", typename: RoomscriptEngineLeafScenario.getTypeName()},
    {id: "roomscript-suspect-actor", typename: RoomscriptActorLeafScenario.getTypeName()},
    {id: "roomscript-ai-record-replay", typename: RoomscriptAiLeafScenario.getTypeName()},
    {id: "roomscript-live-latency", typename: RoomscriptLatencyLeafScenario.getTypeName()},
    {id: "roomscript-openai-fallback", typename: RoomscriptFallbackLeafScenario.getTypeName()},
    {id: "roomscript-speech-budget", typename: RoomscriptSpeechLeafScenario.getTypeName()},
    {id: "roomscript-room-binding", typename: RoomscriptBindingLeafScenario.getTypeName()},
    {id: "roomscript-interrogation", typename: RoomscriptInterrogationLeafScenario.getTypeName()},
    {id: "roomscript-live-interrogation", typename: RoomscriptLiveInterrogationLeafScenario.getTypeName()},
    {id: "roomscript-tells", typename: RoomscriptTellsLeafScenario.getTypeName()},
  ];
}
