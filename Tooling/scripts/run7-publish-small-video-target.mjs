import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
if(!process.argv.includes('--imports-allowed'))throw Error('MAIN_SESSION_MUST_RELEASE_IMPORT_PAUSE');
const root=path.resolve(import.meta.dirname,'../..'),stage=path.join(root,'Tooling/staging'),assets=path.join(root,'Assets/Scripts'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),guards=JSON.parse(fs.readFileSync(path.join(stage,'run7-small-video-target-sources.json'),'utf8'));
for(const guard of guards)if(hash(fs.readFileSync(path.join(assets,guard.name)))!==guard.sha256)throw Error('Source changed: '+guard.name);
for(const guard of guards)fs.copyFileSync(path.join(stage,guard.name),path.join(assets,guard.name));
console.log(JSON.stringify({published:guards.map(guard=>({name:guard.name,sha256:hash(fs.readFileSync(path.join(assets,guard.name)))})),nativeVisualVerification:'pending'}));
