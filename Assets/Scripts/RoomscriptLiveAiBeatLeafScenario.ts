import {buildKnowledgeBrief,admitWrenChoice} from "./Engine/game/WrenKnowledge";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptMain} from "./RoomscriptMain";
import {replayGame} from "./Engine/game/Reducer";
import {canonicalJson} from "./Engine/core/CanonicalJson";
import {GameState} from "./Engine/core/Types";

/** Production live adapters in Stage: one free suspect question and knowledge-only Wren.
 * This is a runtime acceptance gate, not a typed-input/hand-route or continuous video.
 */
@component export class RoomscriptLiveAiBeatLeafScenario extends Scenario {
  async run():Promise<void>{
    await sleep(1000);
    const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const main=findSceneObjectByName("Roomscript").getComponent(RoomscriptMain.getTypeName()) as RoomscriptMain;
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
      // Seed one certified object memory so Wren's answer is useful, without exposing hidden truth.
      engine.dispatch({type:"PinchObject",object:"O11"});const known=engine.snapshot().knowledge,from=engine.snapshot().lastSeq;
      const narrationBefore=main.audio.narrativeDiagnostics();await main.askWren("What do we know?");
      const state=engine.snapshot(),wrenActions=state.log.filter(a=>a.seq>from),wrenRaw=wrenActions.findIndex(a=>a.type==="LlmOutput"&&a.source==="live"),wrenLine=wrenActions.findIndex(a=>a.type==="WrenSpoken");
      expect(wrenRaw>=0&&wrenLine>wrenRaw).toBe(true);
      const rawChoice=wrenActions[wrenRaw];if(rawChoice.type!=="LlmOutput")throw new Error("Missing Wren raw response");
      const admittedChoice=admitWrenChoice(buildKnowledgeBrief(graph,known),JSON.parse(rawChoice.response.content));expect(!!admittedChoice).toBe(true);
      const chosenAction=wrenActions[wrenLine];expect(chosenAction.type==="WrenSpoken"&&chosenAction.optionId===admittedChoice!.id).toBe(true);
      const event=state.events.find(e=>e.seq>from&&e.type==="wrenSpoken");expect(!!event?.text).toBe(true);
      expect(event!.refs!.every(id=>known.factIds.includes(id)||known.statementIds.includes(id))).toBe(true);expect(canonicalJson(state.knowledge)).toBe(canonicalJson(known));
      const narrationAfter=main.audio.narrativeDiagnostics();expect(narrationAfter.played>narrationBefore.played||narrationAfter.fallback>narrationBefore.fallback).toBe(true);
      expect(canonicalJson(engine.graphRef())).toBe(truth);expect(canonicalJson(replayGame(graph,state.log))).toBe(canonicalJson(state));
      const withoutPerformance=state.log.filter(a=>!["LlmOutput","LineSpoken","WrenSpoken","PlayerMoved"].includes(a.type)).map((a,i)=>({...a,seq:i+1}));
      expect(canonicalJson(gameplay(replayGame(graph,withoutPerformance)))).toBe(canonicalJson(gameplay(state)));
      expect(client.stageMode).toBe(true);
      console.log("LIVE_AI_BEAT_CHECK|"+JSON.stringify({caseId:graph.caseId,suspect:flow.diagnostics(),suspectAudio:afterAudio,suspectLiveSpeech:flow.tts.liveDiagnostics(),wrenText:event!.text,wrenRefs:event!.refs,wrenAudio:main.audio.liveSpeechDiagnostics(),narration:narrationAfter,graph,log:state.log}));
    }finally{flow.cancel();client.stageMode=oldStage;client.forceOffline=oldOffline;engine.configurePreset();opening.finish();}
  }
}
