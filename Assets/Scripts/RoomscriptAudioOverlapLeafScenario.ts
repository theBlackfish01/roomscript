import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptAudio} from "./RoomscriptAudio";
/** Real bundled speech, caption ownership, deferred selection, and native overlap. */
@component export class RoomscriptAudioOverlapLeafScenario extends Scenario {
  async run():Promise<void>{await enterCase();await sleep(600);
    const flow=findSceneObjectByName("RoomscriptInterrogation").getComponent(RoomscriptInterrogationController.getTypeName()) as RoomscriptInterrogationController,audio=RoomscriptAudio.active;
    await audio.speech.idle();flow.client.forceOffline=true;flow.selectSuspect("S2");
    const baseline=audio.speechDiagnostics().events.length,clips=flow.tts.playbackAudit().finishedClips;
    const answer=flow.askChip("where@22:30");let requested=false,samples=0;const deadline=Date.now()+90000;let captionMismatch=0;
    while(Date.now()<deadline){await sleep(50);const active=audio.speechDiagnostics().active;
      if(active){samples++;if(active.text&&flow.subtitles.fullText()!==active.text){captionMismatch++;console.log("CAPTION_MISMATCH|"+JSON.stringify({active:active.text,caption:flow.subtitles.fullText()}));}
        expect(flow.row.diagnostics().visible).toBe(false);
        if(active.role==="suspect"&&!requested){requested=true;flow.selectSuspect("S1");expect(flow.diagnostics().suspect).toBe("S2");void audio.narrate("NARRATOR","Tonight, this room is Harlow's study.");}}
      if(requested&&!flow.diagnostics().busy&&!active&&audio.speechDiagnostics().queued===0)break;
    }
    await answer;await sleep(200);expect(requested).toBe(true);expect(samples).toBeGreaterThan(0);expect(captionMismatch).toBe(0);
    expect(flow.diagnostics().suspect).toBe("S1");expect(audio.speechDiagnostics().nativeOverlapFrames).toBe(0);expect(flow.tts.playbackAudit().earlyEnds).toBe(0);expect(flow.tts.playbackAudit().finishedClips).toBeGreaterThan(clips);
    // Wren uses the same caption channel; dialogue advances one aligned speaker at a time.
    const wren=audio.hint("What did Harlow leave us?",new vec3(0,0,70));
    expect(wren).toBe(true);await sleep(100);
    const busyWren=audio.hint("Who benefits?",new vec3(0,0,70));expect(busyWren).toBe(false);
    while(audio.speechBusy()){const active=audio.speech.diagnostics().active;if(active?.text)expect(flow.subtitles.fullText()).toBe(active.text);await sleep(50);}
    expect(audio.narrationEvidence("WREN","What did Harlow leave us?").completed).toBeGreaterThan(0);
    expect(audio.dialogue("ArrivalDialogue",flow.engine.graphRef(),flow.engine.snapshot())).toBe(true);
    while(audio.speechBusy()||audio.speech.diagnostics().queued){const active=audio.speech.diagnostics().active;if(active?.text)expect(flow.subtitles.fullText()).toBe(active.text);await sleep(50);}
    expect(audio.speechDiagnostics().nativeOverlapFrames).toBe(0);
    const events=audio.speechDiagnostics().events.slice(baseline);let active=0;for(const e of events){if(e.type==="start")active++;if(e.type==="end"){active--;expect(e.reason).toBe("completed");}expect(active>=0&&active<=1).toBe(true);}expect(active).toBe(0);
    console.log("AUDIO_OVERLAP_CHECK|"+JSON.stringify({samples,captionMismatch,nativeOverlapFrames:audio.speechDiagnostics().nativeOverlapFrames,earlyEnds:flow.tts.playbackAudit().earlyEnds,events}));
  }
}
