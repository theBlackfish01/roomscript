import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {replayGame} from "./Engine/game/Reducer";
import {canonicalJson} from "./Engine/core/CanonicalJson";
import {GameState} from "./Engine/core/Types";

/** Production live adapter in Stage: one typed free suspect question.
 * This is a runtime acceptance gate, not a typed-input/hand-route or continuous video.
 */
@component export class RoomscriptLiveAiBeatLeafScenario extends Scenario {
  async run():Promise<void>{
    await sleep(1000);
    const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const flow=opening.cast.flow,engine=flow.engine,client=flow.client,oldStage=client.stageMode,oldOffline=client.forceOffline;
    const gameplay=(s:GameState)=>({knowledge:s.knowledge,elapsedMinutes:s.elapsedMinutes,pips:s.pips,grid:s.grid,beats:s.beatsFired,arguments:s.arguments,verdict:s.verdict,accusation:s.accusation,
      suspects:Object.keys(s.suspects).map(id=>{const p=s.suspects[id];return {id,layer:p.layer,composure:p.composure,rapport:p.rapport,respect:p.respect,topicOverrides:p.topicOverrides};})});
    try{
      client.stageMode=true;client.forceOffline=false;engine.configurePreset();opening.finish();await sleep(400);
      expect(client.canAnswerFree()).toBe(true);const graph=engine.graphRef(),truth=canonicalJson(graph);flow.selectSuspect("S2");
      const before=engine.snapshot().lastSeq,audioBefore=flow.tts.diagnostics();
      await flow.askFree("Where were you at 22:30?","where@22:30");
      const actions=engine.snapshot().log.filter(a=>a.seq>before),raw=actions.findIndex(a=>a.type==="LlmOutput"&&a.source==="live"),spoken=actions.findIndex(a=>a.type==="LineSpoken"&&a.mode!=="filler");
      expect(raw>=0&&spoken>raw).toBe(true);expect(flow.diagnostics().last?.origin).toBe("model");
      const afterAudio=flow.tts.diagnostics();expect(afterAudio.played>audioBefore.played||afterAudio.fallback>audioBefore.fallback).toBe(true);
      const state=engine.snapshot();
      expect(canonicalJson(engine.graphRef())).toBe(truth);expect(canonicalJson(replayGame(graph,state.log))).toBe(canonicalJson(state));
      const withoutPerformance=state.log.filter(a=>!["LlmOutput","LineSpoken","WrenSpoken","PlayerMoved"].includes(a.type)).map((a,i)=>({...a,seq:i+1}));
      expect(canonicalJson(gameplay(replayGame(graph,withoutPerformance)))).toBe(canonicalJson(gameplay(state)));
      expect(client.stageMode).toBe(true);
      console.log("LIVE_AI_BEAT_CHECK|"+JSON.stringify({caseId:graph.caseId,suspect:flow.diagnostics(),suspectAudio:afterAudio,suspectLiveSpeech:flow.tts.liveDiagnostics(),graph,log:state.log}));
    }finally{flow.cancel();client.stageMode=oldStage;client.forceOffline=oldOffline;engine.configurePreset();opening.finish();}
  }
}
