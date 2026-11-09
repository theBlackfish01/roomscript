/** Existing cast, whole conversational takes, serial paid requests with durable receipts. */
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {loadEnvFile} from 'node:process';
import {execFileSync} from 'node:child_process';
import {AUDIO,ROOT,read,save,hash,cleanAlignment,ledgerPath,reserve,settle} from './lib.mjs';
import {boundedAudioWindow} from './audio-window.mjs';
const source=readFileSync(resolve(ROOT,'Assets/Scripts/Content/HarlowDialogue.ts'),'utf8');
const accounts=JSON.parse(source.split('export const HARLOW_DIALOGUE = ')[1].split('\n];')[0]+']');
const items=readFileSync(resolve(ROOT,'Assets/Scripts/Content/HarlowItemObservations.ts'),'utf8');
const rows=accounts.flatMap(r=>['text','alternate','press'].filter(k=>r[k]).map(k=>({id:'HN_'+r.id+'_'+k,speaker:r.speaker,text:r[k],direction:r.direction})))
 .concat([...items.matchAll(/(O\d+):"([^"]+)"/g)].map(m=>({id:'HN_'+m[1],speaker:'NARRATOR',text:m[2],direction:'[thoughtful]'})));
const document=readFileSync(resolve(ROOT,'docs/SCRIPT_2026-11-08.md'),'utf8');
for(const r of rows)if(!document.includes(r.text)||r.text.length>220||/\b(witness|memory|pinch|tap|button|notebook|palm|drag|token)\b/i.test(r.text))throw Error('WORDING_NOT_APPROVED_'+r.id);
if(process.argv.includes('--check')){console.log('NATURAL_WORDING_PASS '+rows.length);process.exit(0);}
const stage=resolve(AUDIO,'out/harlow-natural'),cache=resolve(stage,'cache');mkdirSync(cache,{recursive:true});
const manifestPath=resolve(AUDIO,'harlow-natural-manifest.json'),manifest=read(manifestPath,{version:1,clips:[]});
const ledger=read(ledgerPath,null);if(ledger.providerBlock)throw Error('EXISTING_PROVIDER_BLOCK');
const cast=read(resolve(AUDIO,'cast.json'),null),ff=resolve(AUDIO,'out/bin/ffmpeg.exe');
loadEnvFile(resolve(ROOT,'Tooling/.env'));const key=process.env.ELEVENLABS_API_KEY;if(!key)throw Error('MISSING_KEY');
const lock=resolve(AUDIO,'out/request.lock'),fd=openSync(lock,'wx'),began=Date.now();let generated=0;
try{for(const row of rows){
 if(Date.now()-began>510000)throw Error('GENERATION_BATCH_TIME_LIMIT');
 const voiceId=cast.voices.find(v=>v.id===row.speaker)?.voiceId;if(!voiceId)throw Error('MISSING_CAST');
 const body={text:row.direction+' '+row.text,model_id:'eleven_v3',voice_settings:{stability:.5,similarity_boost:.75,use_speaker_boost:true},seed:104111};
 const endpoint='/v1/text-to-speech/'+voiceId+'/with-timestamps?output_format=mp3_44100_128',identity=hash({endpoint,body});
 const previous=manifest.clips.find(c=>c.id===row.id&&c.identity===identity);if(previous&&existsSync(resolve(stage,previous.path)))continue;
 const cached=resolve(cache,identity+'.json');let data=read(cached,null);
 if(!data){reserve(ledger,identity,Math.max(100,body.text.length*2),'harlow-natural:'+row.id);save(ledgerPath,ledger);
  let response;try{response=await fetch('https://api.elevenlabs.io'+endpoint,{method:'POST',headers:{'xi-api-key':key,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});}catch{throw Error('NETWORK_UNCERTAIN_RESERVATION_RETAINED_'+row.id);}
  const raw=await response.text();settle(ledger,identity,response.headers.get('character-cost'),response.ok);save(ledgerPath,ledger);
  if(!response.ok){let reason='';try{reason=String(JSON.parse(raw).detail?.status||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,70);}catch{}
   if(/quota/.test(reason)){ledger.providerBlock={reason,at:new Date().toISOString()};save(ledgerPath,ledger);}throw Error('ELEVENLABS_HTTP_'+response.status+'_'+reason);}
  data=JSON.parse(raw);save(cached,data);generated++;
 }
 const raw=resolve(cache,identity+'.mp3'),path='Assets/Audio/HarlowNatural/'+row.speaker+'/'+row.id+'.mp3',dest=resolve(stage,path);
 writeFileSync(raw,Buffer.from(data.audio_base64,'base64'));mkdirSync(dirname(dest),{recursive:true});
 execFileSync(ff,['-v','error','-y','-i',raw,'-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ar','44100','-ac','2','-b:a','128k',dest],{timeout:20000,windowsHide:true});
 const pcm=execFileSync(ff,['-v','error','-i',dest,'-f','s16le','-ar','24000','-ac','1','pipe:1'],{timeout:20000,windowsHide:true,maxBuffer:4000000});
 const seconds=pcm.length/48000,alignment=cleanAlignment(data.normalized_alignment||data.alignment),normalize=s=>s.replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
 if(normalize(alignment?.characters.join('')||'')!==normalize(row.text))throw Error('ALIGNMENT_TEXT_MISMATCH_'+row.id);
 const window=boundedAudioWindow(alignment,seconds);if(window.alignmentBounded)throw Error('ALIGNMENT_EXCEEDS_AUDIO_'+row.id);
 const words=row.text.split(/\s+/).length,wpm=words/seconds*60;if(wpm>245||seconds<1)throw Error('VOICE_PACE_REVIEW_'+row.id);
 const clip={...row,key:row.speaker+'|steady|'+row.text,take:'steady',path,identity,voiceId,audioSeconds:seconds,wpm,alignment};
 manifest.clips=manifest.clips.filter(c=>c.id!==row.id);manifest.clips.push(clip);save(manifestPath,manifest);console.log('NATURAL_VOICE '+row.id+' '+seconds.toFixed(2)+'s '+wpm.toFixed(0)+'wpm');
}}finally{closeSync(fd);unlinkSync(lock);}
if(rows.some(r=>!manifest.clips.some(c=>c.id===r.id)))throw Error('INCOMPLETE_BATCH');
// Preserve every previous index; install complete recordings only. Normalizer adds silence from these originals.
const manifestFile=resolve(ROOT,'Assets/Scripts/Content/VoiceManifest.ts'),text=readFileSync(manifestFile,'utf8'),prefix=text.indexOf(' = ')+3;
const records=JSON.parse(text.slice(prefix).trim().replace(/;$/,''));
for(const row of rows){const c=manifest.clips.find(c=>c.id===row.id),old=records.findIndex(r=>r.id===c.id);if(old>=0)continue;records.push({...c,index:records.length});const dest=resolve(ROOT,c.path);mkdirSync(dirname(dest),{recursive:true});copyFileSync(resolve(stage,c.path),dest);}
writeFileSync(manifestFile,text.slice(0,prefix)+'[\n'+records.map(r=>JSON.stringify(r)).join(',\n')+'\n];\n');
const assetFile=resolve(ROOT,'Assets/Scripts/RoomscriptVoiceAssets.ts'),asset=readFileSync(assetFile,'utf8'),end=asset.indexOf('];')+2;
writeFileSync(assetFile,asset.slice(0,asset.indexOf('[\n')+2)+records.map(r=>'  requireAsset("../'+r.path.replace('Assets/','')+'") as AudioTrackAsset').join(',\n')+'\n];'+asset.slice(end));
console.log(JSON.stringify({generated,installed:rows.length,credits:ledger.entries.filter(e=>e.label?.startsWith('harlow-natural:')).reduce((n,e)=>n+e.credits,0)}));
