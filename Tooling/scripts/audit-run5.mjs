import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {inspectFile} from './check-secrets.mjs';
const git=args=>execFileSync('git',['-c','filter.lfs.process=','-c','filter.lfs.clean=','-c','filter.lfs.required=false',...args],{encoding:'utf8',timeout:60000,maxBuffer:32*1024*1024});
if(process.argv.includes('--history')){
  const entries=git(['rev-list','--objects','--all']).trim().split('\n').map(line=>{const space=line.indexOf(' ');return {id:line.slice(0,space),path:line.slice(space+1)};}).filter(e=>/\.(ts|js|mjs|json|md|scene|yaml|yml|toml|txt)$/.test(e.path));
  const batch=execFileSync('git',['cat-file','--batch'],{input:entries.map(e=>e.id).join('\n')+'\n',timeout:120000,maxBuffer:128*1024*1024});
  let offset=0;const failures=[];let scanned=0;
  for(const entry of entries){const end=batch.indexOf(10,offset),header=batch.subarray(offset,end).toString('utf8').split(' '),size=Number(header[2]);if(!Number.isFinite(size))throw new Error('Invalid history object size');offset=end+1;
    if(header[1]==='blob'){const content=batch.subarray(offset,offset+size).toString('utf8'),issues=inspectFile(entry.path,content);if(issues.length)failures.push({...entry,issues});scanned++;}offset+=size+1;
  }
  writeFileSync('Tooling/results/run5-history-secret-audit.json',JSON.stringify({scope:'All reachable history text blobs; no credential values printed',scanned,failures},null,2)+'\n');console.log(JSON.stringify({scanned,failures}));process.exit(failures.length?1:0);
}
const files=[...new Set(git(['ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(Boolean))];
const failures=[];let scanned=0;
for(const path of files){if(!existsSync(path)||path.includes('run5-preserved/')||!/(?:\.(?:ts|js|mjs|json|md|scene|yaml|yml|toml|txt)|(?:^|\/)(?:NOTICE|LICENSE|README))$/i.test(path))continue;
  const content=readFileSync(path,'utf8');const issues=inspectFile(path,content);if(issues.length)failures.push({path,issues});scanned++;
}
mkdirSync('Tooling/results',{recursive:true});
writeFileSync('Tooling/results/run5-secret-audit.json',JSON.stringify({scope:'Current tracked and unignored text files, not history or index',scanned,failures},null,2)+'\n');
console.log(JSON.stringify({scanned,failures}));process.exitCode=failures.length?1:0;
