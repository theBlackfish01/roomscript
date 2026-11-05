/** Exact final noun cut from an already paid selected-voice take; no provider call. */
import {read,AUDIO,parseManifestExport,hash,save} from './lib.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve,dirname} from 'node:path';import {execFileSync} from 'node:child_process';
const stage=resolve(AUDIO,'out/run7'),exportPath=resolve(stage,'Assets/Scripts/Content/Run7VoiceManifest.ts'),entries=parseManifestExport(readFileSync(exportPath,'utf8'),'RUN7_VOICE_MANIFEST');
const source=entries.find(record=>record.speaker==='S3'&&['right speaker','left speaker'].includes(record.text)&&!record.alignmentBounded);
if(!source)throw Error('No reliable aligned selected-voice source word');
const chars=source.alignment.characters.join(''),index=chars.toLowerCase().lastIndexOf('speaker');if(index<0)throw Error('Source word not found');
const starts=source.alignment.starts.slice(index,index+7),ends=source.alignment.ends.slice(index,index+7),from=source.startSeconds+starts[0],until=Math.min(source.audioSeconds,source.startSeconds+ends.at(-1)+.04);
if(starts.length!==7||!starts.every(Number.isFinite)||!(until-from>.15)||starts[0]<(source.alignment.ends[index-1]||0))throw Error('Unreliable word cut');
const identity=hash({derivedFrom:source.identity,word:'speaker',from,until}),path='Assets/Audio/Run7/S3/'+identity.slice(0,20)+'.mp3',dest=resolve(stage,path),ff=resolve(AUDIO,'out/bin/ffmpeg.exe');mkdirSync(dirname(dest),{recursive:true});
execFileSync(ff,['-v','error','-y','-i',resolve(stage,source.path),'-af',`atrim=start=${from}:end=${until},asetpts=PTS-STARTPTS`,'-ac','1','-ar','24000','-b:a','32k',dest],{timeout:15000,windowsHide:true,stdio:'pipe'});
const clip={id:'audit-gap-3-derived',key:'S3|steady|speaker',identity,speaker:'S3',text:'speaker',take:'steady',path,voiceId:source.voiceId,group:'phrases',reused:true,derivedFrom:source.identity,derivedWindow:{sourceText:source.text,from,until},alignment:{characters:[...'speaker'],starts:starts.map(time=>Math.max(0,time-starts[0])),ends:ends.map(time=>Math.max(0,time-starts[0]))}};
const manifestPath=resolve(AUDIO,'run7-voice-manifest.json'),manifest=read(manifestPath);manifest.clips=manifest.clips.filter(record=>record.key!==clip.key);manifest.clips.push(clip);manifest.clips.sort((a,b)=>a.key.localeCompare(b.key));save(manifestPath,manifest);
writeFileSync(resolve(AUDIO,'run7-speaker-derivation.json'),JSON.stringify({at:new Date().toISOString(),speaker:'S3',text:clip.text,sourceText:source.text,sourceIdentity:source.identity,derivedIdentity:identity,from,until,credits:0,method:'Final word from same selected voice, timestamp-delimited; subjective audition pending'},null,2)+'\n');
console.log(JSON.stringify({derived:clip.key,source:source.text,from,until,credits:0}));
