/** Read-only, bounded scan of every blob/path reachable from a snapshot of all refs. */
import {execFileSync,spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectFile} from './check-secrets.mjs';

const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
const reportFile=process.argv[2]||'run10-history-secret-audit.json';
if(!/^run10-history[-a-z0-9.]+\.json$/.test(reportFile))throw Error('Invalid report filename');
const reportPath=resolve(root,'Tooling/results',reportFile);
const started=Date.now(),budgetMs=540000;
const remaining=()=>{const ms=budgetMs-(Date.now()-started);if(ms<=0)throw Error('SCAN_TIMEOUT');return ms;};
const git=(args,input)=>execFileSync('git',args,{cwd:root,input,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:128*1024*1024,timeout:Math.min(60000,remaining()),windowsHide:true});
const report={startedAt:new Date(started).toISOString(),scope:'Every blob and pathname reachable from the recorded snapshot of all refs and HEAD; text content inspected with check-secrets.inspectFile; binary contents excluded, their pathnames checked.',status:'incomplete',complete:false,timeoutSeconds:540,refs:[],counts:{objects:0,commits:0,trees:0,blobs:0,textBlobs:0,binaryBlobs:0,blobBytes:0,textBytes:0,binaryBytes:0,paths:0,blobPathPairs:0,unpathedBlobs:0,sceneBlobs:0},findings:[]};
const findingKeys=new Set();
function finding(oid,path,kind){const key=oid+'\0'+path+'\0'+kind;if(!findingKeys.has(key)){findingKeys.add(key);report.findings.push({oid,path,kind});}}
function decodeText(bytes){
  let text;
  try{
    if(bytes.length>=2&&bytes[0]===255&&bytes[1]===254)text=new TextDecoder('utf-16le',{fatal:true}).decode(bytes.subarray(2));
    else if(bytes.length>=2&&bytes[0]===254&&bytes[1]===255)text=new TextDecoder('utf-16be',{fatal:true}).decode(bytes.subarray(2));
    else text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }catch{return null;}
  return /[\x00-\x08\x0e-\x1f]/.test(text)?null:text;
}

/** One persistent cat-file process avoids thousands of processes and any shell interpolation. */
async function scanBlobs(blobs,pathsByBlob){
  const child=spawn('git',['cat-file','--batch'],{cwd:root,stdio:['pipe','pipe','pipe'],windowsHide:true});
  let timedOut=false;const timeout=setTimeout(()=>{timedOut=true;child.kill();},remaining());
  child.stderr.resume();child.stdin.on('error',()=>{});child.stdin.end(blobs.map(b=>b.oid).join('\n')+'\n');
  const finished=new Promise((resolveResult,reject)=>{child.on('error',()=>reject(Error('GIT_BATCH_UNAVAILABLE')));child.on('close',code=>resolveResult(code));});
  const iterator=child.stdout[Symbol.asyncIterator]();let buffer=Buffer.alloc(0);
  async function take(n){const chunks=[];let needed=n;while(needed){if(!buffer.length){const next=await iterator.next();if(next.done)throw Error(timedOut?'SCAN_TIMEOUT':'GIT_BATCH_TRUNCATED');buffer=next.value;}const length=Math.min(buffer.length,needed);chunks.push(buffer.subarray(0,length));buffer=buffer.subarray(length);needed-=length;}return chunks.length===1?chunks[0]:Buffer.concat(chunks,n);}
  async function line(){let newline;while((newline=buffer.indexOf(10))<0){const next=await iterator.next();if(next.done)throw Error(timedOut?'SCAN_TIMEOUT':'GIT_BATCH_TRUNCATED');buffer=buffer.length?Buffer.concat([buffer,next.value]):next.value;}const value=buffer.subarray(0,newline).toString('ascii');buffer=buffer.subarray(newline+1);return value;}
  try{
    for(const blob of blobs){
      remaining();const header=(await line()).split(' ');if(header[0]!==blob.oid||header[1]!=='blob'||Number(header[2])!==blob.size)throw Error('GIT_BATCH_MISMATCH');
      const bytes=await take(blob.size);if((await take(1))[0]!==10)throw Error('GIT_BATCH_BOUNDARY');
      const paths=[...(pathsByBlob.get(blob.oid)||[])];if(!paths.length){paths.push('(unpathed reachable blob)');report.counts.unpathedBlobs++;}
      const content=decodeText(bytes);report.counts.blobBytes+=bytes.length;
      if(content===null){report.counts.binaryBlobs++;report.counts.binaryBytes+=bytes.length;for(const path of paths)if(path.toLowerCase().endsWith('.scene'))finding(blob.oid,path,'binary scene (cannot verify gateway tokens)');continue;}
      report.counts.textBlobs++;report.counts.textBytes+=bytes.length;
      const generic=inspectFile('history-text.txt',content);for(const path of paths)for(const issue of generic)finding(blob.oid,path,issue);
      const scenes=paths.filter(path=>path.toLowerCase().endsWith('.scene'));if(scenes.length){report.counts.sceneBlobs++;for(const path of scenes)for(const issue of inspectFile(path,content))finding(blob.oid,path,issue);}
    }
    if(await finished!==0)throw Error(timedOut?'SCAN_TIMEOUT':'GIT_BATCH_FAILED');
  }finally{clearTimeout(timeout);if(child.exitCode===null)child.kill();}
}

try{
  const refLines=git(['for-each-ref','--format=%(objectname) %(objecttype) %(refname)']).trim().split('\n').filter(Boolean);
  report.refs=refLines.map(line=>{const [oid,type,...name]=line.trim().split(' ');return {oid,type,path:name.join(' ')};});
  const head=git(['rev-parse','--verify','HEAD']).trim();report.refs.push({oid:head,type:'commit',path:'HEAD'});
  const tips=[...new Set(report.refs.map(r=>r.oid))];
  const oids=[...new Set(git(['rev-list','--objects','--no-object-names',...tips]).trim().split('\n').filter(Boolean))];
  const inventory=git(['cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)'],oids.join('\n')+'\n').trim().split('\n').map(line=>{const [oid,type,size]=line.split(' ');if(!/^[0-9a-f]{40,64}$/.test(oid)||!['blob','tree','commit','tag'].includes(type)||!Number.isSafeInteger(Number(size)))throw Error('GIT_INVENTORY_INVALID');return {oid,type,size:Number(size)};});
  report.counts.objects=inventory.length;for(const item of inventory){if(item.type==='commit')report.counts.commits++;if(item.type==='tree')report.counts.trees++;if(item.type==='blob')report.counts.blobs++;}
  const peeled=tips.map(oid=>git(['rev-parse','--verify',oid+'^{}']).trim()),types=new Map(inventory.map(o=>[o.oid,o.type]));
  const commitTips=peeled.filter(oid=>types.get(oid)==='commit');
  const roots=new Set(commitTips.length?git(['log','--format=%T',...commitTips]).trim().split('\n').filter(Boolean):[]);
  for(const oid of peeled)if(types.get(oid)==='tree')roots.add(oid);
  const pathsByBlob=new Map(),checkedPaths=new Set(),visitedTrees=new Set();
  function visitRoot(tree){
    visitedTrees.add(tree);
    const entries=git(['ls-tree','--full-tree','-r','-t','-z',tree]).split('\0').filter(Boolean);
    for(const entry of entries){const tab=entry.indexOf('\t');if(tab<0)throw Error('GIT_TREE_INVALID');const [mode,type,oid]=entry.slice(0,tab).split(' '),path=entry.slice(tab+1);
      if(!checkedPaths.has(path)){checkedPaths.add(path);for(const issue of inspectFile(path,'').filter(issue=>issue==='forbidden secret/local filename'))finding(oid,path,issue);}
      if(type==='tree')visitedTrees.add(oid);
      if(type==='blob'){let paths=pathsByBlob.get(oid);if(!paths){paths=new Set();pathsByBlob.set(oid,paths);}paths.add(path);}
    }
  }
  for(const tree of roots)visitRoot(tree);
  // Include standalone tree refs, even if no commit contains them.
  for(const tree of inventory.filter(o=>o.type==='tree'))if(!visitedTrees.has(tree.oid))visitRoot(tree.oid);
  report.counts.paths=checkedPaths.size;report.counts.blobPathPairs=[...pathsByBlob.values()].reduce((n,p)=>n+p.size,0);
  await scanBlobs(inventory.filter(o=>o.type==='blob'),pathsByBlob);
  report.complete=true;report.status=report.findings.length?'findings':'passed';
}catch(error){report.errorKind=['SCAN_TIMEOUT','GIT_BATCH_UNAVAILABLE','GIT_BATCH_TRUNCATED','GIT_BATCH_MISMATCH','GIT_BATCH_BOUNDARY','GIT_BATCH_FAILED','GIT_INVENTORY_INVALID','GIT_TREE_INVALID'].includes(error.message)?error.message:'GIT_OR_SCAN_FAILED';}
report.completedAt=new Date().toISOString();report.elapsedSeconds=Number(((Date.now()-started)/1000).toFixed(3));
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,complete:report.complete,counts:report.counts,findings:report.findings,errorKind:report.errorKind,elapsedSeconds:report.elapsedSeconds}));
process.exitCode=report.complete&&!report.findings.length?0:1;
