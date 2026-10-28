import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {OpenAI} from "RemoteServiceGateway.lspkg/HostedExternal/OpenAI";
import {RoomscriptLlmClient} from "./RoomscriptLlmClient";
import {RoomscriptSuspectActor} from "./RoomscriptSuspectActor";
import {CancellationSource,CancellationToken,LlmError} from "./Engine/ai/LlmPort";
import {delay,withDeadline,DEADLINES} from "./Engine/ai/Deadlines";
/** Sentence TTS with shared transport limit, cancellable playback and a 60-clip LRU. */
@component export class RoomscriptTts extends BaseScriptComponent {
  @input client:RoomscriptLlmClient;
  @input actor:RoomscriptSuspectActor;
  readonly onAudioStarted=new Event<{text:string;latencyMs:number}>();
  readonly onSubtitle=new Event<string>();
  private audio:AudioComponent;private cache=new Map<string,AudioTrackAsset>();private source:CancellationSource;
  private played=0;private fallback=0;private hit=0;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>{this.audio=this.getSceneObject().createComponent("Component.AudioComponent") as AudioComponent;this.audio.playbackMode=Audio.PlaybackMode.LowLatency;this.audio.volume=0.9;});
    this.createEvent("OnDestroyEvent").bind(()=>this.stop());}
  stop():void {this.source?.cancel();if(this.audio?.audioTrack&&this.audio.isPlaying())this.audio.stop(false);this.actor?.setVoice(null);}
  diagnostics():{played:number;fallback:number;cache:number;hits:number;playing:boolean}{return {played:this.played,fallback:this.fallback,cache:this.cache.size,hits:this.hit,playing:!!this.audio?.audioTrack&&this.audio.isPlaying()};}
  async speak(line:string,voice="onyx",parent?:CancellationToken):Promise<void> {
    this.stop();const source=new CancellationSource();this.source=source;
    const unsubscribe=parent?.onCancel(()=>{source.cancel();if(this.source===source){if(this.audio.audioTrack&&this.audio.isPlaying())this.audio.stop(false);this.actor.setVoice(null);}})||(()=>{});
    const began=this.client.clock.nowMs();this.onSubtitle.invoke(line);
    try {
      for(const sentence of (line.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[line]).map(s=>s.trim()).filter(Boolean)) {
        source.token.throwIfCancelled();const key=voice+"|"+sentence;let track=this.cache.get(key);
        if(track){this.cache.delete(key);this.cache.set(key,track);this.hit++;}
        else {
          track=await withDeadline(token=>this.client.scheduler.submit("live",async()=>{
            if(this.client.forceOffline)throw new LlmError("unavailable");
            try{return await OpenAI.speech({model:"gpt-4o-mini-tts",voice:voice as any,input:sentence,instructions:"A restrained theatrical suspect. Clear diction, quiet tension.",response_format:"mp3"});}
            catch(e){throw new LlmError(/429|quota|rate.limit/i.test(String(e))?"rate_limit":"unavailable");}
          },token).promise,DEADLINES.ttsMs,this.client.clock,source.token);
          this.cache.set(key,track);if(this.cache.size>60)this.cache.delete(this.cache.keys().next().value);
        }
        source.token.throwIfCancelled();this.audio.audioTrack=track;this.audio.play(1);this.played++;this.actor.setVoice(track);
        this.onAudioStarted.invoke({text:sentence,latencyMs:this.client.clock.nowMs()-began});
        const duration=(track.control as FileAudioTrackProvider).duration;
        await delay(Math.max(100,Number.isFinite(duration)?duration*1000+80:sentence.length*75),this.client.clock,source.token);
        this.actor.setVoice(null);
      }
    } catch(e) {
      if(!(e instanceof LlmError)||e.code!=="cancelled") {this.fallback++;print("TTS|subtitle_fallback|builtin_unsupported_LS5.23");}
    } finally {unsubscribe();if(this.source===source)this.actor.setVoice(null);}
  }
}
