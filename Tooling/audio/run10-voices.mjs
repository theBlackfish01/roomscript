/** Run 10 staged voices. No Lens writes; paid calls are serial and separately ledgered. */
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {loadEnvFile} from 'node:process';
import {execFileSync} from 'node:child_process';
import {AUDIO,ROOT,read,save,hash,cleanAlignment} from './lib.mjs';
import {boundedAudioWindow} from './audio-window.mjs';

const spec=read(resolve(AUDIO,'run10-script.json'),null);
const document=readFileSync(resolve(ROOT,'docs/SCRIPT_2026-11-08.md'),'utf8');
const forbidden=/\b(witness(?:es)?|memor(?:y|ies)|pinch(?:es|ing)?|taps?|buttons?|notebooks?|palms?|drags?|tokens?)\b/i;
for(const row of [...spec.lines,...spec.retained]){
  if(forbidden.test(row.text))throw Error('WORDING_REJECTED_'+row.id);
  if(!document.includes(row.text))throw Error('SCRIPT_NOT_DOCUMENTED_'+row.id);
  if(row.speaker==='WREN'&&!row.text.endsWith('?'))throw Error('WREN_NOT_QUESTION_'+row.id);
}
console.log('RUN10_WORDING_PASS '+(spec.lines.length+spec.retained.length));
if(process.argv.includes('--check'))process.exit(0);

const stage=resolve(AUDIO,'out/run10'),cache=resolve(stage,'cache');mkdirSync(cache,{recursive:true});
const ledgerPath=resolve(AUDIO,'run10-elevenlabs-ledger.json');
const ledger=read(ledgerPath,{version:1,segment:'run10-2026-11-08',allowanceCredits:15000,entries:[]});
const manifestPath=resolve(AUDIO,'run10-voice-manifest.json'),manifest=read(manifestPath,{version:1,clips:[]});
const cast=read(resolve(AUDIO,'cast.json'),null),ff=resolve(AUDIO,'out/bin/ffmpeg.exe');
const total=()=>ledger.entries.reduce((n,e)=>n+e.credits,0);
const note=()=>{ledger.totalCredits=total();save(ledgerPath,ledger);};
const limitAt=process.argv.indexOf('--limit'),limit=limitAt<0?18:Number(process.argv[limitAt+1]);
const shared=read(resolve(ROOT,'Tooling/results/elevenlabs-ledger.json'),{});
if(shared.providerBlock)throw Error('EXISTING_PROVIDER_BLOCK');
if(ledger.providerBlock)throw Error('RUN10_PROVIDER_BLOCK');
loadEnvFile(resolve(ROOT,'Tooling/.env'));
const key=process.env.ELEVENLABS_API_KEY;if(!key)throw Error('MISSING_ELEVENLABS_KEY');
const lock=resolve(AUDIO,'out/request.lock');let lockFd;
try{lockFd=openSync(lock,'wx');}catch{throw Error('AUDIO_GENERATOR_ALREADY_RUNNING');}
let generated=0;const began=Date.now();
try{
  for(const row of spec.lines){
    if(generated>=limit||Date.now()-began>270000)break;
    const voiceId=cast.voices.find(v=>v.id===row.speaker)?.voiceId;if(!voiceId)throw Error('MISSING_CAST');
    const whisper=row.speaker==='WREN';
    const body={text:(row.direction||(whisper?'[whispers]':'[calm]'))+' '+row.text,model_id:'eleven_v3',voice_settings:{stability:row.stability??(whisper?.5:1),similarity_boost:.75,use_speaker_boost:true},seed:row.seed||1041};
    const endpoint='/v1/text-to-speech/'+voiceId+'/with-timestamps?output_format=mp3_44100_128';
    const identity=hash({endpoint,body}),responsePath=resolve(cache,identity+'.json');
    const old=manifest.clips.find(c=>c.id===row.id&&c.identity===identity);
    if(old&&existsSync(resolve(stage,old.path)))continue;
    let data;
    const priorMeta=read(resolve(AUDIO,'out/cache',identity+'.json'),null),priorBin=resolve(AUDIO,'out/cache',identity+'.bin');
    let reusedPriorRequest=false;
    if(existsSync(responsePath))data=read(responsePath,null);
    else if(priorMeta?.complete&&existsSync(priorBin)){data=JSON.parse(readFileSync(priorBin,'utf8'));save(responsePath,data);reusedPriorRequest=true;}
    else{
      if(ledger.entries.some(e=>e.id===identity&&['reserved','complete'].includes(e.status)))throw Error('UNRESOLVED_OR_MISSING_CACHE_'+row.id);
      const estimate=Math.max(100,body.text.length*2);if(total()+estimate>ledger.allowanceCredits)throw Error('RUN10_CREDIT_CAP');
      const entry={id:identity,label:'run10:'+row.speaker+':'+row.id,segment:ledger.segment,status:'reserved',credits:estimate,estimate:true,at:new Date().toISOString()};ledger.entries.push(entry);note();
      let response;
      try{response=await fetch('https://api.elevenlabs.io'+endpoint,{method:'POST',headers:{'xi-api-key':key,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(240000)});}
      catch{throw Error('NETWORK_UNCERTAIN_RESERVATION_RETAINED_'+row.id);}
      const raw=await response.text(),header=response.headers.get('character-cost'),cost=header===null?NaN:Number(header);
      if(Number.isFinite(cost)&&cost>=0){entry.credits=cost;entry.estimate=false;}
      entry.status=response.ok?'complete':'failed';note();
      if(!response.ok){let reason='';try{reason=String(JSON.parse(raw).detail?.status||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);}catch{}
        if(/quota/.test(reason)){ledger.providerBlock={reason,at:new Date().toISOString()};note();}throw Error('ELEVENLABS_HTTP_'+response.status+'_'+reason);}
      try{data=JSON.parse(raw);}catch{throw Error('PROVIDER_INVALID_JSON_'+row.id);}save(responsePath,data);
    }
    const bytes=Buffer.from(data.audio_base64||'','base64');if(bytes.length<128)throw Error('PROVIDER_EMPTY_AUDIO_'+row.id);
    const raw=resolve(cache,identity+'.mp3'),path='Assets/Audio/Run10/'+row.speaker+'/'+row.id+'.mp3',dest=resolve(stage,path);
    writeFileSync(raw,bytes);mkdirSync(dirname(dest),{recursive:true});
    execFileSync(ff,['-v','error','-y','-i',raw,'-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ac','1','-ar','24000','-b:a','32k',dest],{timeout:60000,windowsHide:true,stdio:'pipe'});
    const pcm=execFileSync(ff,['-v','error','-i',dest,'-f','s16le','-ac','1','-ar','24000','pipe:1'],{timeout:20000,windowsHide:true,maxBuffer:4000000});
    const seconds=pcm.length/48000,alignment=cleanAlignment(data.normalized_alignment||data.alignment);
    const normalize=s=>s.replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
    if(normalize(alignment?.characters.join('')||'')!==normalize(row.text))throw Error('ALIGNMENT_TEXT_MISMATCH_'+row.id);
    const window=boundedAudioWindow(alignment,seconds);if(window.alignmentBounded)throw Error('ALIGNMENT_EXCEEDS_AUDIO_'+row.id);
    let energy=0,peak=0;for(let i=0;i<pcm.length;i+=2){const v=pcm.readInt16LE(i)/32768;energy+=v*v;peak=Math.max(peak,Math.abs(v));}
    const rmsDb=20*Math.log10(Math.sqrt(energy/(pcm.length/2))||1e-9);if(rmsDb< -45||seconds<.3)throw Error('SILENT_OR_SHORT_'+row.id);
    const clip={...row,key:row.speaker+'|steady|'+row.text,take:'steady',identity,path,voiceId,model:'eleven_v3',audioSeconds:seconds,...window,bytes:statSync(dest).size,rmsDb,peakDb:20*Math.log10(peak||1e-9),...(reusedPriorRequest?{reusedPriorRequest:true}:{} )};
    manifest.clips=manifest.clips.filter(c=>c.id!==row.id);manifest.clips.push(clip);save(manifestPath,manifest);generated++;
    console.log('RUN10_VOICE '+row.id+' '+seconds.toFixed(2)+'s');
  }
}finally{if(lockFd!==undefined){closeSync(lockFd);unlinkSync(lock);}note();}
const entries=manifest.clips.map((c,index)=>({...c,index}));
const content=resolve(stage,'Assets/Scripts/Content');mkdirSync(content,{recursive:true});
writeFileSync(resolve(content,'Run10VoiceManifest.ts'),'/** Authored Run 10 speech, ElevenLabs cast voices with character alignment. */\nexport const RUN10_VOICE_MANIFEST = '+JSON.stringify(entries)+';\n');
writeFileSync(resolve(stage,'Assets/Scripts/RoomscriptRun10VoiceAssets.ts'),'/** Generated Run 10 speech assets, manifest index order. */\nexport const ROOMScriptRun10VoiceAssets:AudioTrackAsset[] = [\n'+entries.map(c=>'  requireAsset("../'+c.path.replace('Assets/','')+'") as AudioTrackAsset').join(',\n')+'\n];\n');
console.log(JSON.stringify({generated,clips:entries.length,expected:spec.lines.length,credits:total(),bytes:entries.reduce((n,c)=>n+c.bytes,0)}));
