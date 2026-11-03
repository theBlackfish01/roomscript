// Run only at an agreed Lens import checkpoint, never during LEAF.
import {copyFileSync,existsSync,readFileSync,mkdirSync,unlinkSync} from 'node:fs';import {resolve,dirname,sep} from 'node:path';import {AUDIO,ROOT,parseManifestExport} from './lib.mjs';
const staged=resolve(AUDIO,process.argv.includes('--ship')?'out/ship':'out/staged');
// Publish the last completed manifest snapshot, never files still being encoded by a running batch.
const exports=[['VoiceManifest.ts','VOICE_MANIFEST'],['AudioManifest.ts','AUDIO_MANIFEST'],['DialogueManifest.ts','DIALOGUE_MANIFEST']];
const scripts=[],paths=new Set();for(const [file,name] of exports){const path='Assets/Scripts/Content/'+file,p=resolve(staged,path);if(!existsSync(p))continue;const source=readFileSync(p,'utf8'),rows=parseManifestExport(source,name);for(const r of rows)paths.add(r.path);scripts.push(path);}
// Only remove files referenced by our previous generated manifests, after originals were backed up.
const retired=new Set();if(process.argv.includes('--ship')){if(!existsSync(resolve(AUDIO,'library/index.json')))throw Error('BACK_UP_PAID_LIBRARY_FIRST');for(const [file,name] of exports){const old=resolve(ROOT,'Assets/Scripts/Content',file);if(existsSync(old))for(const row of parseManifestExport(readFileSync(old,'utf8'),name))if(!paths.has(row.path))retired.add(row.path);}}
for(const path of paths){const src=resolve(staged,path),dest=resolve(ROOT,path);if(!existsSync(src)){if(existsSync(dest))continue;throw Error('MISSING_STAGED_ASSET '+path);}mkdirSync(dirname(dest),{recursive:true});copyFileSync(src,dest);}
for(const path of [...scripts,'Assets/Scripts/Content/HeroVariantBank.ts','Assets/Scripts/Content/HeroRegisterBank.ts','Assets/Scripts/RoomscriptVoiceAssets.ts']){const src=resolve(staged,path);if(!existsSync(src))continue;const dest=resolve(ROOT,path);mkdirSync(dirname(dest),{recursive:true});copyFileSync(src,dest);}
const boundary=resolve(ROOT,'Assets/Audio')+sep;for(const path of retired){const dest=resolve(ROOT,path);if(!dest.startsWith(boundary)||!dest.endsWith('.mp3'))throw Error('UNSAFE_RETIRED_PATH');if(existsSync(dest))unlinkSync(dest);if(existsSync(dest+'.meta'))unlinkSync(dest+'.meta');}
console.log('Published '+paths.size+' completed audio assets; retired '+retired.size+' previous generated files preserved/reproducible from Tooling. Main agent must import and verify in Lens.');
