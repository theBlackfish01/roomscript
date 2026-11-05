/** Derive sentence clips from paid full-line takes using their real alignment. No API calls. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';import {resolve,dirname} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {splitSentences} from '../../Assets/Scripts/Engine/ai/Speech';
import {audioFile} from '../audio/lib.mjs';
import {prioritizeRuntimeSources} from '../audio/segments.mjs';
const root=resolve(import.meta.dirname,'../..'),audio=resolve(root,'Tooling/audio'),file=resolve(audio,'voice-manifest.json'),manifest=JSON.parse(readFileSync(file,'utf8'));
// Runtime sources must win shared-sentence aliases: optional older performances can
// otherwise pull a retired cast voice back into a completely re-recorded runtime bank.
const runtime=JSON.parse(readFileSync(resolve(audio,'voice-runtime-spec.json'),'utf8'));
const originals=prioritizeRuntimeSources(manifest.clips,runtime.lines),clips=originals.slice(),missing:any[]=[];const ff=resolve(audio,'out/bin/ffmpeg.exe');
for(const source of originals){const sentences=splitSentences(source.text);if(sentences.length<2)continue;const a=source.alignment;if(!a){missing.push({key:source.key,reason:'no alignment'});continue;}const aligned=a.characters.join('');let cursor=0;
 for(const text of sentences){const key=source.speaker+'|'+source.take+'|'+text;if(clips.some((c:any)=>c.key===key))continue;const start=aligned.indexOf(text,cursor);if(start<0){missing.push({key,text,reason:'alignment text mismatch'});continue;}const last=start+text.length-1;cursor=last+1;const from=Math.max(0,a.starts[start]-.025),until=a.ends[last]+.04;if(!(until>from)){missing.push({key,text,reason:'invalid duration'});continue;}
 const identity=createHash('sha256').update(JSON.stringify({source:source.identity,text,from,until,version:1})).digest('hex'),path='Assets/Audio/Voice/'+source.speaker+'/'+identity.slice(0,20)+'.mp3',dest=resolve(audio,'out/staged',path),src=audioFile(source.path);mkdirSync(dirname(dest),{recursive:true});
 if(!existsSync(dest))execFileSync(ff,['-v','error','-y','-ss',String(from),'-i',src,'-t',String(until-from),'-ac','1','-ar','24000','-b:a','40k',dest],{timeout:60000,windowsHide:true});
 clips.push({...source,key,identity,path,text,id:source.id+':sentence:'+start,derivedFrom:source.identity,alignment:{characters:a.characters.slice(start,last+1),starts:a.starts.slice(start,last+1).map((v:number)=>Math.max(0,v-from)),ends:a.ends.slice(start,last+1).map((v:number)=>Math.max(0,v-from))}});
 }}
manifest.clips=clips;writeFileSync(file,JSON.stringify(manifest,null,2));writeFileSync(resolve(audio,'segment-report.json'),JSON.stringify({originals:originals.length,derived:clips.length-originals.length,missing},null,2));console.log(JSON.stringify({originals:originals.length,derived:clips.length-originals.length,missing:missing.length}));
