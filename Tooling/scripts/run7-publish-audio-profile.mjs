import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
if(!process.argv.includes('--imports-allowed'))throw Error('MAIN_SESSION_MUST_RELEASE_IMPORT_PAUSE');
const root=path.resolve(import.meta.dirname,'../..'),stage=path.join(root,'Tooling/staging'),hash=data=>crypto.createHash('sha256').update(data).digest('hex'),guard=JSON.parse(fs.readFileSync(path.join(stage,'run7-audio-profile-registry-source.json'),'utf8')),fixture=JSON.parse(fs.readFileSync(path.join(stage,'run7-audio-ab-fixture.json'),'utf8'));
if(hash(fs.readFileSync(path.join(root,'Assets/Scripts',guard.name)))!==guard.sha256)throw Error('Registry changed');
if(hash(fs.readFileSync(path.join(root,fixture.source)))!==fixture.sourceSha256)throw Error('Reference MP3 changed');
if(hash(fs.readFileSync(path.join(root,fixture.staged)))!==fixture.destinationSha256)throw Error('Staged PCM changed');
const files=[['RoomscriptLeafIndex.audio-profile.ts','Assets/Scripts/RoomscriptLeafIndex.ts'],['RoomscriptNativeAudioProfileLeafScenario.ts','Assets/Scripts/RoomscriptNativeAudioProfileLeafScenario.ts'],['native-audio/CastingChimePCM.wav','Assets/Audio/Run7/Probe/CastingChimePCM.wav']];
for(const [from,to] of files.slice(1)){const destination=path.join(root,to);if(fs.existsSync(destination)&&!fs.readFileSync(destination).equals(fs.readFileSync(path.join(stage,from))))throw Error('New destination already differs: '+to);}
for(const [from,to] of files){const destination=path.join(root,to);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(path.join(stage,from),destination);}
console.log(JSON.stringify({published:files.map(([,to])=>to),nativeEvidence:'pending'}));
