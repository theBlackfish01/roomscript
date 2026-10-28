/** Cue playback only. No case clock or truth state; all assets are CLAD synthesized. */
@component export class RoomscriptAudio extends BaseScriptComponent {
  @input @hint("Interactive sound volume") @widget(new SliderWidget(0,1,0.05)) sfxVolume:number=0.45;
  @input @hint("Quiet background music volume") @widget(new SliderWidget(0,0.5,0.01)) musicVolume:number=0.10;
  private sfx:AudioComponent;private music:AudioComponent;private cueIndex=0;
  private clips:Record<string,AudioTrackAsset>={
    Knock:requireAsset("../GeneratedSFX/Knock.wav") as AudioTrackAsset,
    TapeZip:requireAsset("../GeneratedSFX/TapeZip.wav") as AudioTrackAsset,
    CrateThud:requireAsset("../GeneratedSFX/CrateThud.wav") as AudioTrackAsset,
    ClockTick:requireAsset("../GeneratedSFX/ClockTick.wav") as AudioTrackAsset,
    Tink:requireAsset("../GeneratedSFX/Tink.wav") as AudioTrackAsset,
    Shing:requireAsset("../GeneratedSFX/Shing.wav") as AudioTrackAsset,
    Objection:requireAsset("../GeneratedSFX/Objection.wav") as AudioTrackAsset,
    Ratchet:requireAsset("../GeneratedSFX/Ratchet.wav") as AudioTrackAsset,
    Chime:requireAsset("../GeneratedSFX/Chime.wav") as AudioTrackAsset,
    ChalkScratch:requireAsset("../GeneratedSFX/ChalkScratch.wav") as AudioTrackAsset
  };
  onAwake():void {this.sfx=this.getSceneObject().createComponent("Component.AudioComponent") as AudioComponent;
    this.music=this.getSceneObject().createComponent("Component.AudioComponent") as AudioComponent;
    this.music.audioTrack=requireAsset("../GeneratedSFX/BackgroundMusic.wav") as AudioTrackAsset;
    this.createEvent("OnStartEvent").bind(()=>{this.sfx.playbackMode=Audio.PlaybackMode.LowLatency;this.music.playbackMode=Audio.PlaybackMode.LowPower;
      this.music.volume=this.musicVolume;this.music.play(-1);});}
  play(name:string):void {if(!this.clips[name])return;if(this.sfx.audioTrack && this.sfx.isPlaying())this.sfx.stop(false);this.sfx.audioTrack=this.clips[name];this.sfx.volume=this.sfxVolume;this.sfx.play(1);}
  previewNext():string {const names=Object.keys(this.clips),name=names[this.cueIndex++%names.length];this.play(name);return name;}
}
