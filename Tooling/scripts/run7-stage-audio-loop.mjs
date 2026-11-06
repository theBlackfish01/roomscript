import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const stage=path.join(root,'Tooling/staging');
fs.mkdirSync(stage,{recursive:true});
const sources={};
function read(name){return sources[name]=fs.readFileSync(path.join(root,'Assets/Scripts',name),'utf8');}
function replace(text,old,value){if(!text.includes(old))throw new Error('Missing source: '+old.slice(0,90));return text.replace(old,value);}
let audio=read('RoomscriptAudio.ts');
audio=replace(audio,'private cueStarts=0;','private clockLoop:AudioComponent;private clockLoopActive=false;private clockLoopStarts=0;private clockLoopStops=0;private scoreStarts=1;private nativeAudioCalls=0;private slowAudioCalls=0;private maxAudioCallMs=0;\n  private cueStarts=0;');
audio=replace(audio,'this.tick=this.makeAudio("RoomscriptQuietClock",true);','this.tick=this.makeAudio("RoomscriptQuietClock",true);this.clockLoop=this.makeAudio("RoomscriptLoopingClock",true);this.clockLoop.playbackMode=Audio.PlaybackMode.LowPower;');
audio=replace(audio,'score(name:string):void {const track=this.clips[name];if(!track||!this.music)return;this.scoreName=name;this.music.stop(false);this.music.audioTrack=track;this.music.volume=this.muted?0:this.musicVolume*this.duck;this.music.play(["Interrogation","MainTheme","BlackoutDrone","Reconstruction"].includes(name)?-1:1);}',`score(name:string):void {const track=this.clips[name];if(!track||!this.music)return;if(this.scoreName===name&&this.music.isPlaying())return;this.scoreName=name;this.nativeAudio("score.stop:"+name,()=>this.music.stop(false));this.nativeAudio("score.track:"+name,()=>{this.music.audioTrack=track;});this.music.volume=this.muted?0:this.musicVolume*this.duck;this.nativeAudio("score.play:"+name,()=>this.music.play(["Interrogation","MainTheme","BlackoutDrone","Reconstruction"].includes(name)?-1:1));this.scoreStarts++;}
  /** Bounded wall-time diagnostics, not a simulated-frame clock. No per-frame logging. */
  private nativeAudio(label:string,call:()=>void):void {const start=Date.now();try{call();}finally{const ms=Date.now()-start;this.nativeAudioCalls++;this.maxAudioCallMs=Math.max(this.maxAudioCallMs,ms);if(ms>100){this.slowAudioCalls++;if(this.slowAudioCalls<=20)console.log("AUDIO_NATIVE_SLOW|"+JSON.stringify({label,ms,call:this.nativeAudioCalls}));}}}
  /** Production ambience is one native loop. Explicit playAt('ClockTick') remains a separate one-shot. */
  clock(enabled:boolean,position?:vec3):void {if(!this.clockLoop||!this.clips.ClockTick)return;if(enabled===this.clockLoopActive)return;
    if(!enabled){this.nativeAudio("clock.stop",()=>this.clockLoop.stop(false));this.clockLoopActive=false;this.clockLoopStops++;return;}
    if(position)this.clockLoop.getTransform().setWorldPosition(position);this.nativeAudio("clock.track",()=>{this.clockLoop.audioTrack=this.clips.ClockTick;});this.clockLoop.volume=this.muted?0:.08;this.nativeAudio("clock.play",()=>this.clockLoop.play(-1));this.clockLoopActive=true;this.clockLoopStarts++;
  }
  loopDiagnostics():{clockActive:boolean;clockPlaying:boolean;clockStarts:number;clockStops:number;clockPosition:number;scoreStarts:number;scoreName:string;nativeCalls:number;slowCalls:number;maxCallMs:number}{return {clockActive:this.clockLoopActive,clockPlaying:!!this.clockLoop?.audioTrack&&this.clockLoop.isPlaying(),clockStarts:this.clockLoopStarts,clockStops:this.clockLoopStops,clockPosition:this.clockLoop?.audioTrack?this.clockLoop.position:0,scoreStarts:this.scoreStarts,scoreName:this.scoreName,nativeCalls:this.nativeAudioCalls,slowCalls:this.slowAudioCalls,maxCallMs:this.maxAudioCallMs};}`);
audio=replace(audio,'if(audio.audioTrack&&audio.isPlaying())audio.stop(false);audio.audioTrack=this.clips[name];audio.volume=volume;audio.play(1);this.cueStarts++;','if(audio.audioTrack&&audio.isPlaying())this.nativeAudio("cue.stop:"+name,()=>audio.stop(false));this.nativeAudio("cue.track:"+name,()=>{audio.audioTrack=this.clips[name];});audio.volume=volume;this.nativeAudio("cue.play:"+name,()=>audio.play(1));this.cueStarts++;');
audio=replace(audio,'silence(value:boolean):void {this.muted=value;','silence(value:boolean):void {this.muted=value;if(this.clockLoop)this.clockLoop.volume=value?0:.08;');
let opening=read('RoomscriptOpeningController.ts');
const begin='if(!this.subscribed){this.subscribed=true;';const end='tick.reset(1);}const room=';
const start=opening.indexOf(begin),stop=opening.indexOf(end,start);if(start<0||stop<0)throw new Error('Opening timer source changed');
opening=opening.slice(0,start)+`if(!this.subscribed){this.subscribed=true;this.cast.flow.engine.onState.add(state=>{this.verdict=!!state.verdict;this.syncClock();});this.cast.flow.engine.onCaseChanged.add(()=>this.resetForCase());}const room=`+opening.slice(stop+end.length);
opening=replace(opening,'private resetForCase():void {','private syncClock():void {const enabled=this.phase==="ready"&&!this.verdict,clock=enabled?this.cast.flow.engine.graphRef().room.objects.find(o=>o.type==="clock"):undefined;this.clue.objection.tells.audio.clock(enabled,enabled?(clock?this.cast.room.objectAnchor(clock.id).getTransform().getWorldPosition():this.crate.getTransform().getWorldPosition()):undefined);}\n  private resetForCase():void {this.clue.objection.tells.audio.clock(false);');
opening=replace(opening,'this.beat("ready");}','this.beat("ready");this.syncClock();}');
opening=replace(opening,'scanStatus(text:string):void {','scanStatus(text:string):void {this.clue.objection.tells.audio.clock(false);');
let polish=read('RoomscriptPolishLeafScenario.ts');
polish=replace(polish,'const point=opening.cast.room.objectAnchor("O7").getTransform().getWorldPosition(),before=audio.narrativeDiagnostics();',`const point=opening.cast.room.objectAnchor("O7").getTransform().getWorldPosition();
    // Production ready-clock must survive repeated state syncs without native restarts.
    audio.clock(false);const loopBefore=audio.loopDiagnostics();audio.clock(true,point);
    const loopStart=audio.loopDiagnostics();expect(loopStart.clockStarts).toBe(loopBefore.clockStarts+1);
    for(let i=0;i<12;i++){audio.clock(true,point);audio.score(loopStart.scoreName);}
    const loopRepeated=audio.loopDiagnostics();expect(loopRepeated.clockStarts).toBe(loopStart.clockStarts);expect(loopRepeated.scoreStarts).toBe(loopStart.scoreStarts);expect(loopRepeated.clockPlaying).toBe(true);
    const loopUntil=getTime()+1.15;for(let i=0;i<120&&getTime()<loopUntil;i++)await nextFrame();
    expect(getTime()>=loopUntil).toBe(true);const loopAfter=audio.loopDiagnostics();expect(loopAfter.clockStarts).toBe(loopStart.clockStarts);expect(loopAfter.clockPlaying).toBe(true);
    console.log("POLISH_CLOCK_LOOP|"+JSON.stringify({before:loopBefore,start:loopStart,after:loopAfter}));
    const before=audio.narrativeDiagnostics();`);
polish=replace(polish,'// Report a late stopped component explicitly;',`const explicitLoop=audio.loopDiagnostics();expect(explicitLoop.clockStarts).toBe(loopStart.clockStarts);expect(explicitLoop.clockPlaying).toBe(true);
    audio.clock(false);audio.clock(false);const stopped=audio.loopDiagnostics();expect(stopped.clockStops).toBe(loopStart.clockStops+1);expect(stopped.clockPlaying).toBe(false);audio.clock(true,point);
    // Report a late stopped component explicitly;`);
for(const [name,text] of Object.entries({'RoomscriptAudio.ts':audio,'RoomscriptOpeningController.ts':opening,'RoomscriptPolishLeafScenario.ts':polish}))fs.writeFileSync(path.join(stage,name),text);
fs.writeFileSync(path.join(stage,'run7-audio-loop-sources.json'),JSON.stringify(Object.fromEntries(Object.entries(sources).map(([n,t])=>[n,{bytes:Buffer.byteLength(t),source:t}]))));
console.log('Staged Audio + Opening + Polish only. No Assets writes.');
