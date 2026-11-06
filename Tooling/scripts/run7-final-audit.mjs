import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {inspectFile} from './check-secrets.mjs';
const root=path.resolve(import.meta.dirname,'../..');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',timeout:90000,maxBuffer:128*1024*1024,stdio:['pipe','pipe','pipe']});
const commits=git(['rev-list','--all']).trim().split('\n');
const lines=git(['rev-list','--objects','--all']).trim().split('\n');
const names=new Map(lines.filter(l=>l.includes(' ')).map(l=>[l.slice(0,40),l.slice(41)]));
const details=execFileSync('git',['cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)'],{cwd:root,input:[...names.keys()].join('\n')+'\n',encoding:'utf8',timeout:90000,maxBuffer:32*1024*1024,stdio:['pipe','pipe','pipe']});
const textExtension=/\.(?:[cm]?[jt]sx?|json|jsonl|scene|esproj|md|txt|yaml|yml|toml|ini|cfg|xml|svg|py|ps1|sh|cmd|bat|h|cpp|glsl|graphShader|graphVfx|meta|lock|pem|env)$/i;
let scanned=0,bytes=0,skippedBinary=0;const issues=[];const candidates=[];
for(const row of details.trim().split('\n')){const [oid,type,sizeText]=row.split(' '),size=Number(sizeText),name=names.get(oid);if(type!=='blob')continue;if(size>32*1024*1024||(!textExtension.test(name)&&path.basename(name).includes('.')&&!path.basename(name).startsWith('.'))){skippedBinary++;continue;}candidates.push({oid,name,size});}
const started=Date.now();
for(const {oid,name,size} of candidates){if(Date.now()-started>180000)throw new Error('Bounded history audit exceeded180s');const buffer=execFileSync('git',['cat-file','blob',oid],{cwd:root,timeout:10000,maxBuffer:34*1024*1024,stdio:['pipe','pipe','pipe']});if(buffer.includes(0)){skippedBinary++;continue;}scanned++;bytes+=size;const found=inspectFile(name,buffer.toString('utf8'));if(found.length){const commitIds=git(['log','--all','--format=%H','--find-object='+oid]).trim().split('\n').filter(Boolean);issues.push({file:name,commitIds,types:found});}}
const tracked=git(['ls-files','-z']).split('\0').filter(Boolean);
const forbiddenBinaries=tracked.filter(n=>/^Tooling\/bin\//.test(n)||/__pycache__|\.pyc$/.test(n));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'Tooling/results/elevenlabs-ledger.json'),'utf8'));
const segmentRows=ledger.entries.filter(e=>JSON.stringify(e).includes('run7-2026-11-05'));
const report={at:new Date().toISOString(),scope:'all reachable git refs, text/config/scene blobs <=32MiB; binary assets excluded',commits:commits.length,scannedTextBlobs:scanned,scannedBytes:bytes,skippedBinaryBlobs:skippedBinary,issues,trackedToolBinaries:forbiddenBinaries,run7LedgerEntries:segmentRows.length,run7Credits:segmentRows.reduce((s,e)=>s+(e.credits||0),0),run7Incomplete:segmentRows.filter(e=>e.status!=='complete').map(e=>({id:e.id,status:e.status})),ledgerTotalCredits:ledger.entries.reduce((s,e)=>s+(e.credits||0),0)};
fs.writeFileSync(path.join(root,'Tooling/results/run7-final-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
