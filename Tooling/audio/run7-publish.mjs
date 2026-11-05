/** Additive publication only; run after the main Lens session releases its import pause. */
import {AUDIO,ROOT} from './lib.mjs';
import {resolve,dirname} from 'node:path';
import {readdirSync,mkdirSync,copyFileSync,statSync} from 'node:fs';
if(!process.argv.includes('--imports-allowed'))throw Error('MAIN_SESSION_MUST_RELEASE_IMPORT_PAUSE');
const stage=resolve(AUDIO,'out/run7/Assets');let count=0,bytes=0;
function copy(dir,relative=''){
  for(const item of readdirSync(dir,{withFileTypes:true})){
    const suffix=relative+'/'+item.name,source=resolve(dir,item.name);
    if(item.isDirectory()){copy(source,suffix);continue;}
    const dest=resolve(ROOT,'Assets'+suffix);
    mkdirSync(dirname(dest),{recursive:true});copyFileSync(source,dest);count++;bytes+=statSync(source).size;
  }
}
copy(stage);console.log(JSON.stringify({publishedFiles:count,bytes}));
