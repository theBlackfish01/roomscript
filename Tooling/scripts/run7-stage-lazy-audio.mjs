import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),name='RoomscriptAudio.ts',source=fs.readFileSync(path.join(root,'Assets/Scripts',name),'utf8');let out=source;
function replace(old,value){if(!out.includes(old))throw new Error('Source changed: '+old.slice(0,80));out=out.replace(old,value);}
replace('private scoreName="Interrogation";','private scoreName="";');
replace('private scoreStarts=1;','private scoreStarts=0;private tensionStarted=false;private tensionActive=false;private tensionStarts=0;');
replace('this.music=this.makeAudio("RoomscriptScore",false);this.music.playbackMode=Audio.PlaybackMode.LowPower;this.music.audioTrack=this.clips.Interrogation;this.music.volume=this.musicVolume;this.music.play(-1);','this.music=this.makeAudio("RoomscriptScore",false);this.music.playbackMode=Audio.PlaybackMode.LowPower;this.music.volume=0;');
replace('this.tension=this.makeAudio("RoomscriptTension",false);this.tension.playbackMode=Audio.PlaybackMode.LowPower;this.tension.audioTrack=this.clips.Tension;this.tension.volume=0;this.tension.play(-1);','this.tension=this.makeAudio("RoomscriptTension",false);this.tension.playbackMode=Audio.PlaybackMode.LowPower;this.tension.volume=0;');
replace('setComposure(value:number):void {this.stress=Math.max(0,Math.min(1,value));}',`setComposure(value:number):void {this.stress=Math.max(0,Math.min(1,value));this.syncTension();}
  /** Do not open a silent native stream on startup. Resume the same stream on later tension beats. */
  private syncTension():void {if(!this.tension||!this.clips.Tension)return;const wanted=!this.muted&&this.scoreName==="Interrogation"&&this.stress>.001;if(wanted===this.tensionActive)return;
    if(!wanted){this.nativeAudio("tension.pause",()=>{this.tension.pause();});this.tensionActive=false;this.tension.volume=0;return;}
    if(!this.tensionStarted){this.nativeAudio("tension.track",()=>{this.tension.audioTrack=this.clips.Tension;});this.tension.volume=0;this.nativeAudio("tension.play",()=>this.tension.play(-1));this.tensionStarted=true;this.tensionStarts++;}else this.nativeAudio("tension.resume",()=>{this.tension.resume();});this.tensionActive=true;
  }`);
replace('this.scoreStarts++;}','this.scoreStarts++;this.syncTension();}');
replace('silence(value:boolean):void {this.muted=value;','silence(value:boolean):void {this.muted=value;this.syncTension();');
replace('scoreStarts:number;scoreName:string;nativeCalls:number;','scoreStarts:number;scoreName:string;tensionStarts:number;tensionActive:boolean;nativeCalls:number;');
replace('scoreName:this.scoreName,nativeCalls:','scoreName:this.scoreName,tensionStarts:this.tensionStarts,tensionActive:this.tensionActive,nativeCalls:');
// Existing audible ambience remains present; measure its native calls as well.
replace('audio.audioTrack=this.clips[name];this.loops.set(name,audio);','this.nativeAudio("ambience.track:"+name,()=>{audio.audioTrack=this.clips[name];});this.loops.set(name,audio);');
replace('audio.volume=this.muted?0:.035*this.duck;audio.play(-1);','audio.volume=this.muted?0:.035*this.duck;this.nativeAudio("ambience.play:"+name,()=>audio.play(-1));');
const dir=path.join(root,'Tooling/staging');fs.writeFileSync(path.join(dir,name),out);fs.writeFileSync(path.join(dir,'run7-lazy-audio-source.json'),JSON.stringify({name,sha256:crypto.createHash('sha256').update(source).digest('hex')}));console.log('Staged lazy score/tension only; authoritative source SHA256 '+crypto.createHash('sha256').update(source).digest('hex'));
