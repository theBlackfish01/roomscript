/** Local recovery copy when git writes are unavailable. Never includes ignored secrets. */
import {execFileSync} from 'node:child_process';
import {mkdirSync,copyFileSync,existsSync,writeFileSync,statSync} from 'node:fs';
import {resolve,dirname,relative,sep} from 'node:path';
const root=process.cwd(),target=resolve(root,'Tooling/results/run5-preserved');
const args=['-c','filter.lfs.process=','-c','filter.lfs.clean=','-c','filter.lfs.required=false'];
const files=[...new Set(execFileSync('git',[...args,'ls-files','--modified','--others','--exclude-standard','-z'],{encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024}).split('\0').filter(Boolean))];
const copied=[],deleted=[];mkdirSync(target,{recursive:true});
for(const path of files){if(path.startsWith('Tooling/results/run5-preserved/')||/(^|\/)(\.env(?:\..*)?|\.mcp\.json|ls-live-instance\.json|.*\.pem)$/.test(path)||path.startsWith('.codex/')||path.startsWith('.claude/'))continue;
  const source=resolve(root,path),destination=resolve(target,'files',path);
  if(!source.startsWith(root+sep)||!destination.startsWith(target+sep))throw new Error('Recovery path outside workspace');
  if(!existsSync(source)){deleted.push(path);continue;}if(!statSync(source).isFile())continue;
  mkdirSync(dirname(destination),{recursive:true});copyFileSync(source,destination);copied.push(relative(root,source).split(sep).join('/'));
}
writeFileSync(resolve(target,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',timeout:10000}).trim(),purpose:'Recovery copy, not a git commit or verified release. Original Run4 patch retained separately.',copied,deleted},null,2)+'\n');
console.log(JSON.stringify({copied:copied.length,deleted:deleted.length,target:'Tooling/results/run5-preserved'}));
