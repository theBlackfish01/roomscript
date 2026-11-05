import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {OpenAI} from "RemoteServiceGateway.lspkg/HostedExternal/OpenAI";
import {RoomscriptLlmClient} from "./RoomscriptLlmClient";
import {RoomscriptSuspectActor} from "./RoomscriptSuspectActor";
import {CancellationSource,CancellationToken,LlmError} from "./Engine/ai/LlmPort";
import {delay,withDeadline,DEADLINES} from "./Engine/ai/Deadlines";
import {audioBudgetMs,prepareSpeech,splitSentences} from "./Engine/ai/Speech";
import {providerError} from "./Engine/ai/ProviderRequests";
import {RequestPriority} from "./Engine/ai/Scheduler";
import {buildFactSheet} from "./Engine/perf/FactSheetBuilder";
import {canonicalFallback,lookupLine} from "./Engine/perf/LineBank";
import {validateLine} from "./Engine/perf/LineValidator";
import {heroLineBank} from "./Content/HeroLineBank";
import {RoomscriptVoiceLibrary} from "./RoomscriptVoiceLibrary";
import {RoomscriptAudio} from "./RoomscriptAudio";

/** Validated prose only. Parallel synthesis, ordered playback, shared first-audio deadline. */
@component export class RoomscriptTts extends BaseScriptComponent {
  @input @hint("Gateway transport and shared scheduler") client:RoomscriptLlmClient;
  @input @hint("Speaker whose authored voice and jaw animation are used") actor:RoomscriptSuspectActor;
  readonly onAudioStarted=new Event<{text:string;latencyMs:number;voice:string;durationMs:number}>();
  readonly onSubtitle=new Event<string>();
  private audio:AudioComponent;private cache=new Map<string,AudioTrackAsset>();private source:CancellationSource;
  private played=0;private fallback=0;private hit=0;
  onAwake():void {
    this.createEvent("OnStartEvent").bind(()=>{this.audio=this.getSceneObject().createComponent("Component.AudioComponent") as AudioComponent;this.audio.playbackMode=Audio.PlaybackMode.LowLatency;this.audio.volume=0.9;});
    this.createEvent("OnDestroyEvent").bind(()=>this.stop());
  }
  stop():void {this.source?.cancel();if(this.audio?.audioTrack&&this.audio.isPlaying())this.audio.stop(false);this.actor?.setVoice(null);}
  diagnostics():{played:number;fallback:number;cache:number;hits:number;playing:boolean} {return {played:this.played,fallback:this.fallback,cache:this.cache.size,hits:this.hit,playing:!!this.audio?.audioTrack&&this.audio.isPlaying()};}
  cached(line:string,voice=this.actor.voice()):boolean {return !!RoomscriptVoiceLibrary.clips(this.actor.suspect,line)||splitSentences(line).every(sentence=>this.cache.has(voice+"|"+sentence));}
  clearCacheForProbe():void {this.stop();this.cache.clear();}
  async precacheCurrent(parent?:CancellationToken):Promise<number> {
    if(this.client.isOffline()||!this.client.hasCredentials("openai"))return 0;
    this.actor.engine.initialize();const graph=this.actor.engine.graphRef(),state=this.actor.engine.snapshot();
    const suspect=this.actor.suspect,sheet=buildFactSheet(graph,state,suspect),voice=this.actor.voice();
    const lines=sheet.account.map(ref=>lookupLine(heroLineBank,{suspect,topic:ref.topic!,layer:state.suspects[suspect].layer,mode:"answer"},sheet,graph))
      .filter(answer=>!!answer).map(answer=>({line:answer!.line,voice}));
    for(const mode of ["filler","deflect","lawyered"] as const) {
      const answer=canonicalFallback(sheet,"unclear",mode);
      if(validateLine(answer,sheet,graph,mode).ok)lines.push({line:answer.line,voice});
    }
    return this.precache(lines,parent);
  }
  async precache(lines:readonly {line:string;voice:string}[],parent?:CancellationToken):Promise<number> {
    const unique=new Map<string,{sentence:string;voice:string}>();
    for(const line of lines)for(const sentence of splitSentences(line.line))unique.set(line.voice+"|"+sentence,{sentence,voice:line.voice});
    let loaded=0;
    await Promise.all([...unique.values()].map(async clip=>{try{await this.synthesize(clip.sentence,clip.voice,"case-load",20000,parent);loaded++;}catch{/* Offline authored subtitles remain available. */}}));
    return loaded;
  }
  private async synthesize(sentence:string,voice:string,priority:RequestPriority,budgetMs:number,parent?:CancellationToken):Promise<AudioTrackAsset> {
    parent?.throwIfCancelled();const key=voice+"|"+sentence;const cached=this.cache.get(key);
    if(cached){this.cache.delete(key);this.cache.set(key,cached);this.hit++;return cached;}
    const track=await withDeadline(token=>this.client.scheduler.submit(priority,async()=>{
      if(this.client.isOffline()||!this.client.hasCredentials("openai"))throw new LlmError("unavailable");
      try{return await OpenAI.speech({model:"gpt-4o-mini-tts",voice:voice as any,input:sentence,instructions:"A restrained theatrical suspect. Clear diction, quiet tension.",response_format:"mp3"});}
      catch(error){throw providerError(error);}
    },token).promise,budgetMs,this.client.clock,parent);
    parent?.throwIfCancelled();this.cache.set(key,track);if(this.cache.size>60)this.cache.delete(this.cache.keys().next().value);
    return track;
  }
  async speak(line:string,voice?:string,parent?:CancellationToken,questionStartedAt?:number,take="steady",allowTell=false):Promise<boolean> {
    this.stop();const source=new CancellationSource();this.source=source;const selectedVoice=voice??this.actor.voice();
    const unsubscribe=parent?.onCancel(()=>{source.cancel();if(this.source===source){if(this.audio?.audioTrack&&this.audio.isPlaying())this.audio.stop(false);this.actor.setVoice(null);}})||(()=>{});
    const began=questionStartedAt??this.client.clock.nowMs();this.onSubtitle.invoke(line);let first=true;
    try {
      RoomscriptAudio.active?.duckSpeech(true);const bundled=RoomscriptVoiceLibrary.clips(this.actor.suspect,line,take,allowTell);
      if(bundled){for(const clip of bundled){source.token.throwIfCancelled();const record=clip.record;this.audio.audioTrack=clip.track;this.audio.play(1);if(record.startSeconds)this.audio.position=record.startSeconds;
        this.played++;this.hit++;first=false;this.actor.setVoice(clip.track);this.actor.setAlignment(record.alignment,()=>this.audio.position-(record.startSeconds||0));
        const duration=(record.endSeconds??this.audio.duration)-(record.startSeconds||0);
        this.onAudioStarted.invoke({text:record.text,latencyMs:this.client.clock.nowMs()-began,voice:"bundle:"+record.speaker+":"+record.take,durationMs:duration*1000});
        await delay(Math.max(100,duration*1000),this.client.clock,source.token);if(this.audio.isPlaying())this.audio.stop(false);this.actor.setVoice(null);
      }return true;}
      const clips=prepareSpeech(line,(sentence,index)=>this.synthesize(sentence,selectedVoice,"live",audioBudgetMs(began,this.client.clock.nowMs(),index),source.token));
      for(const clip of clips) {
        const prepared=await clip.ready;source.token.throwIfCancelled();if(prepared.ok===false)throw prepared.error;
        if(first&&this.client.clock.nowMs()-began>DEADLINES.answerMs)throw new LlmError("timeout");
        first=false;this.audio.audioTrack=prepared.track;this.audio.play(1);this.played++;this.actor.setVoice(prepared.track);
        const duration=(prepared.track.control as FileAudioTrackProvider).duration;
        this.onAudioStarted.invoke({text:clip.sentence,latencyMs:this.client.clock.nowMs()-began,voice:selectedVoice,durationMs:duration*1000});
        await delay(Math.max(100,Number.isFinite(duration)?duration*1000:clip.sentence.length*75),this.client.clock,source.token);
        this.actor.setVoice(null);
      }
      return !first;
    } catch(error) {
      source.cancel();
      if(!(error instanceof LlmError)||error.code!=="cancelled") {this.fallback++;console.log("TTS|subtitle_fallback");}
      return false;
    } finally {unsubscribe();if(this.source===source){this.actor.setVoice(null);RoomscriptAudio.active?.duckSpeech(false);}}
  }
}
