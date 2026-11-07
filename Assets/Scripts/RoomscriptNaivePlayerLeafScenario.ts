import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {RoomscriptRun10LeafDriver} from "./RoomscriptRun10LeafDriver";
import {replayGame} from "./Engine/game/Reducer";
/** Fresh-case one-pinch route with full-play audio/caption audit.
 * Scripted discoverability evidence, not a human usability study.
 * Solver reads collected knowledge. No gameplay dispatches, drags or holds.
 */
@component export class RoomscriptNaivePlayerLeafScenario extends Scenario {
 async run():Promise<void>{await sleep(700);const d=new RoomscriptRun10LeafDriver(),started=getTime(),oldOffline=d.flow.client.forceOffline,oldMute=d.audio.speechMuted();
  d.opening.setFilmMode(true);d.flow.client.forceOffline=true;d.audio.silence(false);const calls=d.flow.client.requestCount();let sampling=true,samples=0,captionMismatch=0,firstAnswerSeconds=0;
  const sampler=(async()=>{while(sampling&&Date.now()<d.deadline){const active=d.audio.speech.diagnostics().active;if(active?.text){samples++;if(d.flow.subtitles.fullText()!==active.text){captionMismatch++;console.log("FULLPLAY_CAPTION_MISMATCH|"+JSON.stringify({active:active.text,caption:d.flow.subtitles.fullText()}));}}await sleep(30);}})();
  try{
   expect(d.engine.mode()).toBe("preset");expect(d.engine.snapshot().verdict).toBe(null);expect(d.engine.graphRef().caseId.endsWith(":run10")).toBe(true);
   await d.open();expect(d.opening.controlsHintVisible()).toBe(false);expect(d.opening.cast.actors().every(a=>a.getSceneObject().enabled)).toBe(true);
   await d.ask();firstAnswerSeconds=getTime()-started;
   await d.find("O11");await d.show("O11");expect(d.engine.snapshot().suspects.S2.layer).toBe(1);
   await d.find("O12");await d.show("O12");expect(d.engine.snapshot().suspects.S2.layer).toBe(2);
   for(const id of ["O1","O2","O3","O4","O5","O13","O14","O15"])await d.find(id);
   await d.prepareAccusation();await d.tap("Break seal");expect(d.engine.snapshot().verdict).toBe("correct");
   await d.waitUntil(()=>{const paper=findSceneObjectByName("RoomscriptNewspaper");return !!paper&&paper.enabled;},"newspaper");await d.speechIdle();
   expect(findInteractablesByName("Another case",undefined,true).length).toBe(1);
   expect(d.actions.length<=40).toBe(true);expect(d.engine.snapshot().pips).toBe(5);expect(d.flow.client.requestCount()).toBe(calls);
   const state=d.engine.snapshot();expect(JSON.stringify(replayGame(d.engine.graphRef(),state.log))).toBe(JSON.stringify(state));
   expect(state.log.some(a=>["Suggest","CallLiar","Press","UseHunch"].includes(a.type))).toBe(false);
   expect(state.log.some(a=>a.type==="Ask"&&a.topic.startsWith("baseline:"))).toBe(false);
   expect(samples).toBeGreaterThan(0);expect(captionMismatch).toBe(0);expect(d.audio.speechDiagnostics().nativeOverlapFrames).toBe(0);expect(d.audio.speechDiagnostics().nativeEarlyEnds).toBe(0);expect(d.flow.tts.playbackAudit().earlyEnds).toBe(0);
   let active=0;const events=d.audio.speechDiagnostics().events;for(const event of events){if(event.type==="start")active++;if(event.type==="end"){active--;expect(["completed","ending","case-change"].includes(event.reason||"")).toBe(true);}expect(active>=0&&active<=1).toBe(true);}expect(active).toBe(0);
   console.log("NAIVE_PLAYER_CHECK|"+JSON.stringify({actions:d.actions.length,limit:40,firstAnswerSeconds,verdict:state.verdict,minutes:state.elapsedMinutes,route:d.actions,drags:0,holds:0}));
   console.log("FULLPLAY_AUDIO_CHECK|"+JSON.stringify({samples,captionMismatch,overlap:d.audio.speechDiagnostics().nativeOverlapFrames,earlyEnds:d.flow.tts.playbackAudit().earlyEnds,narratorEarlyEnds:d.audio.speechDiagnostics().nativeEarlyEnds,events}));
   console.log("NAIVE_PLAYER_ACTION_TAPE|"+JSON.stringify(state.log));
   console.log("HERO_DEMO_GRAPH|"+JSON.stringify(d.engine.graphRef()));
   console.log("HERO_DEMO_ACTION_TAPE|"+JSON.stringify(state.log));
  }finally{sampling=false;await sampler;d.flow.client.forceOffline=oldOffline;d.audio.silence(oldMute);}
 }
}
