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
import {RoomscriptVoiceLibrary} from "./RoomscriptVoiceLibrary";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {subtitleCues,SubtitleCue} from "./Engine/perf/SubtitleTiming";
import {RUN7_VOICE_MANIFEST} from "./Content/Run7VoiceManifest";
import {ROOMScriptRun7VoiceAssets} from "./RoomscriptRun7VoiceAssets";
import {VoiceRecord} from "./Engine/perf/VoiceSelection";
import {accumulatedPhraseCues,phraseVoiceKey,resolvePhrasePlayback} from "./Engine/perf/PhrasePlayback";

/** Validated prose only. Parallel synthesis, ordered playback, shared first-audio deadline. */
@component export class RoomscriptTts extends BaseScriptComponent {
  @input @hint("Gateway transport and shared scheduler") client:RoomscriptLlmClient;
  @input @hint("Speaker whose authored voice and jaw animation are used") actor:RoomscriptSuspectActor;
  readonly onAudioStarted=new Event<{text:string;latencyMs:number;voice:string;durationMs:number}>();
  readonly onSubtitle=new Event<string>();
  private audio:AudioComponent;private cache=new Map<string,AudioTrackAsset>();private source:CancellationSource;
  private played=0;private fallback=0;private hit=0;
  private caption:SubtitleCue[]=[];private captionIndex=0;private captionOffset=0;private captionText="";
  private static phrases:Map<string,VoiceRecord>;
  onAwake():void {
    this.createEvent("OnStartEvent").bind(()=>{this.audio=this.getSceneObject().createComponent("Component.AudioComponent") as AudioComponent;this.audio.playbackMode=Audio.PlaybackMode.LowLatency;this.audio.volume=0.9;});
    this.createEvent("OnDestroyEvent").bind(()=>this.stop());
    this.createEvent("UpdateEvent").bind(()=>{if(!this.caption.length||!this.audio?.audioTrack||!this.audio.isPlaying())return;const time=this.audio.position-this.captionOffset;let text:string|undefined;while(this.captionIndex<this.caption.length&&this.caption[this.captionIndex].at<=time)text=this.caption[this.captionIndex++].text;if(text!==undefined)this.onSubtitle.invoke(text);});
  }
  stop():void {this.source?.cancel();this.caption=[];if(this.audio?.audioTrack&&this.audio.isPlaying())this.audio.stop(false);this.actor?.setVoice(null);}
  diagnostics():{played:number;fallback:number;cache:number;hits:number;playing:boolean} {return {played:this.played,fallback:this.fallback,cache:this.cache.size,hits:this.hit,playing:!!this.audio?.audioTrack&&this.audio.isPlaying()};}
  cached(line:string,voice=this.actor.voice()):boolean {return !!(this.actor.engine.mode()==="dynamic"?this.phraseClips(line):RoomscriptVoiceLibrary.clips(this.actor.suspect,line))||splitSentences(line).every(sentence=>this.cache.has(voice+"|"+sentence));}
  private phraseClips(line:string):{track:AudioTrackAsset;record:VoiceRecord;raw:string;prefix:string}[]|null {
    if(!RoomscriptTts.phrases){RoomscriptTts.phrases=new Map<string,VoiceRecord>();for(const record of RUN7_VOICE_MANIFEST)RoomscriptTts.phrases.set(phraseVoiceKey(record.speaker,record.text),record);}
    const resolved=resolvePhrasePlayback(this.actor.engine.phrasePlan(this.actor.suspect,line),(speaker,text)=>RoomscriptTts.phrases.get(phraseVoiceKey(speaker,text)));
    if(!resolved||resolved.some(clip=>!ROOMScriptRun7VoiceAssets[clip.record.index]))return null;
    return resolved.map(clip=>({...clip,track:ROOMScriptRun7VoiceAssets[clip.record.index]}));
  }
  clearCacheForProbe():void {this.stop();this.cache.clear();}
  async precacheCurrent(parent?:CancellationToken):Promise<number> {
    if(this.client.isOffline()||!this.client.hasCredentials("openai"))return 0;
    this.actor.engine.initialize();const graph=this.actor.engine.graphRef(),state=this.actor.engine.snapshot();
    const suspect=this.actor.suspect,sheet=buildFactSheet(graph,state,suspect),voice=this.actor.voice();
    const lines=sheet.account.map(ref=>lookupLine(this.actor.engine.lineBank(),{suspect,topic:ref.topic!,layer:state.suspects[suspect].layer,mode:"answer"},sheet,graph))
      .filter(answer=>!!answer&&!this.cached(answer.line,voice)).map(answer=>({line:answer!.line,voice}));
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
      RoomscriptAudio.active?.duckSpeech(true);
      const dynamic=this.actor.engine.mode()==="dynamic";
      const bundled=dynamic?this.phraseClips(line):RoomscriptVoiceLibrary.clips(this.actor.suspect,line,take,allowTell)?.map(clip=>({...clip,raw:clip.record.text,prefix:""}));
      if(bundled){for(const clip of bundled){source.token.throwIfCancelled();const record=clip.record;this.audio.audioTrack=clip.track;this.audio.play(1);if(record.startSeconds)this.audio.position=record.startSeconds;
        this.caption=dynamic?accumulatedPhraseCues(clip.raw,clip.prefix,record):subtitleCues(record.text,record.alignment);this.captionIndex=0;this.captionOffset=record.startSeconds||0;this.captionText=clip.prefix+clip.raw;this.onSubtitle.invoke(this.caption.length?clip.prefix:this.captionText);
        this.played++;this.hit++;first=false;this.actor.setVoice(clip.track);this.actor.setAlignment(record.alignment,()=>this.audio.position-(record.startSeconds||0));
        const duration=(record.endSeconds??this.audio.duration)-(record.startSeconds||0);
        this.onAudioStarted.invoke({text:record.text,latencyMs:this.client.clock.nowMs()-began,voice:"bundle:"+record.speaker+":"+record.take,durationMs:duration*1000});
        await delay(Math.max(100,duration*1000),this.client.clock,source.token);source.token.throwIfCancelled();this.caption=[];this.onSubtitle.invoke(clip.prefix+clip.raw);if(this.audio.isPlaying())this.audio.stop(false);this.actor.setVoice(null);
      }this.onSubtitle.invoke(line);return true;}
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
      if(!(error instanceof LlmError)||error.code!=="cancelled") {this.fallback++;if(this.source===source){this.caption=[];this.onSubtitle.invoke(line);}console.log("TTS|subtitle_fallback");}
      return false;
    } finally {unsubscribe();if(this.source===source){this.actor.setVoice(null);RoomscriptAudio.active?.duckSpeech(false);}}
  }
}
