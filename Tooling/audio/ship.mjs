/** Offline lean export; preserves every paid master in out/staged and the request cache. */
import {read,AUDIO,ROOT,save,audioFile} from './lib.mjs';
import {resolve,dirname} from 'node:path';
import {existsSync,mkdirSync,copyFileSync,writeFileSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const target=resolve(AUDIO,'out/ship'),spec=read(resolve(AUDIO,'voice-runtime-spec.json'),null),master=read(resolve(AUDIO,'voice-manifest.json'),null);
const keys=new Set([...spec.lines.map(l=>l.speaker+'|'+l.take+'|'+l.text),...spec.sentenceKeys]),clips=master.clips.filter(c=>keys.has(c.key)).sort((a,b)=>a.key.localeCompare(b.key));
const missing=[...keys].filter(key=>!clips.some(c=>c.key===key));if(missing.length)throw Error('MISSING_RUNTIME_AUDIO '+JSON.stringify(missing));
const cues=read(resolve(AUDIO,'cue-manifest.json'),null).cues.filter(c=>c.name!=='VideoSoundtrack'),dialogues=read(resolve(AUDIO,'dialogue-manifest.json'),null).clips;
const find=audioFile,ff=resolve(AUDIO,'out/bin/ffmpeg.exe');let bytes=0;
for(const c of [...clips,...cues,...dialogues]){const dest=resolve(target,c.path);mkdirSync(dirname(dest),{recursive:true});if(c.key){if(!existsSync(dest))execFileSync(ff,['-v','error','-y','-i',find(c.path),'-ac','1','-ar','24000','-b:a','32k',dest]);}else copyFileSync(find(c.path),dest);bytes+=statSync(dest).size;}
const content=resolve(target,'Assets/Scripts/Content');mkdirSync(content,{recursive:true});
const entries=clips.map((c,index)=>({index,id:c.id,key:c.key,speaker:c.speaker,text:c.text,take:c.take,path:c.path,alignment:c.alignment,derivedFrom:c.derivedFrom}));
const write=(name,exportName,rows)=>writeFileSync(resolve(content,name),'/** Generated offline with ElevenLabs. AI voices/audio; no runtime API calls. */\nexport const '+exportName+' = '+JSON.stringify(rows,null,2)+';\n');
write('VoiceManifest.ts','VOICE_MANIFEST',entries);write('AudioManifest.ts','AUDIO_MANIFEST',cues);write('DialogueManifest.ts','DIALOGUE_MANIFEST',dialogues);
for(const name of ['HeroVariantBank.ts','HeroRegisterBank.ts'])copyFileSync(resolve(AUDIO,'out/staged/Assets/Scripts/Content',name),resolve(content,name));
const asset=c=>'requireAsset("../'+c.path.replace('Assets/','')+'") as AudioTrackAsset';
writeFileSync(resolve(target,'Assets/Scripts/RoomscriptVoiceAssets.ts'),'/** Generated literal imports; voice array matches VoiceManifest.index. */\nexport const ROOMScriptVoiceAssets: AudioTrackAsset[] = [\n'+entries.map(c=>'  '+asset(c)).join(',\n')+'\n];\nexport const ROOMScriptCueAssets: {[name:string]:AudioTrackAsset} = {\n'+cues.map(c=>'  '+JSON.stringify(c.name)+': '+asset(c)).join(',\n')+'\n};\nexport const ROOMScriptDialogueAssets: {[name:string]:AudioTrackAsset} = {\n'+dialogues.map(c=>'  '+JSON.stringify(c.name)+': '+asset(c)).join(',\n')+'\n};\n');
save(resolve(AUDIO,'ship-report.json'),{policy:'All canonical moods, tagged validated variants, registers, canonical tell takes, Wren/narration and sentence derivatives. Video audio and unfinished extra variant moods remain in Tooling.',voiceClips:clips.length,originals:clips.filter(c=>!c.derivedFrom).length,derived:clips.filter(c=>c.derivedFrom).length,sfx:30,music:cues.filter(c=>c.group==='music').length,dialogues:dialogues.length,voiceBitrateKbps:32,bytes,megabytes:Math.round(bytes/1e4)/100,missing});
console.log('Lean runtime export ready: '+clips.length+' voice clips, '+(bytes/1e6).toFixed(2)+'MB. Publish with node Tooling/audio/publish.mjs --ship at a Lens checkpoint.');
