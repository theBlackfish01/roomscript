import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptTts} from "./RoomscriptTts";
import {CancellationSource} from "./Engine/ai/LlmPort";

/** Actual two-sentence audio, current-chip precache, offline playback and absolute deadline. */
@component export class RoomscriptSpeechLeafScenario extends Scenario {
  async run():Promise<void> { await enterCase();
    await sleep(1500);
    const tts=findSceneObjectByName("RoomscriptTts").getComponent(RoomscriptTts.getTypeName()) as RoomscriptTts;
    const started:Array<{text:string;latencyMs:number;voice:string;durationMs:number}>=[];
    const remove=tts.onAudioStarted.add(event=>started.push(event));
    try {
      const line="I was in the Kitchen making tea at 22:30. I was making tea in the Kitchen at 22:30.";
      const speech=tts.speak(line);await sleep(100);expect(tts.client.scheduler.activeCount).toBeGreaterThan(1);
      expect(await speech).toBe(true);expect(started.length).toBe(2);expect(started[0].voice).toBe("coral");
      const gap=started[1].latencyMs-started[0].latencyMs-started[0].durationMs;
      expect(gap<250).toBe(true);expect(started[0].latencyMs<=6500).toBe(true);
      expect(await tts.precacheCurrent()).toBeGreaterThan(0);expect(tts.cached("Let me think.")).toBe(true);
      tts.client.forceOffline=true;const hits=tts.diagnostics().hits;
      expect(await tts.speak("Let me think.")).toBe(true);expect(tts.diagnostics().hits).toBeGreaterThan(hits);
      tts.client.forceOffline=false;
      const before=tts.diagnostics().played;
      expect(await tts.speak("This uncached phrase is already past its deadline.",undefined,undefined,tts.client.clock.nowMs()-6500)).toBe(false);
      expect(tts.diagnostics().played).toBe(before);
      const source=new CancellationSource();const playback=tts.speak(line,undefined,source.token);await sleep(100);source.cancel();await playback;
      expect(tts.diagnostics().playing).toBe(false);
      console.log("SPEECH_CHECK|"+JSON.stringify({firstAudioMs:started[0].latencyMs,gapMs:gap,voice:started[0].voice,precache:true,offline:true,deadline:true,cancel:true}));
    } finally {remove();tts.client.forceOffline=false;tts.stop();}
  }
}
