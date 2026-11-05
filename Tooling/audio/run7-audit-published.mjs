import fs from 'node:fs';import path from 'node:path';
const audio=import.meta.dirname,root=path.resolve(audio,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(audio,p),'utf8'));
const clips=read('run7-voice-manifest.json').clips,cues=read('run7-cue-manifest.json').cues;
const inputs=['run7-phrase-spec.json','run7-phrase-spec-v2.json','run7-phrase-spec-v3.json','run7-phrase-spec-v4.json','run7-phrase-spec-v5-audit.json','run7-narration-spec.json','run7-scan-narration-spec.json','run7-live-register-spec.json'];
const key=r=>r.speaker+'|steady|'+r.text.trim().replace(/\s+/g,' '),keys=new Set(clips.map(key));
const missing=inputs.flatMap(n=>read(n).lines).filter(r=>/[\p{L}\p{N}]/u.test(r.text)&&!keys.has(key(r))).map(key);
const paths=[...clips,...cues].map(r=>r.path).concat(['Assets/Scripts/RoomscriptRun7VoiceAssets.ts','Assets/Scripts/RoomscriptRun7CueAssets.ts','Assets/Scripts/Content/Run7VoiceManifest.ts','Assets/Scripts/Content/Run7AudioManifest.ts']);
const mismatches=[];let audioBytes=0,publishedBytes=0;
for(const file of paths){const staged=path.join(audio,'out/run7',file),live=path.join(root,file);if(!fs.existsSync(staged)||!fs.existsSync(live)){mismatches.push({file,type:'missing'});continue;}const a=fs.readFileSync(staged),b=fs.readFileSync(live);if(!a.equals(b))mismatches.push({file,type:'bytes differ'});publishedBytes+=b.length;if(file.endsWith('.mp3'))audioBytes+=b.length;}
const ledger=JSON.parse(fs.readFileSync(path.join(root,'Tooling/results/elevenlabs-ledger.json'),'utf8')),rows=ledger.entries.filter(e=>e.segment==='run7-2026-11-05');
const result={at:new Date().toISOString(),clips:clips.length,cues:cues.length,files:paths.length,publishedBytes,audioBytes,missingInventory:missing,mismatches,credits:rows.reduce((n,e)=>n+e.credits,0),estimatedEntries:rows.filter(e=>e.estimate).length,incomplete:rows.filter(e=>e.status!=='complete').length,method:'Byte comparison only; earlier decode verification retained, no rendering/provider calls.'};
fs.writeFileSync(path.join(audio,'run7-published-audit.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(missing.length||mismatches.length)process.exitCode=1;
