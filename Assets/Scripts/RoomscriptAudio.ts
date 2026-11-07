import {RUN10_VOICE_MANIFEST} from "./Content/Run10VoiceManifest";
import {ROOMScriptRun10VoiceAssets} from "./RoomscriptRun10VoiceAssets";
import {SpeechArbiter,SpeechEvent} from "./Engine/perf/SpeechArbiter";
import {CancellationToken} from "./Engine/ai/LlmPort";
import {RoomscriptLlmClient} from "./RoomscriptLlmClient";
import {admittedWrenSpeech,speechStillAdmitted,AdmittedSpeech} from "./Engine/ai/LiveSpeechAdmission";
import {CancellationSource} from "./Engine/ai/LlmPort";
import {synthesizeAdmittedSpeech} from "./RoomscriptLiveSpeech";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {ROOMScriptCueAssets} from "./RoomscriptVoiceAssets";
import {RoomscriptVoiceLibrary,BundledVoice} from "./RoomscriptVoiceLibrary";
import {ROOMScriptRun7VoiceAssets} from "./RoomscriptRun7VoiceAssets";
import {ROOMScriptRun7CueAssets} from "./RoomscriptRun7CueAssets";
import {ROOMScriptRun8CueAssets} from "./RoomscriptRun8CueAssets";
import {RUN7_VOICE_MANIFEST} from "./Content/Run7VoiceManifest";
import {DIALOGUE_MANIFEST} from "./Content/DialogueManifest";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {NarrativeAudio,NarrativeCue,dialogueAllowed,composureTension,isHarlowPreset} from "./Engine/game/NarrativeAudio";
import {SubtitleCue} from "./Engine/perf/SubtitleTiming";
import {narrationCaptionPlan,estimatedNarrationSeconds} from "./Engine/perf/NarrationSubtitles";
import {CaseGraph,GameState} from "./Engine/core/Types";
type LiveNarration={client:RoomscriptLlmClient;ticket:AdmittedSpeech;allowed:()=>boolean};
type SpeechJob={mood?:string;position?:vec3;live?:LiveNarration;kind:"voice"|"dialogue";speaker?:string;text?:string;name?:string;allowed:()=>boolean;resolve:(played:boolean)=>void};
/** Presentation only. Deterministic knowledge/verdict gates are checked again at playback. */
@component export class RoomscriptAudio extends BaseScriptComponent {
  @input @hint("Interactive sound volume") @widget(new SliderWidget(0,1,0.05)) sfxVolume:number=0.45;
  @input @hint("Quiet background music volume") @widget(new SliderWidget(0,0.5,0.01)) musicVolume:number=0.10;
  static active:RoomscriptAudio;
  readonly onNarrationSubtitle=new Event<{speaker:string;text:string}>();
  readonly onNarrationSubtitleAligned=new Event<{speaker:string;text:string;fullText:string}>();
  private music:AudioComponent;private tension:AudioComponent;private narration:AudioComponent;private cueIndex=0;private stress=0;private duck=1;private muted=false;private narrationRevision=0;
  private clips:Record<string,AudioTrackAsset>={};
  private spatialPool:AudioComponent[]=[];private flatPool:AudioComponent[]=[];private tick:AudioComponent;private spatialIndex=0;private flatIndex=0;
  private loops=new Map<string,AudioComponent>();private scoreName="";private suspectDucking=false;private narratorDucking=false;
  private selector=new NarrativeAudio();private graph:CaseGraph;private state:GameState;private unsubscribe:(()=>void)[]=[];
  private busy:()=>boolean=()=>false;private anchor:(id:string)=>vec3|undefined=()=>undefined;
  readonly onSpeech=new Event<SpeechEvent>();
  private speechLog:SpeechEvent[]=[];private speechSequence=0;private nativeOverlapFrames=0;
  readonly speech=new SpeechArbiter(event=>{this.speechLog.push(event);if(this.speechLog.length>512)this.speechLog.shift();console.log("SPEECH|"+JSON.stringify({...event,at:getTime()}));this.onSpeech.invoke(event);});
  speechDiagnostics(){return {...this.speech.diagnostics(),events:this.speechLog.slice(),nativeOverlapFrames:this.nativeOverlapFrames};}
  suspectPlaying:()=>boolean=()=>false;
  speechBusy():boolean{return !!this.speech.diagnostics().active;}
  suspectSpeech(speaker:string,text:string,run:(token:CancellationToken)=>Promise<boolean>,allowed:()=>boolean=()=>true):Promise<boolean>{return this.speech.enqueue({allowed,id:"suspect-"+(++this.speechSequence),role:"suspect",speaker,text,run});}
  private destroyed=false;private wakeSpeech:(()=>void)|undefined;private waits=new Set<()=>void>();
  private liveSource:CancellationSource;private liveAttempts=0;private livePlayed=0;private liveFallback=0;
  private tips=new Set<string>();private fallbackCount=0;private playedNarrations=0;private rejectedDialogues=0;
  private supplemental=new Map<string,BundledVoice>();
  private caption:SubtitleCue[]=[];private captionIndex=0;private captionOffset=0;private captionSpeaker="";private captionFullText="";
  private clockLoop:AudioComponent;private clockLoopActive=false;private clockLoopStarts=0;private clockLoopStops=0;private scoreStarts=0;private tensionStarted=false;private tensionActive=false;private tensionStarts=0;private nativeAudioCalls=0;private slowAudioCalls=0;private maxAudioCallMs=0;
  private narrationProof=new Map<string,{attempted:number;observed:number;completed:number}>();private observationKey="";private observationPosition=0;private observationSeen=false;
  private boundTracks=new Map<AudioComponent,AudioTrackAsset>();private trackAssignments=0;
  private appliedVolumes=new Map<AudioComponent,number>();private musicLevel=0;private tensionLevel=0;private volumeWrites=0;
  private cueStarts=0;private tickStarts=0;private tickStartedAt=-1;private tickDuration=0;
  onAwake():void {
    this.createEvent("OnStartEvent").bind(()=>{
      RoomscriptAudio.active=this;this.clips={...ROOMScriptCueAssets,...ROOMScriptRun7CueAssets,...ROOMScriptRun8CueAssets};
      for(const record of RUN10_VOICE_MANIFEST)this.supplemental.set(record.key,{record,track:ROOMScriptRun10VoiceAssets[record.index]});
      for(const record of RUN7_VOICE_MANIFEST)this.supplemental.set(record.key,{record,track:ROOMScriptRun7VoiceAssets[record.index]});
      this.spatialPool=Array.from({length:4},(_,i)=>this.makeAudio("RoomscriptSpatialAudio_"+i,true));
      this.flatPool=Array.from({length:2},(_,i)=>this.makeAudio("RoomscriptCueAudio_"+i,false));this.tick=this.makeAudio("RoomscriptQuietClock",true);this.clockLoop=this.makeAudio("RoomscriptLoopingClock",true);this.clockLoop.playbackMode=Audio.PlaybackMode.LowPower;
      this.music=this.makeAudio("RoomscriptScore",false);this.music.playbackMode=Audio.PlaybackMode.LowPower;this.musicLevel=0;this.applyVolume(this.music,0,"music");
      this.tension=this.makeAudio("RoomscriptTension",false);this.tension.playbackMode=Audio.PlaybackMode.LowPower;this.tensionLevel=0;this.applyVolume(this.tension,0,"tension");
      this.narration=this.makeAudio("RoomscriptNarration",false);
    });
    this.createEvent("UpdateEvent").bind(()=>{
      if(this.suspectPlaying()&&this.narration?.audioTrack&&this.narration.isPlaying())this.nativeOverlapFrames++;
      if(!this.music||!this.tension)return;
      const gain=this.muted?0:this.musicVolume*this.duck,stress=this.scoreName==="Interrogation"?this.stress:0,step=Math.min(1,getDeltaTime()*3);
      const musicTarget=gain*(1-stress),tensionTarget=gain*stress;this.musicLevel+=(musicTarget-this.musicLevel)*step;this.tensionLevel+=(tensionTarget-this.tensionLevel)*step;
      if(Math.abs(this.musicLevel-musicTarget)<.0005)this.musicLevel=musicTarget;if(Math.abs(this.tensionLevel-tensionTarget)<.0005)this.tensionLevel=tensionTarget;
      this.applyVolume(this.music,this.musicLevel,"music");this.applyVolume(this.tension,this.tensionLevel,"tension");
      for(const [name,audio] of this.loops)this.applyVolume(audio,(this.muted?0:this.duck)*(name==="UvHum"?.04:.035),name);
      if(this.caption.length&&this.narration?.isPlaying()){const at=this.narration.position-this.captionOffset;let text:string|undefined;while(this.captionIndex<this.caption.length&&this.caption[this.captionIndex].at<=at)text=this.caption[this.captionIndex++].text;if(text!==undefined)this.onNarrationSubtitleAligned.invoke({speaker:this.captionSpeaker,text,fullText:this.captionFullText});}
    });
    this.createEvent("OnDestroyEvent").bind(()=>{this.destroyed=true;this.unsubscribe.forEach(fn=>fn());this.resetNarrative();for(const finish of [...this.waits])finish();if(RoomscriptAudio.active===this)RoomscriptAudio.active=null;});
  }
  private makeAudio(name:string,spatial:boolean):AudioComponent {const root=global.scene.createSceneObject(name);root.setParent(this.getSceneObject());const audio=root.createComponent("Component.AudioComponent") as AudioComponent;audio.spatialAudio.enabled=spatial;audio.playbackMode=Audio.PlaybackMode.LowLatency;return audio;}
  /** Call once from the owning controller; no additional required scene inputs. */
  bindNarrative(engine:RoomscriptEngineBridge,busy?:()=>boolean,anchor?:(id:string)=>vec3|undefined):void {
    this.unsubscribe.forEach(fn=>fn());this.unsubscribe=[];this.resetNarrative();this.busy=busy||(()=>false);this.anchor=anchor||(()=>undefined);engine.initialize();this.graph=engine.graphRef();
    this.unsubscribe.push(engine.onCaseChanged.add(change=>{this.resetNarrative();this.graph=change.graph;this.state=undefined;}));
    this.unsubscribe.push(engine.onState.add(state=>this.acceptState(state)));this.acceptState(engine.snapshot());
  }
  private acceptState(state:GameState):void {if(state.verdict&&!this.state?.verdict)this.speech.reset("ending");if(this.state&&(state.caseId!==this.state.caseId||state.lastSeq<this.state.lastSeq))this.resetNarrative();this.state=state;this.setComposure(composureTension(state));this.enqueueCues(this.selector.consume(this.graph,state));}
  private resetNarrative():void {this.speech.reset("case-change");this.liveSource?.cancel();this.selector.reset();this.tips.clear();this.narrationRevision++;this.caption=[];this.wakeSpeech?.();if(this.narration?.audioTrack)this.narration.stop(false);this.narratorDucking=false;this.updateDuck();for(const audio of this.loops.values())if(audio.audioTrack)audio.stop(false);}
  openingBeat(stage:string):void {if(this.graph&&this.state)this.enqueueCues(this.selector.opening(this.graph,this.state,stage));}
  beforeSeal():void {if(this.graph&&this.state)this.enqueueCues(this.selector.beforeSeal(this.graph,this.state));}
  idleTip():void {if(this.graph&&this.state)this.enqueueCues(this.selector.idle(this.graph,this.state));}
  reconstructionBeat(kind:string):void {if(this.graph&&this.state)this.enqueueCues(this.selector.reconstruction(this.graph,this.state,kind));}
  endingBeat():void {if(this.graph&&this.state)this.enqueueCues(this.selector.ending(this.graph,this.state));}
  private enqueueCues(cues:NarrativeCue[]):void {
    for(const cue of cues){
      if(cue.kind==="voice"){const caseId=this.state?.caseId;void this.enqueue({kind:"voice",speaker:cue.speaker,text:cue.text,allowed:()=>!!this.state&&this.state.caseId===caseId&&cue.factIds.every(id=>this.state.knowledge.factIds.includes(id)||(cue.speaker!=="WREN"&&(this.state.verdict==="correct"||this.state.verdict==="wrong")&&this.graph.facts.some(f=>f.id===id&&f.truth)))});}
      else if(cue.kind==="dialogue")this.dialogue(cue.name,this.graph,this.state);
      else if(cue.kind==="score")this.score(cue.name);
      else if(cue.kind==="ambience")this.ambience(cue.name,cue.enabled);
      else {const point=cue.anchor?this.anchor(cue.anchor):undefined;if(point)this.playAt(cue.name,point);else this.play(cue.name);}
    }
  }
  /** These guards inspect observed evidence/statements and public object types, never the envelope. */
  contextualTip(id:string):boolean {
    if(this.tips.has(id)||!this.tipAllowed(id))return false;
    const text:Record<string,string>={"casting-fallback":"Shall we open the case we brought?","tip-memory":"What would the kettle remember?","tip-pull":"Could you pull that memory closer?","tip-object":"Would her words hold up beside the kettle?","tip-suggest":"Who would you place in that room?","tip-lift":"What changes when you lift it?","tip-accuse":"Who can you point to and prove?"};
    if(!text[id])return false;this.tips.add(id);void this.enqueue({kind:"voice",speaker:"WREN",text:text[id],allowed:()=>this.tipAllowed(id)});return true;
  }
  private tipAllowed(id:string):boolean {
    if(!this.state||!this.graph||this.state.verdict)return false;
    const knowledge=this.state.knowledge,knownEvidence=this.graph.evidence.filter(e=>knowledge.evidenceIds.includes(e.id));
    const kettle=knownEvidence.some(e=>this.graph.room.objects.some(o=>o.id===e.holder&&o.type==="kettle"));
    if(id==="casting-fallback")return true;
    if(id==="tip-memory")return kettle;
    if(id==="tip-object")return isHarlowPreset(this.graph)&&this.state.activeSuspect==="S2"&&kettle&&knowledge.statementIds.length>0;
    if(id==="tip-pull"||id==="tip-lift")return knowledge.evidenceIds.length>0;
    if(id==="tip-suggest")return knowledge.statementIds.length>0;
    if(id==="tip-accuse")return knowledge.factIds.length>0&&knowledge.statementIds.length>0;
    return false;
  }
  setComposure(value:number):void {this.stress=Math.max(0,Math.min(1,value));this.syncTension();}
  /** Do not open a silent native stream on startup. Resume the same stream on later tension beats. */
  private syncTension():void {if(!this.tension||!this.clips.Tension)return;const wanted=!this.muted&&this.scoreName==="Interrogation"&&this.stress>.001;if(wanted===this.tensionActive)return;
    if(!wanted){this.nativeAudio("tension.pause",()=>{this.tension.pause();});this.tensionActive=false;this.tensionLevel=0;this.applyVolume(this.tension,0,"tension");return;}
    if(!this.tensionStarted){this.bindTrack(this.tension,this.clips.Tension,"tension.track");this.tensionLevel=0;this.applyVolume(this.tension,0,"tension");this.nativeAudio("tension.play",()=>this.tension.play(-1));this.tensionStarted=true;this.tensionStarts++;}else this.nativeAudio("tension.resume",()=>{this.tension.resume();});this.tensionActive=true;
  }
  private updateDuck():void {this.duck=(this.suspectDucking||this.narratorDucking)?0.3:1;for(const audio of [...this.flatPool,...this.spatialPool])if(audio.audioTrack&&audio.isPlaying())this.applyVolume(audio,(this.muted?0:this.sfxVolume)*this.duck,"duck");if(this.clockLoop)this.applyVolume(this.clockLoop,(this.muted?0:.08)*this.duck,"clock");}
  speechMuted():boolean{return this.muted;}
  duckSpeech(value:boolean):void {this.suspectDucking=value;this.updateDuck();}
  score(name:string):void {const track=this.clips[name];if(!track||!this.music)return;if(this.scoreName===name&&this.music.isPlaying())return;this.scoreName=name;if(this.music.audioTrack&&(this.music.isPlaying()||this.music.isPaused()))this.nativeAudio("score.stop:"+name,()=>this.music.stop(false));this.bindTrack(this.music,track,"score.track:"+name);this.musicLevel=this.muted?0:this.musicVolume*this.duck;this.applyVolume(this.music,this.muted?0:this.musicVolume*this.duck,"music");this.nativeAudio("score.play:"+name,()=>this.music.play(["Interrogation","MainTheme","BlackoutDrone","Reconstruction"].includes(name)?-1:1));this.scoreStarts++;this.syncTension();}
  /** Bounded wall-time diagnostics, not a simulated-frame clock. No per-frame logging. */
  /** Owned score/clock/cue channels keep the same track across repeat plays; skip redundant native assignment. */
  private bindTrack(audio:AudioComponent,track:AudioTrackAsset,label:string):void {if(this.boundTracks.get(audio)===track)return;this.nativeAudio(label,()=>{audio.audioTrack=track;});this.boundTracks.set(audio,track);this.trackAssignments++;}
  private applyVolume(audio:AudioComponent,value:number,label:string):void {if(!audio)return;const previous=this.appliedVolumes.get(audio);if(previous===value||(previous!==undefined&&value!==0&&Math.abs(previous-value)<=.001))return;this.nativeAudio("volume:"+label,()=>{audio.volume=value;});this.appliedVolumes.set(audio,value);this.volumeWrites++;}
  private nativeAudio(label:string,call:()=>void):void {const start=Date.now();try{call();}finally{const ms=Date.now()-start;this.nativeAudioCalls++;this.maxAudioCallMs=Math.max(this.maxAudioCallMs,ms);if(ms>100){this.slowAudioCalls++;if(this.slowAudioCalls<=20)console.log("AUDIO_NATIVE_SLOW|"+JSON.stringify({label,ms,call:this.nativeAudioCalls}));}}}
  /** Production ambience is one native loop. Explicit playAt('ClockTick') remains a separate one-shot. */
  clock(enabled:boolean,position?:vec3):void {if(!this.clockLoop||!this.clips.ClockTick)return;if(enabled===this.clockLoopActive)return;
    if(!enabled){this.nativeAudio("clock.stop",()=>this.clockLoop.stop(false));this.clockLoopActive=false;this.clockLoopStops++;return;}
    if(position)this.clockLoop.getTransform().setWorldPosition(position);this.bindTrack(this.clockLoop,this.clips.ClockTick,"clock.track");this.applyVolume(this.clockLoop,this.muted?0:.08,"clock");this.nativeAudio("clock.play",()=>this.clockLoop.play(-1));this.clockLoopActive=true;this.clockLoopStarts++;
  }
  loopDiagnostics():{clockActive:boolean;clockPlaying:boolean;clockStarts:number;clockStops:number;clockPosition:number;scoreStarts:number;scoreName:string;tensionStarts:number;tensionActive:boolean;nativeCalls:number;slowCalls:number;maxCallMs:number;volumeWrites:number;trackAssignments:number}{return {clockActive:this.clockLoopActive,clockPlaying:!!this.clockLoop?.audioTrack&&this.clockLoop.isPlaying(),clockStarts:this.clockLoopStarts,clockStops:this.clockLoopStops,clockPosition:this.clockLoop?.audioTrack?this.clockLoop.position:0,scoreStarts:this.scoreStarts,scoreName:this.scoreName,tensionStarts:this.tensionStarts,tensionActive:this.tensionActive,nativeCalls:this.nativeAudioCalls,slowCalls:this.slowAudioCalls,maxCallMs:this.maxAudioCallMs,volumeWrites:this.volumeWrites,trackAssignments:this.trackAssignments};}
  ambience(name:string,enabled:boolean):void {if(!["Rain","RoomTone","UvHum"].includes(name)||!this.clips[name])return;let audio=this.loops.get(name);if(!enabled){if(audio?.audioTrack)audio.stop(false);return;}if(!audio){audio=this.makeAudio("RoomscriptAmbience_"+name,false);audio.playbackMode=Audio.PlaybackMode.LowPower;this.bindTrack(audio,this.clips[name],"ambience.track:"+name);this.loops.set(name,audio);}if(!audio.isPlaying()){this.applyVolume(audio,this.muted?0:.035*this.duck,name);this.nativeAudio("ambience.play:"+name,()=>audio.play(-1));}}
  private allowedDialogue(name:string,graph:CaseGraph,state:GameState):boolean {const spec=DIALOGUE_MANIFEST.find(d=>d.name===name);if(!spec)return false;if(!isHarlowPreset(graph)&&name!=="ArrivalDialogue")return false;return dialogueAllowed(graph,state,spec);}
  dialogue(name:string,graph:CaseGraph,state:GameState):boolean {
    if(name==="OpeningExchange"||!this.allowedDialogue(name,graph,state)){this.rejectedDialogues++;return false;}
    const spec=DIALOGUE_MANIFEST.find(d=>d.name===name),caseId=state.caseId;
    for(const line of spec.lines){const text=line.text.replace(/^\[[^\]]+\]\s*/,"");
      void this.enqueue({kind:"voice",speaker:line.speaker,text,mood:name==="ValeConfession"?"broken":"steady",allowed:()=>{const current=this.state||state,g=this.graph||graph;return current.caseId===caseId&&this.allowedDialogue(name,g,current);}});
    }return true;
  }
  /** Caller supplies engine-admitted or authored performance text. Missing audio keeps full subtitles. */
  hint(text:string,position:vec3):boolean {if(this.speechBusy()||this.speech.diagnostics().queued>0)return false;void this.enqueue({kind:"voice",speaker:"WREN",text,position,allowed:()=>!this.state?.verdict},true);return true;}
  narrate(speaker:string,text:string):Promise<boolean> {return this.enqueue({kind:"voice",speaker,text,allowed:()=>true});}
  /** Resolve the reducer event by key; callers cannot supply model prose as Wren speech. */
  narrateAdmittedWren(engine:RoomscriptEngineBridge,client:RoomscriptLlmClient,key:string):Promise<boolean>{
    const graph=engine.graphRef(),ticket=admittedWrenSpeech(engine.snapshot(),key);if(!ticket)return Promise.resolve(false);
    const allowed=()=>engine.graphRef()===graph&&speechStillAdmitted(engine.snapshot(),ticket);
    return this.enqueue({kind:"voice",speaker:"WREN",text:ticket.text,allowed,live:{client,ticket,allowed}},true);
  }
  liveSpeechDiagnostics():{attempts:number;played:number;fallback:number}{return {attempts:this.liveAttempts,played:this.livePlayed,fallback:this.liveFallback};}
  private enqueue(job:Omit<SpeechJob,"resolve">,_priority=false):Promise<boolean> {
    if(this.destroyed||job.name==="OpeningExchange")return Promise.resolve(false);
    // Old instructional performances leave the flow before the new script is wired.
    if(job.text&&(/\b(witness|memory|pinch|tap|button|notebook|palm|drag|token)\b/i.test(job.text)||job.text==="Listen at the door."))return Promise.resolve(false);
    if(job.speaker==="WREN"&&!_priority)return Promise.resolve(false); // Phase 3 replaces all old hints.
    return this.speech.enqueue({id:"narration-"+(++this.speechSequence),role:job.speaker==="WREN"?"wren":/^S[1-4]$/.test(job.speaker||"")?"suspect":"narrator",speaker:job.speaker||job.name,text:job.text,allowed:job.allowed,run:async token=>{
      this.narration.spatialAudio.enabled=!!job.position;if(job.position)this.narration.getTransform().setWorldPosition(job.position);
      const off=token.onCancel(()=>{this.narrationRevision++;this.liveSource?.cancel();this.caption=[];if(this.narration?.audioTrack)this.narration.stop(false);this.wakeSpeech?.();});
      try{return await this.playVoice(job.speaker!,job.text!,job.live,job.mood); }finally{off();if(this.narration?.audioTrack&&this.narration.isPlaying())this.narration.stop(false);}
    }});
  }
  private wait(seconds:number,speech=false):Promise<void> {return new Promise(resolve=>{const event=this.createEvent("DelayedCallbackEvent");let done=false;const finish=()=>{if(done)return;done=true;this.removeEvent(event);this.waits.delete(finish);if(this.wakeSpeech===finish)this.wakeSpeech=undefined;resolve();};this.waits.add(finish);if(speech)this.wakeSpeech=finish;event.bind(finish);event.reset(Math.max(.01,seconds));});}
  /** Native evidence for exact bundled speech. Counters alone never stand in for playback. */
  narrationEvidence(speaker:string,text:string):{attempted:number;observed:number;completed:number}{return {...(this.narrationProof.get(speaker+"|"+text)||{attempted:0,observed:0,completed:0})};}
  private beginObservation(speaker:string,text:string):void {this.endObservation(false);const key=speaker+"|"+text;let proof=this.narrationProof.get(key);if(!proof){if(this.narrationProof.size>=128)this.narrationProof.delete(this.narrationProof.keys().next().value);proof={attempted:0,observed:0,completed:0};this.narrationProof.set(key,proof);}proof.attempted++;this.observationKey=key;this.observationPosition=this.narration.position;this.observationSeen=false;this.sampleObservation();}
  private sampleObservation():void {if(!this.observationKey||!this.narration?.audioTrack)return;const at=this.narration.position,observed=this.narration.isPlaying()||at>this.observationPosition+.001;this.observationPosition=at;if(observed&&!this.observationSeen){this.observationSeen=true;this.narrationProof.get(this.observationKey)!.observed++;}}
  private endObservation(completed:boolean):void {if(!this.observationKey)return;this.sampleObservation();if(completed)this.narrationProof.get(this.observationKey)!.completed++;this.observationKey="";}
  private async waitForNarration(end:number,revision:number):Promise<void> {
    const started=getTime();let observed=false;
    while(!this.destroyed&&revision===this.narrationRevision){this.sampleObservation();
      // The arbiter owns this channel until the line ends; a queued answer never pauses narration.
      if(this.narration.isPaused())this.narration.resume();
      const playing=this.narration.isPlaying();observed=observed||playing;
      if(observed&&(this.narration.position>=end-.025||!playing))return;
      if(!observed&&getTime()-started>3)throw new Error("Narration never began native playback");
      if(getTime()-started>60)throw new Error("Narration native completion timeout");
      await this.wait(.05,true);
    }
  }
  private async playVoice(speaker:string,text:string,live?:LiveNarration,mood="steady"):Promise<boolean> {
    const supplemental=this.supplemental.get(speaker+"|steady|"+text.trim().replace(/\s+/g," "));
    const clips=RoomscriptVoiceLibrary.clips(speaker,text,mood)||(supplemental?[supplemental]:null);
    if(!clips&&live){
      const revision=++this.narrationRevision,source=new CancellationSource();this.liveSource=source;this.liveAttempts++;
      try{
        const track=await synthesizeAdmittedSpeech(live.client,live.ticket,"sage",()=>revision===this.narrationRevision&&live.allowed(),source.token);
        if(revision!==this.narrationRevision||!live.allowed())return false;
        this.narratorDucking=true;this.updateDuck();this.caption=[];this.onNarrationSubtitle.invoke({speaker,text});
        this.narration.audioTrack=track;this.applyVolume(this.narration,this.muted?0:.9,"narration");this.narration.play(1);this.livePlayed++;
        await this.waitForNarration(Math.max(.1,this.narration.duration),revision);if(revision!==this.narrationRevision)return false;
        this.narration.stop(false);this.playedNarrations++;return true;
      }catch{if(revision!==this.narrationRevision||!live.allowed())return false;this.liveFallback++;console.log("WREN_LIVE_SPEECH|caption_fallback");}
      finally{if(this.liveSource===source)this.liveSource=undefined;if(revision===this.narrationRevision){this.narratorDucking=false;this.updateDuck();}}
    }
    if(!clips){this.fallbackCount++;this.onNarrationSubtitle.invoke({speaker,text});console.log("NARRATION|subtitle_fallback");await this.wait(estimatedNarrationSeconds(text),true);return false;}
    const revision=++this.narrationRevision,captionPlan=narrationCaptionPlan(text,clips.map(clip=>clip.record));this.narratorDucking=true;this.updateDuck();this.captionFullText=text;this.onNarrationSubtitle.invoke({speaker,text});let clipIndex=0;
    try{for(const clip of clips){if(this.destroyed||revision!==this.narrationRevision)return false;this.narration.audioTrack=clip.track;this.applyVolume(this.narration,this.muted?0:.9,"narration");this.narration.play(1);if(clip.record.startSeconds)this.narration.position=clip.record.startSeconds;this.beginObservation(speaker,text);
      const seconds=(clip.record.endSeconds??this.narration.duration)-(clip.record.startSeconds||0);this.caption=captionPlan?.[clipIndex].cues||[];this.captionIndex=0;this.captionOffset=clip.record.startSeconds||0;this.captionSpeaker=speaker;
      if(captionPlan)this.onNarrationSubtitleAligned.invoke({speaker,text:captionPlan[clipIndex].prefix,fullText:text});await this.waitForNarration((clip.record.startSeconds||0)+Math.max(.1,seconds),revision);if(revision!==this.narrationRevision)return false;this.endObservation(true);this.narration.stop(false);this.caption=[];if(captionPlan)this.onNarrationSubtitleAligned.invoke({speaker,text:captionPlan[clipIndex].end,fullText:text});clipIndex++;
    }if(captionPlan)this.onNarrationSubtitleAligned.invoke({speaker,text,fullText:text});this.playedNarrations++;return true;}finally{this.endObservation(false);if(revision===this.narrationRevision){this.caption=[];this.narratorDucking=false;this.updateDuck();}}
  }
  private playOn(audio:AudioComponent,name:string,volume:number):void {if(/^W[0-9]+$/.test(name)||this.muted||!audio||!this.clips[name])return;if(audio.audioTrack&&audio.isPlaying())this.nativeAudio("cue.stop:"+name,()=>audio.stop(false));this.bindTrack(audio,this.clips[name],"cue.track:"+name);this.applyVolume(audio,volume*this.duck,name);this.nativeAudio("cue.play:"+name,()=>audio.play(1));this.cueStarts++;if(name==="ClockTick"){this.tickStarts++;this.tickStartedAt=getTime();this.tickDuration=audio.duration;}}
  play(name:string):void {if(name==="ClockTick"){this.playOn(this.tick,name,.08);return;}const audio=this.flatPool.find(a=>!a.audioTrack||!a.isPlaying())||this.flatPool[this.flatIndex++%2];this.playOn(audio,name,this.sfxVolume);}
  previewNext():string {const names=Object.keys(this.clips),name=names[this.cueIndex++%names.length];this.play(name);return name;}
  silence(value:boolean):void {this.muted=value;if(this.narration)this.applyVolume(this.narration,value?0:.9,"narration");this.syncTension();if(this.clockLoop)this.applyVolume(this.clockLoop,value?0:.08,"clock");if(this.music)this.musicLevel=value?0:this.musicVolume*this.duck;this.applyVolume(this.music,value?0:this.musicVolume*this.duck,"music");if(this.tension)this.tensionLevel=0;this.applyVolume(this.tension,0,"tension");for(const [name,audio] of this.loops)this.applyVolume(audio,value?0:.035*this.duck,name);if(value)for(const audio of [...this.flatPool,...this.spatialPool,this.tick])if(audio?.audioTrack&&audio.isPlaying())audio.stop(false);}
  playAt(name:string,position:vec3):void {const audio=name==="ClockTick"?this.tick:this.spatialPool.find(a=>!a.audioTrack||!a.isPlaying())||this.spatialPool[this.spatialIndex++%4];if(!audio)return;audio.getTransform().setWorldPosition(position);this.playOn(audio,name,name==="ClockTick"?.08:this.sfxVolume);}
  diagnostics():{spatial:number;flat:number;tick:boolean} {return {spatial:this.spatialPool.filter(a=>a.audioTrack&&a.isPlaying()).length,flat:this.flatPool.filter(a=>a.audioTrack&&a.isPlaying()).length,tick:!!this.tick?.audioTrack&&this.tick.isPlaying()};}
  narrativeDiagnostics():{queued:number;playing:boolean;played:number;fallback:number;rejectedDialogue:number;cueStarts:number;tickStarts:number;tickAge:number;tickDuration:number;tickPosition:number} {return {queued:this.speech.diagnostics().queued,playing:!!this.narration?.audioTrack&&this.narration.isPlaying(),played:this.playedNarrations,fallback:this.fallbackCount,rejectedDialogue:this.rejectedDialogues,cueStarts:this.cueStarts,tickStarts:this.tickStarts,tickAge:this.tickStartedAt<0?-1:getTime()-this.tickStartedAt,tickDuration:this.tickDuration,tickPosition:this.tick?.audioTrack?this.tick.position:0};}
}
