/** Preserve paid originals outside Lens assets; generated sentence clips remain reproducible. */
import {read,save,AUDIO,audioFile} from './lib.mjs';
import {resolve,dirname} from 'node:path';
import {mkdirSync,copyFileSync,statSync} from 'node:fs';
const clips=read(resolve(AUDIO,'voice-manifest.json'),null).clips.filter(c=>!c.derivedFrom),cues=read(resolve(AUDIO,'cue-manifest.json'),null).cues,dialogues=read(resolve(AUDIO,'dialogue-manifest.json'),null).clips;
let bytes=0;for(const c of [...clips,...cues,...dialogues]){const source=audioFile(c.path),dest=resolve(AUDIO,'library',c.path.replace(/^Assets\/Audio\//,''));mkdirSync(dirname(dest),{recursive:true});if(source!==dest)copyFileSync(source,dest);bytes+=statSync(dest).size;}
save(resolve(AUDIO,'library/index.json'),{version:1,note:'Normalized paid originals. AI-generated ElevenLabs audio; provider terms apply, not MIT. Does not include derived sentence files or duplicate raw response cache.',voiceOriginals:clips.length,cues:cues.length,dialogues:dialogues.length,bytes});console.log('Backed up '+clips.length+' original performances and44 cues/dialogues ('+(bytes/1e6).toFixed(2)+'MB).');
