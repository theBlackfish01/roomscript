import {ROOMScriptCueAssets,ROOMScriptDialogueAssets} from "./RoomscriptVoiceAssets";
import {RoomscriptVoiceLibrary} from "./RoomscriptVoiceLibrary";
import {DIALOGUE_MANIFEST} from "./Content/DialogueManifest";
import {CaseGraph,GameState} from "./Engine/core/Types";
/** Presentation only. Dialogue fact gates read deterministic knowledge and verdict. */
@component export class RoomscriptAudio extends BaseScriptComponent {
  @input @hint("Interactive sound volume") @widget(new SliderWidget(0,1,0.05)) sfxVolume:number=0.45;
  @input @hint("Quiet background music volume") @widget(new SliderWidget(0,0.5,0.01)) musicVolume:number=0.10;
  static active:RoomscriptAudio;
  private music:AudioComponent;private tension:AudioComponent;private narration:AudioComponent;private cueIndex=0;private stress=0;private duck=1;private muted=false;private narrationRevision=0;
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
  private spatialPool:AudioComponent[]=[];private flatPool:AudioComponent[]=[];private tick:AudioComponent;private spatialIndex=0;private flatIndex=0;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>{
    RoomscriptAudio.active=this;this.clips=ROOMScriptCueAssets;
    const make=(name:string,spatial:boolean)=>{const root=global.scene.createSceneObject(name);root.setParent(this.getSceneObject());const audio=root.createComponent("Component.AudioComponent") as AudioComponent;audio.spatialAudio.enabled=spatial;audio.playbackMode=Audio.PlaybackMode.LowLatency;return audio;};
    this.spatialPool=Array.from({length:4},(_,i)=>make("RoomscriptSpatialAudio_"+i,true));
    this.flatPool=Array.from({length:2},(_,i)=>make("RoomscriptCueAudio_"+i,false));this.tick=make("RoomscriptQuietClock",true);
    this.music=make("RoomscriptScore",false);this.music.playbackMode=Audio.PlaybackMode.LowPower;this.music.audioTrack=this.clips.Interrogation;this.music.volume=this.musicVolume;this.music.play(-1);
    this.tension=make("RoomscriptTension",false);this.tension.audioTrack=this.clips.Tension;this.tension.volume=0;this.tension.play(-1);this.narration=make("RoomscriptNarration",false);
  });this.createEvent("UpdateEvent").bind(()=>{if(!this.music||!this.tension)return;const gain=this.muted?0:this.musicVolume*this.duck,step=Math.min(1,getDeltaTime()*3);this.music.volume+=(gain*(1-this.stress)-this.music.volume)*step;this.tension.volume+=(gain*this.stress-this.tension.volume)*step;});}
  setComposure(value:number):void {this.stress=Math.max(0,Math.min(1,value));}
  duckSpeech(value:boolean):void {this.duck=value?.3:1;}
  score(name:string):void {const track=this.clips[name];if(!track||!this.music)return;this.music.stop(false);this.music.audioTrack=track;this.music.play(["Interrogation","MainTheme","BlackoutDrone","Reconstruction"].includes(name)?-1:1);}
  dialogue(name:string,graph:CaseGraph,state:GameState):boolean {const spec=DIALOGUE_MANIFEST.find(d=>d.name===name),sealed=state.verdict==="correct"||state.verdict==="wrong";
    if(!spec||((spec as {verdictOnly?:boolean}).verdictOnly&&!sealed)||!spec.factIds.every(id=>sealed?graph.facts.some(f=>f.id===id&&f.truth):state.knowledge.factIds.includes(id)))return false;
    const track=ROOMScriptDialogueAssets[name];if(!track||!this.narration)return false;this.narrationRevision++;this.narration.stop(false);this.narration.audioTrack=track;this.narration.volume=.9;this.narration.play(1);return true;
  }
  async narrate(speaker:string,text:string):Promise<boolean> {const clips=RoomscriptVoiceLibrary.clips(speaker,text);if(!clips||!this.narration)return false;const revision=++this.narrationRevision;this.narration.stop(false);
    for(const clip of clips){if(revision!==this.narrationRevision)return false;this.narration.audioTrack=clip.track;this.narration.volume=.9;this.narration.play(1);if(clip.record.startSeconds)this.narration.position=clip.record.startSeconds;const seconds=(clip.record.endSeconds??this.narration.duration)-(clip.record.startSeconds||0);
      await new Promise<void>(resolve=>{const event=this.createEvent("DelayedCallbackEvent");event.bind(()=>{this.removeEvent(event);resolve();});event.reset(Math.max(.1,seconds));});
      if(revision===this.narrationRevision)this.narration.stop(false);
    }return true;
  }
  private playOn(audio:AudioComponent,name:string,volume:number):void {if(!audio||!this.clips[name])return;if(audio.audioTrack&&audio.isPlaying())audio.stop(false);audio.audioTrack=this.clips[name];audio.volume=volume;audio.play(1);}
  play(name:string):void {if(name==="ClockTick"){this.playOn(this.tick,name,.08);return;}const audio=this.flatPool.find(a=>!a.audioTrack||!a.isPlaying())||this.flatPool[this.flatIndex++%2];this.playOn(audio,name,this.sfxVolume);}
  previewNext():string {const names=Object.keys(this.clips),name=names[this.cueIndex++%names.length];this.play(name);return name;}
  silence(value:boolean):void {this.muted=value;if(this.music)this.music.volume=value?0:this.musicVolume;if(value)for(const audio of [...this.flatPool,...this.spatialPool,this.tick])if(audio?.audioTrack&&audio.isPlaying())audio.stop(false);}
  playAt(name:string,position:vec3):void {const audio=name==="ClockTick"?this.tick:this.spatialPool.find(a=>!a.audioTrack||!a.isPlaying())||this.spatialPool[this.spatialIndex++%4];if(!audio)return;audio.getTransform().setWorldPosition(position);this.playOn(audio,name,name==="ClockTick"?.08:this.sfxVolume);}
  diagnostics():{spatial:number;flat:number;tick:boolean} {return {spatial:this.spatialPool.filter(a=>a.audioTrack&&a.isPlaying()).length,flat:this.flatPool.filter(a=>a.audioTrack&&a.isPlaying()).length,tick:!!this.tick?.audioTrack&&this.tick.isPlaying()};}
}
