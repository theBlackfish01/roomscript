import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,nextFrame} from "Leaf.lspkg/Utils/common/Utils";
import {enterCase} from "./RoomscriptLeafSetup";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
/** Stage audio regression: every cast member, real playback, jaw, and zero network. */
@component export class RoomscriptBundledVoiceLeafScenario extends Scenario {
  async run():Promise<void>{await enterCase();const flow=findSceneObjectByName("RoomscriptInterrogation").getComponent(RoomscriptInterrogationController.getTypeName()) as RoomscriptInterrogationController;
    flow.client.stageMode=true;const calls=flow.client.requestCount();let lines=0,peak=0,maxStart=0;
    const remove=flow.tts.onAudioStarted.add(e=>{expect(e.voice.startsWith("bundle:")).toBe(true);maxStart=Math.max(maxStart,e.latencyMs);lines++;});
    try{for(const id of ["S1","S2","S3","S4"]){flow.selectSuspect(id);const old=flow.tts.diagnostics();let settled=false;const pending=flow.askChip("where@22:30").finally(()=>{settled=true;});let frames=0;
      // Requests enter an asynchronous intent queue before busy becomes true.
      while(!settled&&frames++<1200){await nextFrame();peak=Math.max(peak,flow.actor.diagnostics().jaw);}
      await pending;expect(flow.tts.diagnostics().played>old.played).toBe(true);expect(flow.tts.diagnostics().fallback).toBe(old.fallback);
      const audit=flow.tts.playbackAudit();expect(audit.lastClipSeconds>=audit.lastClipDuration-.45).toBe(true);
      console.log("SUSPECT_PLAYBACK_CHECK|"+JSON.stringify({id,...audit}));
    }expect(lines>=4).toBe(true);expect(peak>.3).toBe(true);expect(flow.client.requestCount()).toBe(calls);console.log("BUNDLED_VOICE_CHECK|"+JSON.stringify({lines,peak,maxStart,calls:flow.client.requestCount()-calls,fallback:flow.tts.diagnostics().fallback}));}
    finally{remove();flow.cancel();}
  }
}
