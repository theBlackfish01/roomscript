import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectFile} from './check-secrets.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const files=['README.md','LICENSE','NOTICE','devpost/README.md','devpost/design-brief.md','devpost/clad-log.md','Tooling/audio/RUN5.md'];
const errors=[];let links=0;
for(const file of files){const path=resolve(root,file),text=readFileSync(path,'utf8');for(const error of inspectFile(file,text))errors.push(file+': '+error);
 for(const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){const link=match[1];if(/^(?:https?:|#)/.test(link))continue;links++;if(!existsSync(resolve(dirname(path),link.split('#')[0])))errors.push(file+': missing link '+link);}}
const story=readFileSync(resolve(root,'Assets/Scripts/Content/STORY.md'),'utf8');if(/\?s\b/.test(story))errors.push('STORY still contains mangled apostrophes');
console.log(JSON.stringify({files:files.length,localLinks:links,errors},null,2));if(errors.length)process.exitCode=1;
