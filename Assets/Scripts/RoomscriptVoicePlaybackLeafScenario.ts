import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {sleep} from "Leaf.lspkg/Utils/common/Utils";
import {enterCase} from "./RoomscriptLeafSetup";
import {ROOMScriptRun10VoiceAssets} from "./RoomscriptRun10VoiceAssets";
import {RUN10_VOICE_MANIFEST} from "./Content/Run10VoiceManifest";
/** Guard every opening/item/dialogue voice against the native Preview decoder running fast. */
@component export class RoomscriptVoicePlaybackLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void>{
    await enterCase();
    const root=global.scene.createSceneObject("VoicePlaybackProbe");
    const player=root.createComponent("Component.AudioComponent") as AudioComponent;
    player.playbackMode=config?.get("mode")==="power"?Audio.PlaybackMode.LowPower:Audio.PlaybackMode.LowLatency;
    let finished=0;player.setOnFinish(()=>finished++);
    try{for(const record of RUN10_VOICE_MANIFEST){const track=ROOMScriptRun10VoiceAssets[record.index];
      player.audioTrack=track;const before=finished,started=Date.now();player.play(1);
      let maxPosition=0;while(finished===before&&Date.now()-started<15000){maxPosition=Math.max(maxPosition,player.position);await sleep(25);}
      const seconds=(Date.now()-started)/1000;
      console.log("VOICE_PLAYBACK_CHECK|"+JSON.stringify({id:record.id,seconds,duration:player.duration,maxPosition,finished:finished>before,playing:player.isPlaying()}));
      expect(finished>before).toBe(true);expect(player.isPlaying()).toBe(false);
      expect(seconds>=player.duration-.45).toBe(true);expect(seconds<player.duration+3).toBe(true);await sleep(300);
    }}finally{player.stop(false);root.destroy();}
  }
}
