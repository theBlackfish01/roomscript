import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),dir=path.join(root,'Tooling/staging');
const sources={};function read(name){const value=fs.readFileSync(path.join(root,'Assets/Scripts',name),'utf8');sources[name]=crypto.createHash('sha256').update(value).digest('hex');return value;}
let audio=read('RoomscriptAudio.ts');
function replace(old,value){if(!audio.includes(old))throw Error('Audio changed: '+old.slice(0,70));audio=audio.replace(old,value);}
replace('private cueStarts=0;','private appliedVolumes=new Map<AudioComponent,number>();private musicLevel=0;private tensionLevel=0;private volumeWrites=0;\n  private cueStarts=0;');
replace('this.music.volume+=(gain*(1-stress)-this.music.volume)*step;this.tension.volume+=(gain*stress-this.tension.volume)*step;',`const musicTarget=gain*(1-stress),tensionTarget=gain*stress;this.musicLevel+=(musicTarget-this.musicLevel)*step;this.tensionLevel+=(tensionTarget-this.tensionLevel)*step;
      if(Math.abs(this.musicLevel-musicTarget)<.0005)this.musicLevel=musicTarget;if(Math.abs(this.tensionLevel-tensionTarget)<.0005)this.tensionLevel=tensionTarget;
      this.applyVolume(this.music,this.musicLevel,"music");this.applyVolume(this.tension,this.tensionLevel,"tension");`);
for(const [field,label] of [['music','music'],['tension','tension'],['narration','narration'],['clockLoop','clock']]){
 const regex=new RegExp('this\\.'+field+'\\.volume=([^;]+);','g');audio=audio.replace(regex,(_,value)=>`${field==='music'?'this.musicLevel='+value+';':field==='tension'?'this.tensionLevel='+value+';':''}this.applyVolume(this.${field},${value},"${label}");`);
}
audio=audio.replace(/audio\.volume=([^;]+);/g,(_,value)=>`this.applyVolume(audio,${value},name);`);
replace('private nativeAudio(label:string,call:()=>void):void {',`private applyVolume(audio:AudioComponent,value:number,label:string):void {if(!audio)return;const previous=this.appliedVolumes.get(audio);if(previous===value||(previous!==undefined&&value!==0&&Math.abs(previous-value)<=.001))return;this.nativeAudio("volume:"+label,()=>{audio.volume=value;});this.appliedVolumes.set(audio,value);this.volumeWrites++;}
  private nativeAudio(label:string,call:()=>void):void {`);
replace('nativeCalls:number;slowCalls:number;maxCallMs:number}', 'nativeCalls:number;slowCalls:number;maxCallMs:number;volumeWrites:number}');
replace('maxCallMs:this.maxAudioCallMs};}', 'maxCallMs:this.maxAudioCallMs,volumeWrites:this.volumeWrites};}');
// The original silence loop has values without the loop name; preserve its existing .035 assignment.
audio=audio.replace('for(const audio of this.loops.values())this.applyVolume(audio,value?0:.035*this.duck,name);','for(const [name,audio] of this.loops)this.applyVolume(audio,value?0:.035*this.duck,name);');
if(/this\.(music|tension)\.volume[+\-]?=/.test(audio))throw Error('Uncached score volume write remains');
fs.writeFileSync(path.join(dir,'RoomscriptAudio.ts'),audio);
let narrative=read('Engine/game/NarrativeAudio.ts');const before='if(name)this.once({kind:"sfx",key,name,anchor:event.actor},out);';
if(!narrative.includes(before))throw Error('Narrative source changed');
narrative=narrative.replace(before,'if(name)this.once({kind:"sfx",key:"evidence:"+event.seq+":"+name+":"+(event.actor||""),name,anchor:event.actor},out);');
fs.writeFileSync(path.join(dir,'NarrativeAudio.ts'),narrative);
let polish=read('RoomscriptPolishLeafScenario.ts');const probe='const point=opening.cast.room.objectAnchor("O7").getTransform().getWorldPosition();';
if(!polish.includes(probe))throw Error('Polish source changed');
polish=polish.replace(probe,`// Regression: muting reaches actual native zero and identical assignments do not cross the native boundary twice.
    audio.silence(true);const mutedWrites=audio.loopDiagnostics().volumeWrites;
    for(const name of ["RoomscriptScore","RoomscriptTension","RoomscriptLoopingClock"]){const component=findSceneObjectByName(name).getComponent("Component.AudioComponent") as AudioComponent;expect(component.volume).toBe(0);}
    audio.silence(true);expect(audio.loopDiagnostics().volumeWrites).toBe(mutedWrites);audio.silence(false);
    ${probe}`);
fs.writeFileSync(path.join(dir,'RoomscriptPolishLeafScenario.ts'),polish);
fs.writeFileSync(path.join(dir,'run7-volume-dedup-sources.json'),JSON.stringify(sources,null,2)+'\n');console.log('Staged volume cache + action/cue/anchor evidence dedup. No Assets writes.');
