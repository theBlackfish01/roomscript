import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,nextFrame} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
const MP3=requireAsset("../Audio/Run7/Sfx/CastingChime.mp3") as AudioTrackAsset;
const PCM=requireAsset("../Audio/Run7/Probe/CastingChimePCM.wav") as AudioTrackAsset;
/** Diagnostic only: one additional owned channel, unchanged production audio, first binding then retained-track replay. */
@component export class RoomscriptNativeAudioProfileLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void>{
    const began=Date.now(),deadline=began+90000,format=config?.get("format")||"mp3",mode=config?.get("mode")||"low-latency";
    expect(["mp3","wav"].includes(format)).toBe(true);expect(["low-latency","low-power"].includes(mode)).toBe(true);
    const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController,production=opening.clue.objection.tells.audio;
    let quiet=false,stable=-1,lastCalls=-1;
    for(let i=0;i<1800&&Date.now()<Math.min(deadline-30000,began+45000);i++){
      const narration=production.narrativeDiagnostics(),calls=production.loopDiagnostics().nativeCalls,phase=opening.diagnostics().phase,eligible=["tab","ready"].includes(phase)&&!narration.playing&&narration.queued===0&&!opening.cast.flow.diagnostics().busy;
      if(!eligible||calls!==lastCalls)stable=-1;else if(stable<0)stable=Date.now();lastCalls=calls;if(stable>=0&&Date.now()-stable>=500){quiet=true;break;}await nextFrame();
    }
    console.log("AUDIO_AB_CONTEXT|"+JSON.stringify({format,mode,quiet,phase:opening.diagnostics().phase,waitMs:Date.now()-began,production:production.loopDiagnostics(),productionUnchanged:true}));expect(quiet).toBe(true);
    const timings:{operation:string;ms:number}[]=[],trials:any[]=[];
    const timed=<T>(operation:string,call:()=>T):T=>{if(Date.now()>=deadline-5000)throw Error("Audio profile deadline before "+operation);const start=Date.now();try{return call();}finally{const row={operation,ms:Date.now()-start};timings.push(row);console.log("AUDIO_AB_NATIVE|"+JSON.stringify({format,mode,...row}));}};
    const root=global.scene.createSceneObject("RoomscriptNativeAudioAB");let audio:AudioComponent|null=null;
    try{
      audio=timed("component.create",()=>root.createComponent("Component.AudioComponent") as AudioComponent);
      timed("mode",()=>{audio.playbackMode=mode==="low-power"?Audio.PlaybackMode.LowPower:Audio.PlaybackMode.LowLatency;});
      timed("volume",()=>{audio.volume=.15;});timed("spatial.off",()=>{audio.spatialAudio.enabled=false;});
      const track=format==="wav"?PCM:MP3;timed("track.first-binding",()=>{audio.audioTrack=track;});
      const duration=timed("duration",()=>audio.duration);expect(Number.isFinite(duration)&&duration>0&&duration<5).toBe(true);
      for(let trial=0;trial<2;trial++){
        const baseline=timed("position.before."+trial,()=>audio.position),trialStart=Date.now(),observations:{ms:number;playing:boolean;position:number}[]=[];let nativePlaying=false,positionAdvanced=false;
        timed("play."+trial,()=>audio.play(1));
        const sample=()=>{const playing=audio.isPlaying(),position=audio.position;nativePlaying=nativePlaying||playing;positionAdvanced=positionAdvanced||position>baseline+.001;if(observations.length<24)observations.push({ms:Date.now()-trialStart,playing,position});return playing;};
        let playing=sample();const until=Math.min(deadline-8000,Date.now()+Math.max(3000,duration*1000+2000));
        for(let i=0;i<240&&Date.now()<until;i++){await nextFrame();playing=sample();if((nativePlaying||positionAdvanced)&&!playing)break;}
        const row={trial,kind:trial===0?"first binding":"retained track replay",duration,baseline,nativePlaying,positionAdvanced,elapsedMs:Date.now()-trialStart,observations};trials.push(row);console.log("AUDIO_AB_PLAYBACK|"+JSON.stringify({format,mode,...row}));
        expect(nativePlaying||positionAdvanced).toBe(true);
        if(audio.isPlaying()||audio.isPaused())timed("stop."+trial,()=>audio.stop(false));
        // Let any stop complete before replaying the same assigned track.
        const stoppedBy=Math.min(deadline-6000,Date.now()+2000);for(let i=0;i<120&&(audio.isPlaying()||audio.isPaused())&&Date.now()<stoppedBy;i++)await nextFrame();
        expect(audio.isPlaying()||audio.isPaused()).toBe(false);await nextFrame();
      }
    }finally{
      const cleanupStart=Date.now();try{if(audio?.audioTrack&&(audio.isPlaying()||audio.isPaused()))audio.stop(false);}finally{if(!isNull(root))root.destroy();}
      console.log("AUDIO_AB_RESULT|"+JSON.stringify({format,mode,elapsedMs:Date.now()-began,cleanupMs:Date.now()-cleanupStart,trials:trials.length,timings,productionMuted:false,nativeDeadlineCannotInterruptSynchronousCall:true}));
    }
    expect(trials.length).toBe(2);expect(Date.now()-began<=90000).toBe(true);
  }
}
