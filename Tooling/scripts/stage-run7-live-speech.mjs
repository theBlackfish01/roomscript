import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'Tooling/staging/run7'),bases={};
function read(name){const text=readFileSync(resolve(root,'Assets/Scripts',name),'utf8');bases[name]=createHash('sha256').update(text).digest('hex');return text;}
function replace(text,from,to){if(!text.includes(from))throw Error('Stale adapter boundary: '+from.slice(0,80));return text.replace(from,to);}
function save(name,text){writeFileSync(resolve(out,name),text);}
let t=read('RoomscriptTts.ts');
t='import {admittedFreeSpeech,speechStillAdmitted} from "./Engine/ai/LiveSpeechAdmission";\nimport {synthesizeAdmittedSpeech} from "./RoomscriptLiveSpeech";\n'+t;
t=replace(t,'private played=0;private fallback=0;private hit=0;','private played=0;private fallback=0;private hit=0;private liveAttempts=0;private livePlayed=0;');
t=replace(t,'cached(line:string,','liveDiagnostics():{attempts:number;played:number;fallback:number}{return {attempts:this.liveAttempts,played:this.livePlayed,fallback:this.fallback};}\n  cached(line:string,');
t=replace(t,'take="steady",allowTell=false):Promise<boolean>','take="steady",allowTell=false,scope:"standard"|"free"="standard"):Promise<boolean>');
t=replace(t,'      const clips=prepareSpeech(line,',`      if(scope==="free"){
        const engine=this.actor.engine,graph=engine.graphRef(),ticket=admittedFreeSpeech(engine.snapshot(),this.actor.suspect,line,"free");
        if(!ticket)throw new LlmError("invalid_response");
        const allowed=()=>this.source===source&&engine.graphRef()===graph&&speechStillAdmitted(engine.snapshot(),ticket);
        this.liveAttempts++;const track=await synthesizeAdmittedSpeech(this.client,ticket,selectedVoice,allowed,source.token);
        source.token.throwIfCancelled();this.audio.audioTrack=track;this.audio.play(1);this.played++;this.livePlayed++;this.actor.setVoice(track);
        const duration=(track.control as FileAudioTrackProvider).duration;this.onSubtitle.invoke(line);
        this.onAudioStarted.invoke({text:line,latencyMs:this.client.clock.nowMs()-began,voice:selectedVoice,durationMs:duration*1000});
        await delay(Math.max(100,Number.isFinite(duration)?duration*1000:line.length*75),this.client.clock,source.token);return true;
      }
      const clips=prepareSpeech(line,`);
save('RoomscriptTts.ts',t);
let flow=read('RoomscriptInterrogationController.ts');
flow=replace(flow,'!!tellCue(graph,state,state.lastSeq,suspect,chosen.mode));','!!tellCue(graph,state,state.lastSeq,suspect,chosen.mode),kind==="free"?"free":"standard");');save('RoomscriptInterrogationController.ts',flow);
let audio=read('RoomscriptAudio.ts');
audio='import {RoomscriptLlmClient} from "./RoomscriptLlmClient";\nimport {admittedWrenSpeech,speechStillAdmitted,AdmittedSpeech} from "./Engine/ai/LiveSpeechAdmission";\nimport {CancellationSource} from "./Engine/ai/LlmPort";\nimport {synthesizeAdmittedSpeech} from "./RoomscriptLiveSpeech";\n'+audio;
audio=replace(audio,'type SpeechJob={kind:', 'type LiveNarration={client:RoomscriptLlmClient;ticket:AdmittedSpeech;allowed:()=>boolean};\ntype SpeechJob={live?:LiveNarration;kind:');
audio=replace(audio,'private tips=new Set<string>();','private liveSource:CancellationSource;private liveAttempts=0;private livePlayed=0;private liveFallback=0;\n  private tips=new Set<string>();');
audio=replace(audio,'private resetNarrative():void {this.selector.reset();','private resetNarrative():void {this.liveSource?.cancel();this.selector.reset();');
audio=replace(audio,'  private enqueue(job:Omit<SpeechJob,"resolve">)',`  /** Resolve the reducer event by key; callers cannot supply model prose as Wren speech. */
  narrateAdmittedWren(engine:RoomscriptEngineBridge,client:RoomscriptLlmClient,key:string):Promise<boolean>{
    const graph=engine.graphRef(),ticket=admittedWrenSpeech(engine.snapshot(),key);if(!ticket)return Promise.resolve(false);
    const allowed=()=>engine.graphRef()===graph&&speechStillAdmitted(engine.snapshot(),ticket);
    return this.enqueue({kind:"voice",speaker:"WREN",text:ticket.text,allowed,live:{client,ticket,allowed}});
  }
  liveSpeechDiagnostics():{attempts:number;played:number;fallback:number}{return {attempts:this.liveAttempts,played:this.livePlayed,fallback:this.liveFallback};}
  private enqueue(job:Omit<SpeechJob,"resolve">)`);
audio=replace(audio,'await this.playVoice(job.speaker!,job.text!)','await this.playVoice(job.speaker!,job.text!,job.live)');
audio=replace(audio,'private async playVoice(speaker:string,text:string):Promise<boolean>','private async playVoice(speaker:string,text:string,live?:LiveNarration):Promise<boolean>');
audio=replace(audio,'    if(!clips){this.fallbackCount++;',`    if(!clips&&live){
      const revision=++this.narrationRevision,source=new CancellationSource();this.liveSource=source;this.liveAttempts++;
      try{
        const track=await synthesizeAdmittedSpeech(live.client,live.ticket,"sage",()=>revision===this.narrationRevision&&live.allowed(),source.token);
        if(revision!==this.narrationRevision||!live.allowed())return false;
        this.narratorDucking=true;this.updateDuck();this.caption=[];this.onNarrationSubtitle.invoke({speaker,text});
        this.narration.audioTrack=track;this.narration.volume=.9;this.narration.play(1);this.livePlayed++;
        await this.waitForNarration(Math.max(.1,this.narration.duration),revision);if(revision!==this.narrationRevision)return false;
        this.narration.stop(false);this.playedNarrations++;return true;
      }catch{if(revision!==this.narrationRevision||!live.allowed())return false;this.liveFallback++;console.log("WREN_LIVE_SPEECH|caption_fallback");}
      finally{if(this.liveSource===source)this.liveSource=undefined;if(revision===this.narrationRevision){this.narratorDucking=false;this.updateDuck();}}
    }
    if(!clips){this.fallbackCount++;`);
save('RoomscriptAudio.ts',audio);
writeFileSync(resolve(out,'live-speech-base-hashes.json'),JSON.stringify(bases,null,2)+'\n');
console.log('Staged Tts, Interrogation and Audio; no Assets writes. Main hook: audio.narrateAdmittedWren(engine, interrogation.client, key).');
