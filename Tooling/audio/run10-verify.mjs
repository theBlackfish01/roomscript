/** Offline checks only: exact caption text, voice identity, decode, alignment and ledger. */
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {AUDIO,read,save,parseManifestExport} from './lib.mjs';
const stage=resolve(AUDIO,'out/run10'),manifest=read(resolve(AUDIO,'run10-voice-manifest.json'));
const spec=read(resolve(AUDIO,'run10-script.json')),cast=read(resolve(AUDIO,'cast.json'));
const ledger=read(resolve(AUDIO,'run10-elevenlabs-ledger.json'));
const exported=parseManifestExport(readFileSync(resolve(stage,'Assets/Scripts/Content/Run10VoiceManifest.ts'),'utf8'),'RUN10_VOICE_MANIFEST');
const imports=readFileSync(resolve(stage,'Assets/Scripts/RoomscriptRun10VoiceAssets.ts'),'utf8');
const ff=resolve(AUDIO,'out/bin/ffmpeg.exe'),failures=[],rows=[];
const fail=(id,why)=>failures.push({id,why});
const normalize=s=>s.replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
for(const row of spec.lines){
  const clips=manifest.clips.filter(c=>c.id===row.id);if(clips.length!==1){fail(row.id,'missing_or_duplicate');continue;}
  const clip=clips[0],path=resolve(stage,clip.path),index=manifest.clips.indexOf(clip);
  if(clip.text!==row.text||clip.speaker!==row.speaker)fail(row.id,'script_mismatch');
  if(clip.voiceId!==cast.voices.find(v=>v.id===row.speaker)?.voiceId)fail(row.id,'cast_mismatch');
  if(exported[index]?.id!==row.id||exported[index]?.index!==index)fail(row.id,'export_order');
  if(!imports.includes('../'+clip.path.replace('Assets/','')))fail(row.id,'missing_asset_import');
  if(!existsSync(path)){fail(row.id,'missing_audio');continue;}
  const pcm=execFileSync(ff,['-v','error','-i',path,'-f','s16le','-ac','1','-ar','24000','pipe:1'],{timeout:15000,windowsHide:true,maxBuffer:4000000});
  const duration=pcm.length/48000,a=clip.alignment;
  if(Math.abs(duration-clip.audioSeconds)>.001)fail(row.id,'duration_mismatch');
  if(normalize(a.characters.join(''))!==normalize(row.text))fail(row.id,'caption_mismatch');
  if(a.characters.length!==a.starts.length||a.starts.length!==a.ends.length)fail(row.id,'alignment_length');
  for(let i=0;i<a.starts.length;i++)if(a.starts[i]<0||a.ends[i]<a.starts[i]||a.ends[i]>clip.endSeconds-clip.startSeconds+.001||(i&&a.starts[i]<a.starts[i-1])){fail(row.id,'alignment_window');break;}
  if(clip.startSeconds<0||clip.endSeconds>duration+.001||clip.endSeconds<=clip.startSeconds)fail(row.id,'playback_window');
  rows.push({id:row.id,speaker:row.speaker,durationSeconds:duration,bytes:clip.bytes,alignedCharacters:a.characters.length});
}
if(ledger.entries.some(e=>e.status==='reserved'))fail('ledger','unresolved_reservation');
const credits=ledger.entries.reduce((n,e)=>n+e.credits,0);if(credits>15000)fail('ledger','budget');
const result={at:new Date().toISOString(),status:failures.length?'failed':'passed',lines:rows.length,expected:spec.lines.length,credits,allCreditsHeaderConfirmed:ledger.entries.every(e=>!e.estimate),bytes:rows.reduce((n,r)=>n+r.bytes,0),failures,rows,previewVerified:false,note:'Metadata and decode validation only; listening, subtitle composition and speech arbitration require Lens Preview.'};
save(resolve(AUDIO,'run10-verification.json'),result);console.log(JSON.stringify(result));if(failures.length)process.exitCode=1;
