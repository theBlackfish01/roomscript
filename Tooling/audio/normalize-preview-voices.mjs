import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Re-encode existing performances only. No generation, trimming, retiming, or credentials.
const root=resolve(import.meta.dirname,'../..'),receipt=resolve(import.meta.dirname,'preview-voice-format.json');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const modules=['RoomscriptVoiceAssets.ts','RoomscriptRun7VoiceAssets.ts','RoomscriptRun10VoiceAssets.ts'];
const paths=[...new Set(modules.flatMap(name=>[...readFileSync(resolve(root,'Assets/Scripts',name),'utf8').matchAll(/requireAsset\("\.\.\/(Audio\/[^"\n]+\.mp3)"\)/g)].map(m=>'Assets/'+m[1])))].sort();
const previous=existsSync(receipt)?JSON.parse(readFileSync(receipt,'utf8')):null,rows=[];
const started=Date.now();
for(const path of paths){
  if(Date.now()-started>540000)throw new Error('Nine-minute normalization bound exceeded');
  const target=resolve(root,path),bytes=readFileSync(target),sha=hash(bytes),old=previous?.files.find(row=>row.path===path);
  if(old&&sha===old.outputSha256){rows.push(old);continue;}
  if(old)throw new Error('Voice changed after normalization: '+path);
  const source=resolve(import.meta.dirname,'out/preview-originals',path),output=resolve(import.meta.dirname,'out/preview-encoded',path);
  mkdirSync(dirname(source),{recursive:true});mkdirSync(dirname(output),{recursive:true});
  if(existsSync(source)&&hash(readFileSync(source))!==sha)throw new Error('Backup differs: '+path);
  copyFileSync(target,source);
  execFileSync(resolve(import.meta.dirname,'out/bin/ffmpeg.exe'),['-v','error','-y','-i',source,'-ar','44100','-ac','2','-c:a','libmp3lame','-b:a','128k',output],{timeout:15000,windowsHide:true});
  const encoded=readFileSync(output);copyFileSync(output,target);
  rows.push({path,sourceSha256:sha,outputSha256:hash(encoded),sourceBytes:bytes.length,outputBytes:encoded.length});
  // Persist progress so an interrupted batch resumes without repeated lossy transcoding.
  writeFileSync(receipt,JSON.stringify({format:'mp3',sampleRate:44100,channels:2,bitRate:128000,files:rows},null,2)+'\n');
}
writeFileSync(receipt,JSON.stringify({format:'mp3',sampleRate:44100,channels:2,bitRate:128000,files:rows},null,2)+'\n');
console.log(JSON.stringify({files:rows.length,sourceBytes:rows.reduce((n,r)=>n+r.sourceBytes,0),outputBytes:rows.reduce((n,r)=>n+r.outputBytes,0)}));
