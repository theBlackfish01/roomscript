/** Metadata/hash audit only: old decode results reused; the renderer decoded each new clip once. */
import {read,AUDIO,ROOT,parseManifestExport,total,ledgerPath} from './lib.mjs';
import {resolve} from 'node:path';import {readFileSync,writeFileSync,statSync,existsSync} from 'node:fs';
const stage=resolve(AUDIO,'out/run7'),records=parseManifestExport(readFileSync(resolve(stage,'Assets/Scripts/Content/Run7VoiceManifest.ts'),'utf8'),'RUN7_VOICE_MANIFEST'),live=parseManifestExport(readFileSync(resolve(ROOT,'Assets/Scripts/Content/Run7VoiceManifest.ts'),'utf8'),'RUN7_VOICE_MANIFEST'),old=new Map(live.map(record=>[record.key,record]));
const cast=new Map(read(resolve(AUDIO,'cast.json')).voices.map(v=>[v.id,v.voiceId])),imports=[...readFileSync(resolve(stage,'Assets/Scripts/RoomscriptRun7VoiceAssets.ts'),'utf8').matchAll(/requireAsset\("\.\.\/([^"\n]+)"\)/g)].map(match=>'Assets/'+match[1]);
if(imports.length!==records.length||new Set(records.map(record=>record.key)).size!==records.length)throw Error('Manifest/import mismatch');
let oldBytesVerified=0,newClips=0,audioBytes=0,seconds=0;const mismatches=[];
for(const [index,record] of records.entries()){
 if(record.index!==index||record.path!==imports[index]||record.voiceId!==cast.get(record.speaker)||!Number.isFinite(record.audioSeconds)||!(record.audioSeconds>0)||record.alignment.starts.length!==record.alignment.characters.length||record.alignment.ends.some(time=>time>record.endSeconds-record.startSeconds+.15))throw Error('Invalid exported record '+record.key);
 const bytes=readFileSync(resolve(stage,record.path));audioBytes+=bytes.length;seconds+=record.audioSeconds;
 if(old.has(record.key)){if(!bytes.equals(readFileSync(resolve(ROOT,old.get(record.key).path))))mismatches.push(record.key);else oldBytesVerified++;}else newClips++;
}
const cues=read(resolve(AUDIO,'run7-cue-manifest.json')).cues;for(const cue of cues)audioBytes+=statSync(resolve(stage,cue.path)).size;
const sourcePaths=['Assets/Scripts/RoomscriptRun7VoiceAssets.ts','Assets/Scripts/RoomscriptRun7CueAssets.ts','Assets/Scripts/Content/Run7VoiceManifest.ts','Assets/Scripts/Content/Run7AudioManifest.ts'];
const ledger=read(ledgerPath),entries=ledger.entries.filter(e=>e.segment==='run7-2026-11-05');
const result={at:new Date().toISOString(),status:'Tooling staged; not published',clips:records.length,cues:cues.length,files:records.length+cues.length+sourcePaths.length,audioBytes,totalBytes:audioBytes+sourcePaths.reduce((n,p)=>n+statSync(resolve(stage,p)).size,0),audioSeconds:Number(seconds.toFixed(3)),oldBytesVerified,newClips,mismatches,run7Credits:entries.reduce((n,e)=>n+e.credits,0),accountedTotal:total(ledger),estimates:entries.filter(e=>e.estimate).length,incomplete:entries.filter(e=>e.status!=='complete').length,providerBlock:ledger.providerBlock||null};
writeFileSync(resolve(AUDIO,'run7-v5-verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(mismatches.length)process.exitCode=1;
