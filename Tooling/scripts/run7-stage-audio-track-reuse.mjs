import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),name='RoomscriptAudio.ts',source=fs.readFileSync(path.join(root,'Assets/Scripts',name),'utf8');let out=source;
const replace=(before,after)=>{if(!out.includes(before))throw Error('Audio source changed: '+before);out=out.replace(before,after);};
replace('private appliedVolumes=new Map<AudioComponent,number>();','private boundTracks=new Map<AudioComponent,AudioTrackAsset>();private trackAssignments=0;\n  private appliedVolumes=new Map<AudioComponent,number>();');
replace('this.nativeAudio("tension.track",()=>{this.tension.audioTrack=this.clips.Tension;});','this.bindTrack(this.tension,this.clips.Tension,"tension.track");');
replace('this.nativeAudio("score.track:"+name,()=>{this.music.audioTrack=track;});','this.bindTrack(this.music,track,"score.track:"+name);');
replace('this.nativeAudio("clock.track",()=>{this.clockLoop.audioTrack=this.clips.ClockTick;});','this.bindTrack(this.clockLoop,this.clips.ClockTick,"clock.track");');
replace('this.nativeAudio("ambience.track:"+name,()=>{audio.audioTrack=this.clips[name];});','this.bindTrack(audio,this.clips[name],"ambience.track:"+name);');
replace('this.nativeAudio("cue.track:"+name,()=>{audio.audioTrack=this.clips[name];});','this.bindTrack(audio,this.clips[name],"cue.track:"+name);');
replace('  private applyVolume(audio:AudioComponent',`  /** Owned score/clock/cue channels keep the same track across repeat plays; skip redundant native assignment. */
  private bindTrack(audio:AudioComponent,track:AudioTrackAsset,label:string):void {if(this.boundTracks.get(audio)===track)return;this.nativeAudio(label,()=>{audio.audioTrack=track;});this.boundTracks.set(audio,track);this.trackAssignments++;}
  private applyVolume(audio:AudioComponent`);
replace('maxCallMs:number;volumeWrites:number}{return','maxCallMs:number;volumeWrites:number;trackAssignments:number}{return');
replace('maxCallMs:this.maxAudioCallMs,volumeWrites:this.volumeWrites};','maxCallMs:this.maxAudioCallMs,volumeWrites:this.volumeWrites,trackAssignments:this.trackAssignments};');
fs.writeFileSync(path.join(root,'Tooling/staging',name),out);
fs.writeFileSync(path.join(root,'Tooling/staging/run7-audio-track-reuse-source.json'),JSON.stringify({name,sha256:crypto.createHash('sha256').update(source).digest('hex')},null,2)+'\n');
console.log('Staged same-track assignment guard; no play/stop/voice changes, no Assets writes.');
