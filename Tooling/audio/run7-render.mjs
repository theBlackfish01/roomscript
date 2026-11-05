/** Staged supplemental phrase library. Never overwrites the verified hero library. */
import {request,read,save,AUDIO,ROOT,hash,cleanAlignment,audioFile} from './lib.mjs';
import {resolve,dirname} from 'node:path';
import {mkdirSync,writeFileSync,existsSync,copyFileSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {boundedAudioWindow} from './audio-window.mjs';
const option=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];};
const spec=read(resolve(AUDIO,option('--spec')||'run7-phrase-spec.json'),null);
if(!spec?.lines)throw Error('MISSING_PHRASE_SPEC');
const group=option('--group')||'phrases',limit=Number(option('--limit')||100000),begin=Date.now();
const cast=read(resolve(AUDIO,'cast.json'),null),manifestPath=resolve(AUDIO,'run7-voice-manifest.json'),manifest=read(manifestPath,{version:1,clips:[]});
const master=read(resolve(AUDIO,'voice-manifest.json'),{clips:[]}),ff=resolve(AUDIO,'out/bin/ffmpeg.exe');
const stage=resolve(AUDIO,'out/run7');let rendered=0,reused=0;
for(const row of spec.lines){
  if((row.group||'phrases')!==group)continue;
  const text=row.text.trim().replace(/\s+/g,' ');if(!/[\p{L}\p{N}]/u.test(text))continue;
  const voice=cast.voices.find(v=>v.id===row.speaker);if(!voice?.voiceId)throw Error('MISSING_CAST_'+row.speaker);
  const key=row.speaker+'|steady|'+text,old=manifest.clips.find(c=>c.key===key&&c.voiceId===voice.voiceId);
  if(old&&existsSync(resolve(stage,old.path)))continue;
  if(old&&existsSync(resolve(ROOT,old.path))){mkdirSync(dirname(resolve(stage,old.path)),{recursive:true});copyFileSync(resolve(ROOT,old.path),resolve(stage,old.path));reused++;continue;}
  if(rendered>=limit||Date.now()-begin>300000)break;
  const prior=master.clips.find(c=>c.speaker===row.speaker&&c.text.trim().replace(/\s+/g,' ')===text&&c.take==='steady'&&c.voiceId===voice.voiceId&&!c.derivedFrom);
  if(prior){const path='Assets/Audio/Run7/'+row.speaker+'/'+prior.identity.slice(0,20)+'.mp3';mkdirSync(dirname(resolve(stage,path)),{recursive:true});copyFileSync(audioFile(prior.path),resolve(stage,path));manifest.clips=manifest.clips.filter(c=>c.key!==key);manifest.clips.push({...prior,key,text,path,group,reused:true});save(manifestPath,manifest);reused++;continue;}
  const body={text:'[calm] '+text,model_id:'eleven_v3',voice_settings:{stability:1,similarity_boost:.75,use_speaker_boost:true},seed:1041};
  const identity=hash({voiceId:voice.voiceId,...body}),path='Assets/Audio/Run7/'+row.speaker+'/'+identity.slice(0,20)+'.mp3';
  const result=await request('/v1/text-to-speech/'+voice.voiceId+'/with-timestamps?output_format=mp3_44100_128',body,{label:'run7:'+group+':'+row.speaker+':'+row.id,estimate:Math.max(100,body.text.length*2),json:true});
  const raw=resolve(AUDIO,'out/'+identity+'.mp3'),dest=resolve(stage,path);writeFileSync(raw,Buffer.from(result.data.audio_base64,'base64'));mkdirSync(dirname(dest),{recursive:true});
  execFileSync(ff,['-v','error','-y','-i',raw,'-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ac','1','-ar','24000','-b:a','32k',dest],{stdio:'pipe',timeout:60000,windowsHide:true});
  const alignment=cleanAlignment(result.data.normalized_alignment||result.data.alignment);
  const clip={id:row.id,key,identity,speaker:row.speaker,text,take:'steady',path,voiceId:voice.voiceId,alignment,group};
  manifest.clips=manifest.clips.filter(c=>c.key!==key);manifest.clips.push(clip);save(manifestPath,manifest);rendered++;console.log('run7 '+group+' '+row.speaker+' '+rendered);
}
manifest.clips.sort((a,b)=>a.key.localeCompare(b.key));save(manifestPath,manifest);
const content=resolve(stage,'Assets/Scripts/Content');mkdirSync(content,{recursive:true});
const entries=manifest.clips.map((c,index)=>{const pcm=execFileSync(ff,['-v','error','-i',resolve(stage,c.path),'-f','s16le','-ac','1','-ar','24000','pipe:1'],{timeout:15000,windowsHide:true,maxBuffer:10000000});const audioSeconds=pcm.length/48000;return {...c,index,audioSeconds,...boundedAudioWindow(c.alignment,audioSeconds)};});
writeFileSync(resolve(content,'Run7VoiceManifest.ts'),'/** Offline ElevenLabs supplemental phrases/narration. Exact text lookup; engine authorizes speech. */\nexport const RUN7_VOICE_MANIFEST = '+JSON.stringify(entries,null,2)+';\n');
writeFileSync(resolve(stage,'Assets/Scripts/RoomscriptRun7VoiceAssets.ts'),'/** Generated supplemental imports, independent of hero indices. */\nexport const ROOMScriptRun7VoiceAssets:AudioTrackAsset[] = [\n'+entries.map(c=>'  requireAsset("../'+c.path.replace('Assets/','')+'") as AudioTrackAsset').join(',\n')+'\n];\n');
console.log(JSON.stringify({rendered,reused,clips:entries.length,bytes:entries.reduce((n,c)=>n+statSync(resolve(stage,c.path)).size,0)}));
