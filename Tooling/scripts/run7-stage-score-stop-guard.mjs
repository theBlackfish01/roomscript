import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),name='RoomscriptAudio.ts',source=fs.readFileSync(path.join(root,'Assets/Scripts',name),'utf8');
const before='this.scoreName=name;this.nativeAudio("score.stop:"+name,()=>this.music.stop(false));';
const after='this.scoreName=name;if(this.music.audioTrack&&(this.music.isPlaying()||this.music.isPaused()))this.nativeAudio("score.stop:"+name,()=>this.music.stop(false));';
if(!source.includes(before))throw new Error('Authoritative score source changed');
fs.writeFileSync(path.join(root,'Tooling/staging',name),source.replace(before,after));
fs.writeFileSync(path.join(root,'Tooling/staging/run7-score-stop-source.json'),JSON.stringify({name,sha256:crypto.createHash('sha256').update(source).digest('hex')}));
console.log('Staged guard: no stop on uninitialized native music player. No Assets writes.');
