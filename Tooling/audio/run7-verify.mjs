/** Verify the staged supplemental library without importing into Lens Studio. */
import {read,AUDIO,parseManifestExport,ledgerPath,total} from './lib.mjs';
import {resolve} from 'node:path';
import {readFileSync,statSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const stage=resolve(AUDIO,'out/run7'),manifest=read(resolve(AUDIO,'run7-voice-manifest.json'),{clips:[]});
const expected=['run7-phrase-spec.json','run7-phrase-spec-v2.json','run7-phrase-spec-v3.json','run7-phrase-spec-v4.json','run7-narration-spec.json','run7-scan-narration-spec.json'].flatMap(p=>read(resolve(AUDIO,p),{lines:[]}).lines);
const key=r=>r.speaker+'|steady|'+r.text.trim().replace(/\s+/g,' '),keys=new Set(manifest.clips.map(key));
const missing=expected.filter(r=>/[\p{L}\p{N}]/u.test(r.text)&&!keys.has(key(r))).map(key);
const exported=parseManifestExport(readFileSync(resolve(stage,'Assets/Scripts/Content/Run7VoiceManifest.ts'),'utf8'),'RUN7_VOICE_MANIFEST');
if(keys.size!==manifest.clips.length)throw Error('DUPLICATE_KEY');
if(exported.length!==manifest.clips.length)throw Error('STALE_EXPORT');
const voices=new Map(read(resolve(AUDIO,'cast.json')).voices.map(v=>[v.id,v.voiceId]));
let bytes=0,duration=0;
for(const [index,c] of exported.entries()){
  if(c.index!==index||c.voiceId!==voices.get(c.speaker))throw Error('WRONG_CAST_OR_INDEX '+c.key);
  const a=c.alignment,n=a?.characters.length;
  if(!n||a.starts.length!==n||a.ends.length!==n||!(c.endSeconds>c.startSeconds))throw Error('BAD_ALIGNMENT '+c.key);
  for(let i=0;i<n;i++)if(!Number.isFinite(a.starts[i])||a.starts[i]<0||a.ends[i]<a.starts[i]||(i&&a.starts[i]<a.starts[i-1]))throw Error('BAD_ALIGNMENT_TIME '+c.key);
  const file=resolve(stage,c.path);bytes+=statSync(file).size;
  const pcm=execFileSync(resolve(AUDIO,'out/bin/ffmpeg.exe'),['-v','error','-i',file,'-f','s16le','-ac','1','-ar','24000','pipe:1'],{timeout:15000,windowsHide:true,maxBuffer:10000000});
  const seconds=pcm.length/48000;duration+=seconds;
  if(!seconds||c.startSeconds>=seconds||a.ends.at(-1)>seconds-c.startSeconds+.15)throw Error('AUDIO_ALIGNMENT_OUT_OF_BOUNDS '+c.key);
}
const cues=read(resolve(AUDIO,'run7-cue-manifest.json'),{cues:[]});
for(const c of cues.cues){const file=resolve(stage,c.path);bytes+=statSync(file).size;execFileSync(resolve(AUDIO,'out/bin/ffmpeg.exe'),['-v','error','-i',file,'-f','null','-'],{timeout:15000,windowsHide:true});}
const ledger=read(ledgerPath),entries=ledger.entries.filter(e=>e.segment==='run7-2026-11-05');
const result={at:new Date().toISOString(),clips:exported.length,cues:cues.cues.length,bytes,audioSeconds:Number(duration.toFixed(3)),missing,run7Credits:entries.reduce((n,e)=>n+e.credits,0),run7Estimates:entries.filter(e=>e.estimate).length,accountedTotal:total(ledger),providerBlock:ledger.providerBlock||null};
writeFileSync(resolve(AUDIO,'run7-verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
if(missing.length||cues.cues.length!==4)process.exitCode=1;
