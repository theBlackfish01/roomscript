/** Staged supplemental phrase library. Never overwrites the verified hero library. */
import {request,read,save,AUDIO,ROOT,hash,cleanAlignment,audioFile,parseManifestExport} from './lib.mjs';
import {resolve,dirname} from 'node:path';
import {mkdirSync,writeFileSync,readFileSync,existsSync,copyFileSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {boundedAudioWindow} from './audio-window.mjs';
const option=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];};
const spec=read(resolve(AUDIO,option('--spec')||'run7-phrase-spec.json'),null);
if(!spec?.lines)throw Error('MISSING_PHRASE_SPEC');
const group=option('--group')||'phrases',limit=Number(option('--limit')||100000),begin=Date.now();
const cast=read(resolve(AUDIO,'cast.json'),null),manifestPath=resolve(AUDIO,'run7-voice-manifest.json'),manifest=read(manifestPath,{version:1,clips:[]});
const master=read(resolve(AUDIO,'voice-manifest.json'),{clips:[]}),ff=resolve(AUDIO,'out/bin/ffmpeg.exe');
const stage=resolve(AUDIO,'out/run7');let rendered=0,reused=0;
const existingExport=resolve(stage,'Assets/Scripts/Content/Run7VoiceManifest.ts');
const verifiedWindows=process.argv.includes('--reuse-verified-windows')&&existsSync(existingExport)?new Map(parseManifestExport(readFileSync(existingExport,'utf8'),'RUN7_VOICE_MANIFEST').map(record=>[record.identity,record])):new Map();
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
  let identity,path,result;
  for(let attempt=0;attempt<6;attempt++){
    // A trailing punctuation variant has identical spoken words and can rescue a very short noun.
    const renderedText=attempt>=3&&!/[.!?]$/.test(text)?text+'.':text;
    const body={text:'[calm] '+renderedText,model_id:'eleven_v3',voice_settings:{stability:1,similarity_boost:.75,use_speaker_boost:true},seed:1041+attempt%3};
    identity=hash({voiceId:voice.voiceId,...body});path='Assets/Audio/Run7/'+row.speaker+'/'+identity.slice(0,20)+'.mp3';
    const candidate=await request('/v1/text-to-speech/'+voice.voiceId+'/with-timestamps?output_format=mp3_44100_128',body,{label:'run7:'+group+':'+row.speaker+':'+row.id+(attempt?':retry'+attempt:''),estimate:Math.max(100,body.text.length*2),json:true});
    const bytes=Buffer.from(candidate.data.audio_base64||'','base64'),raw=resolve(AUDIO,'out/'+identity+'.mp3'),dest=resolve(stage,path);let failure='provider_empty_audio';
    if(bytes.length>=128){writeFileSync(raw,bytes);mkdirSync(dirname(dest),{recursive:true});try{execFileSync(ff,['-v','error','-y','-i',raw,'-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ac','1','-ar','24000','-b:a','32k',dest],{stdio:'pipe',timeout:60000,windowsHide:true});result=candidate;break;}catch{failure='provider_audio_decode_failed';}}
    const failuresPath=resolve(AUDIO,'run7-generation-retries.json'),failures=read(failuresPath,{failures:[]});if(!failures.failures.some(row=>row.identity===identity)){failures.failures.push({identity,id:row.id,speaker:row.speaker,seed:body.seed,punctuationVariant:attempt>=3,reason:failure,chargedRequestRetainedInLedger:true});save(failuresPath,failures);}console.log('run7 retry '+row.speaker+' '+failure);
  }
  if(!result){console.log('run7 missing after bounded retries '+row.id);continue;}
  const alignment=cleanAlignment(result.data.normalized_alignment||result.data.alignment);
  const clip={id:row.id,key,identity,speaker:row.speaker,text,take:'steady',path,voiceId:voice.voiceId,alignment,group};
  manifest.clips=manifest.clips.filter(c=>c.key!==key);manifest.clips.push(clip);save(manifestPath,manifest);rendered++;console.log('run7 '+group+' '+row.speaker+' '+rendered);
}
manifest.clips.sort((a,b)=>a.key.localeCompare(b.key));save(manifestPath,manifest);
const content=resolve(stage,'Assets/Scripts/Content');mkdirSync(content,{recursive:true});
const entries=manifest.clips.map((c,index)=>{const prior=verifiedWindows.get(c.identity);if(prior&&prior.path===c.path&&prior.text===c.text&&Number.isFinite(prior.audioSeconds))return {...prior,...c,index,alignment:prior.alignment,audioSeconds:prior.audioSeconds,startSeconds:prior.startSeconds,endSeconds:prior.endSeconds};const pcm=execFileSync(ff,['-v','error','-i',resolve(stage,c.path),'-f','s16le','-ac','1','-ar','24000','pipe:1'],{timeout:15000,windowsHide:true,maxBuffer:10000000});const audioSeconds=pcm.length/48000;return {...c,index,audioSeconds,...boundedAudioWindow(c.alignment,audioSeconds)};});
writeFileSync(resolve(content,'Run7VoiceManifest.ts'),'/** Offline ElevenLabs supplemental phrases/narration. Exact text lookup; engine authorizes speech. */\nexport const RUN7_VOICE_MANIFEST = '+JSON.stringify(entries,null,2)+';\n');
writeFileSync(resolve(stage,'Assets/Scripts/RoomscriptRun7VoiceAssets.ts'),'/** Generated supplemental imports, independent of hero indices. */\nexport const ROOMScriptRun7VoiceAssets:AudioTrackAsset[] = [\n'+entries.map(c=>'  requireAsset("../'+c.path.replace('Assets/','')+'") as AudioTrackAsset').join(',\n')+'\n];\n');
console.log(JSON.stringify({rendered,reused,clips:entries.length,bytes:entries.reduce((n,c)=>n+statSync(resolve(stage,c.path)).size,0)}));
