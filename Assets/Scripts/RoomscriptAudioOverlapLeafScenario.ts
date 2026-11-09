import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
/** Real bundled speech, caption ownership, deferred selection, and native overlap. */
@component export class RoomscriptAudioOverlapLeafScenario extends Scenario {
  async run():Promise<void>{await enterCase();await sleep(600);
    const flow=findSceneObjectByName("RoomscriptInterrogation").getComponent(RoomscriptInterrogationController.getTypeName()) as RoomscriptInterrogationController,audio=RoomscriptAudio.active;
    const oldOffline=flow.client.forceOffline,oldMute=audio.speechMuted(),overallDeadline=Date.now()+540000;
    const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const actors=opening.cast.actors(),cameras=actors.map(a=>a.camera),eye=global.scene.createSceneObject("AudioWalkAwayEye");eye.getTransform().setWorldPosition(cameras[0].getTransform().getWorldPosition());eye.getTransform().setWorldRotation(cameras[0].getTransform().getWorldRotation());actors.forEach(a=>a.camera=eye);
    const boundedIdle=async()=>{while((flow.diagnostics().busy||audio.speechBusy()||audio.speech.diagnostics().queued)&&Date.now()<overallDeadline){const active=audio.speech.diagnostics().active;if(active?.text)expect(flow.subtitles.fullText()).toBe(active.text);await sleep(50);}expect(Date.now()<overallDeadline).toBe(true);};
    try{await audio.speech.idle();audio.silence(false);flow.client.forceOffline=true;flow.selectSuspect("S2");
    const baseline=audio.speechDiagnostics().events.length,clips=flow.tts.playbackAudit().finishedClips;
    const answer=flow.askChip("where@22:30");let requested=false,samples=0;const deadline=Date.now()+90000;let captionMismatch=0;
    while(Date.now()<deadline){await sleep(50);const active=audio.speechDiagnostics().active;
      if(active){samples++;if(active.text&&flow.subtitles.fullText()!==active.text){captionMismatch++;console.log("CAPTION_MISMATCH|"+JSON.stringify({active:active.text,caption:flow.subtitles.fullText()}));}
        expect(flow.row.diagnostics().visible).toBe(false);
        if(active.role==="suspect"&&!requested){requested=true;
          // Real item pinches during an answer must queue observations without ending the speaker.
          const hand=new DefaultLeafInteractor();
          for(const id of ["O1","O13"]){const target=findInteractablesByName("RoomscriptObject_"+id,undefined,true);expect(target.length).toBe(1);await hand.trigger(target[0]);}
          eye.getTransform().setWorldPosition(eye.getTransform().getWorldPosition().add(new vec3(0,0,800)));opening.cast.clearPreviewFocus();flow.selectSuspect("S1");expect(flow.diagnostics().suspect).toBe("S2");void audio.narrate("NARRATOR","Tonight, this room is Harlow's study.");}}
      if(requested&&!flow.diagnostics().busy&&!active&&audio.speechDiagnostics().queued===0)break;
    }
    await answer;await sleep(200);expect(requested).toBe(true);expect(samples).toBeGreaterThan(0);expect(captionMismatch).toBe(0);
    expect(flow.diagnostics().suspect).toBe("S1");expect(audio.speechDiagnostics().nativeOverlapFrames).toBe(0);expect(flow.tts.playbackAudit().earlyEnds).toBe(0);expect(flow.tts.playbackAudit().finishedClips).toBeGreaterThan(clips);
    expect(flow.tts.playbackAudit().lastClipSeconds>=flow.tts.playbackAudit().lastClipDuration-.45).toBe(true);
    expect(audio.narrationEvidence("NARRATOR","Collar fibres, caught in the braid. I don't like that.").completed).toBeGreaterThan(0);
    expect(audio.narrationEvidence("NARRATOR","Harlow was going to expose Vale's forged accounts.").completed).toBeGreaterThan(0);
    actors.forEach((a,i)=>a.camera=cameras[i]);
    // Wren uses the same caption channel; dialogue advances one aligned speaker at a time.
    const wren=audio.hint("What did Harlow leave us?",new vec3(0,0,70));
    expect(wren).toBe(true);await sleep(100);
    const busyWren=audio.hint("Who benefits?",new vec3(0,0,70));expect(busyWren).toBe(false);
    await boundedIdle();
    expect(audio.narrationEvidence("WREN","What did Harlow leave us?").completed).toBeGreaterThan(0);
    expect(audio.dialogue("ArrivalDialogue",flow.engine.graphRef(),flow.engine.snapshot())).toBe(true);
    await boundedIdle();
    // Submit both intents while a real answer owns speech. Show must break the
    // old claim once, then the queued Ask must hear the newly admitted account.
    flow.selectSuspect("S2");flow.engine.dispatch({type:"PinchObject",object:"O11"});const from=flow.engine.snapshot().lastSeq,pips=flow.engine.snapshot().pips;
    const first=flow.askChip("where@22:30");while(audio.speech.diagnostics().active?.role!=="suspect"&&Date.now()<overallDeadline)await sleep(25);expect(Date.now()<overallDeadline).toBe(true);
    const shown=flow.presentObjectTo("S2","O11"),again=flow.askChip("where@22:30");let settled=false;const queued=Promise.all([first,shown,again]).then(()=>{settled=true;});
    while(!settled&&Date.now()<overallDeadline){const active=audio.speech.diagnostics().active;if(active?.text)expect(flow.subtitles.fullText()).toBe(active.text);await sleep(50);}expect(settled).toBe(true);await queued;await boundedIdle();
    const route=flow.engine.snapshot().log.filter(a=>a.seq>from&&(a.type==="Ask"||a.type==="Object"));expect(JSON.stringify(route.map(a=>a.type))).toBe(JSON.stringify(["Ask","Object","Ask"]));
    expect(flow.engine.snapshot().suspects.S2.layer).toBe(1);expect(flow.engine.snapshot().activeStatement).toBe("C_VALE_ALIBI_1");expect(flow.engine.snapshot().pips).toBe(pips);
    expect(flow.engine.snapshot().events.filter(e=>e.seq>from&&e.type==="objectionCorrect").length).toBe(1);
    console.log("QUEUED_SHOW_ASK_CHECK|"+JSON.stringify({route,layer:flow.engine.snapshot().suspects.S2.layer,pips,walkingAwayCm:800}));
    expect(audio.speechDiagnostics().nativeOverlapFrames).toBe(0);
    const debtText="Imran's signature. This came from Harlow's coat.",debtBefore=audio.narrationEvidence("NARRATOR",debtText).completed;
    await audio.narrate("NARRATOR",debtText);await boundedIdle();expect(audio.narrationEvidence("NARRATOR",debtText).completed).toBeGreaterThan(debtBefore);expect(audio.speechDiagnostics().nativeEarlyEnds).toBe(0);
    const events=audio.speechDiagnostics().events.slice(baseline);let active=0;for(const e of events){if(e.type==="start")active++;if(e.type==="end"){active--;expect(e.reason).toBe("completed");}expect(active>=0&&active<=1).toBe(true);}expect(active).toBe(0);
    console.log("AUDIO_OVERLAP_CHECK|"+JSON.stringify({samples,captionMismatch,nativeOverlapFrames:audio.speechDiagnostics().nativeOverlapFrames,earlyEnds:flow.tts.playbackAudit().earlyEnds,events}));
    }finally{actors.forEach((a,i)=>a.camera=cameras[i]);if(!isNull(eye))eye.destroy();flow.client.forceOffline=oldOffline;audio.silence(oldMute);}
  }
}
