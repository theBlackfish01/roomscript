/** Lean export: preserve paid masters, trim only alignment-external silence, share sentence audio. */
import {read,AUDIO,ROOT,save,audioFile,hash} from './lib.mjs';
import {trimWindow,shiftAlignment,sentenceAlias} from './segments.mjs';
import {resolve,dirname} from 'node:path';
import {existsSync,mkdirSync,copyFileSync,writeFileSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const target=resolve(AUDIO,'out/ship'),spec=read(resolve(AUDIO,'voice-runtime-spec.json'),null),master=read(resolve(AUDIO,'voice-manifest.json'),null);
const keys=new Set([...spec.lines.map(l=>l.speaker+'|'+l.take+'|'+l.text),...spec.sentenceKeys]),clips=master.clips.filter(c=>keys.has(c.key)).sort((a,b)=>a.key.localeCompare(b.key));
const missing=[...keys].filter(key=>!clips.some(c=>c.key===key));if(missing.length)throw Error('MISSING_RUNTIME_AUDIO '+JSON.stringify(missing));
const cues=read(resolve(AUDIO,'cue-manifest.json'),null).cues.filter(c=>c.name!=='VideoSoundtrack'),dialogues=read(resolve(AUDIO,'dialogue-manifest.json'),null).clips;
const sources=new Map();for(const c of clips){const source=c.derivedFrom?master.clips.find(o=>o.identity===c.derivedFrom&&!o.derivedFrom):c;if(!source)throw Error('MISSING_ORIGINAL '+c.key);sources.set(source.identity,source);}
const ff=resolve(AUDIO,'out/bin/ffmpeg.exe'),windows=new Map();let bytes=0;
for(const c of sources.values()){
 const window=trimWindow(c);windows.set(c.identity,window);const dest=resolve(target,c.path);mkdirSync(dirname(dest),{recursive:true});
 // Hero voices retain 40 kbps. Extra choices use 32 kbps to fit the whole-case budget.
 const bitrate=(/^r[0-9a-f]+$/.test(c.id)&&c.take==='steady')||c.take==='tell'||['NARRATOR','WREN','V'].includes(c.speaker)||c.id.startsWith('arrival-')?40:32;
 const signature=hash({identity:c.identity,window,bitrate,version:2}),stamp=dest+'.encode.json';
 if(!existsSync(dest)||read(stamp,null)?.signature!==signature){execFileSync(ff,['-v','error','-y','-ss',String(window.from),'-i',audioFile(c.path),'-t',String(window.until-window.from),'-ac','1','-ar','24000','-b:a',bitrate+'k',dest],{timeout:60000,windowsHide:true});save(stamp,{signature,bitrate});}
 bytes+=statSync(dest).size;
}
for(const c of [...cues,...dialogues]){const dest=resolve(target,c.path);mkdirSync(dirname(dest),{recursive:true});if(c.group==='sfx')execFileSync(ff,['-v','error','-y','-i',audioFile(c.path),'-ac','1','-ar','24000','-b:a','32k',dest],{timeout:60000,windowsHide:true});else copyFileSync(audioFile(c.path),dest);bytes+=statSync(dest).size;}
const content=resolve(target,'Assets/Scripts/Content');mkdirSync(content,{recursive:true});
const entries=clips.map((clip,index)=>{const source=sources.get(clip.derivedFrom||clip.identity),window=windows.get(source.identity),c=clip.derivedFrom?sentenceAlias(clip,source,window):{...clip,alignment:shiftAlignment(clip.alignment,window.from)};return {index,id:c.id,key:c.key,speaker:c.speaker,text:c.text,take:c.take,path:c.path,voiceId:c.voiceId,alignment:c.alignment,derivedFrom:c.derivedFrom,startSeconds:c.startSeconds,endSeconds:c.endSeconds};});
const write=(name,exportName,rows)=>writeFileSync(resolve(content,name),'/** Generated offline with ElevenLabs. AI voices/audio; no runtime API calls. */\nexport const '+exportName+' = '+JSON.stringify(rows,null,2)+';\n');
write('VoiceManifest.ts','VOICE_MANIFEST',entries);write('AudioManifest.ts','AUDIO_MANIFEST',cues);write('DialogueManifest.ts','DIALOGUE_MANIFEST',dialogues);
for(const name of ['HeroVariantBank.ts','HeroRegisterBank.ts']){const source=resolve(AUDIO,'out/staged/Assets/Scripts/Content',name);copyFileSync(existsSync(source)?source:resolve(ROOT,'Assets/Scripts/Content',name),resolve(content,name));}
const asset=c=>'requireAsset("../'+c.path.replace('Assets/','')+'") as AudioTrackAsset';
writeFileSync(resolve(target,'Assets/Scripts/RoomscriptVoiceAssets.ts'),'/** Generated imports; sentence entries share the original AudioTrackAsset. */\nexport const ROOMScriptVoiceAssets: AudioTrackAsset[] = [\n'+entries.map(c=>'  '+asset(c)).join(',\n')+'\n];\nexport const ROOMScriptCueAssets: {[name:string]:AudioTrackAsset} = {\n'+cues.map(c=>'  '+JSON.stringify(c.name)+': '+asset(c)).join(',\n')+'\n};\nexport const ROOMScriptDialogueAssets: {[name:string]:AudioTrackAsset} = {\n'+dialogues.map(c=>'  '+JSON.stringify(c.name)+': '+asset(c)).join(',\n')+'\n};\n');
save(resolve(AUDIO,'ship-report.json'),{policy:'All runtime canonical moods, validated variants/registers, tell takes, Wren/narration. Sentence rows alias full MP3s with startSeconds/endSeconds. Trim alignment-external silence only. Paid masters preserved in Tooling.',voiceClips:clips.length,uniqueVoiceAssets:sources.size,originals:clips.filter(c=>!c.derivedFrom).length,derived:clips.filter(c=>c.derivedFrom).length,sfx:cues.filter(c=>c.group==='sfx').length,music:cues.filter(c=>c.group==='music').length,dialogues:dialogues.length,voiceBitrateKbps:'40 canonical steady/narrator/tell; 32 extra moods/variants/registers',sfxBitrateKbps:32,musicBitrateKbps:64,bytes,megabytes:Math.round(bytes/1e4)/100,missing});
console.log('Runtime export: '+clips.length+' voice entries / '+sources.size+' unique tracks, '+(bytes/1e6).toFixed(2)+'MB.');
if(bytes>10000000)throw Error('AUDIO_SIZE_EXCEEDS_10_MB');
