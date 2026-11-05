import {openSync,readSync,closeSync,fstatSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const PREFIX='ROOMSCRIPT_LOCAL_LEAF|';
const terminal=new Set(['passed','failed','cancelled']);
const sensitive=/^(?:.*(?:token|secret|password|authorization|cookie|credential|private.?key|api.?key|capability).*|key)$/i;
export function redact(value){
  if(Array.isArray(value))return value.map(redact);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,sensitive.test(key)?'[REDACTED]':redact(item)]));
  if(typeof value!=='string')return value;
  return value
    .replace(/\bBearer\s+[^\s"'<>]+/gi,'Authorization [REDACTED]')
    .replace(/\bsk-(?:ant-)?[A-Za-z0-9_-]+/g,'[REDACTED]')
    .replace(/\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/g,'[REDACTED]')
    .replace(/((?:api[_-]?key|token|access[_-]?token|refresh[_-]?token|password|secret|authorization|capability)\s*[=:]\s*["']?)[^\s"'&,;}]+/gi,'$1[REDACTED]')
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g,'[REDACTED PRIVATE KEY]');
}
function timestamp(line){return line.match(/^[A-Z]\s+(\d\d:\d\d:\d\d\.\d+)/)?.[1]||null;}
function payload(line){const match=line.match(/\[(?:Assets|Packages)\/[^\]]+\]\s*(.*)$/);return match?.[1]||line;}
export function harvestLocalLeaf(text){
  const requests=new Map();let current=null;
  for(const [index,line] of text.split(/\r?\n/).entries()){
    const at=line.indexOf(PREFIX);
    if(at>=0){
      let record;try{record=JSON.parse(line.slice(at+PREFIX.length));}catch{continue;}
      if(typeof record.requestId!=='string'||typeof record.scenarioId!=='string'||record.transport!=='local-manager')continue;
      let run=requests.get(record.requestId);
      if(!run){run={requestId:record.requestId,scenarioId:record.scenarioId,transport:'local-manager',mcpTransportPass:false,scopeComplete:false,events:[],markers:[],errors:[],latest:null};requests.set(record.requestId,run);}
      if(record.status==='running'){run.scopeComplete=true;run.startLine=index+1;current=run;}
      const event={logTime:timestamp(line),record:redact(record)};run.events.push(event);run.latest=event.record;
      if(terminal.has(record.status)){run.endLine=index+1;if(current===run)current=null;}
      continue;
    }
    if(!current)continue;
    const clean=payload(line),marker=clean.match(/^([A-Z][A-Z0-9_]{2,})\|(.*)$/);
    if(marker){let data;try{data=JSON.parse(marker[2]);}catch{data=marker[2];}
      if(current.markers.length<2000)current.markers.push({logTime:timestamp(line),name:marker[1],data:redact(data)});
      else current.markersTruncated=true;
    }
    if(/^E\s/.test(line)||/\b(?:AssertionError|Exception|Error:|FAILED:|ERROR)\b/.test(clean)){
      if(current.errors.length<200)current.errors.push({logTime:timestamp(line),text:redact(clean).slice(0,12000)});
      else current.errorsTruncated=true;
    }
  }
  return [...requests.values()].map(run=>({...run,evidenceLabel:run.latest?.status==='passed'&&run.latest.strict===true&&run.scopeComplete?'LEAF strict local-manager PASS':'LEAF local-manager '+String(run.latest?.status||'unknown').toUpperCase()}));
}
function readTail(path,maxBytes){const fd=openSync(path,'r');try{const size=fstatSync(fd).size,start=Math.max(0,size-maxBytes),buffer=Buffer.alloc(size-start);readSync(fd,buffer,0,buffer.length,start);const text=buffer.toString('utf8');return {text:start?text.slice(text.indexOf('\n')+1):text,bytes:size,truncated:start>0};}finally{closeSync(fd);}}
function safeName(value){return value.replace(/[^A-Za-z0-9._-]/g,'_').slice(0,110);}
function cli(){
  const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
  const log=option('--log','C:/Users/wadoo/AppData/Local/Snap/Lens Studio/logs/LensStudioLog-2026-11-06-01-53-34-732-ab082.txt');
  const output=resolve(option('--out','Tooling/results/local-leaf')),scenario=option('--scenario',''),request=option('--request','');
  const tail=readTail(log,16*1024*1024),runs=harvestLocalLeaf(tail.text).filter(run=>(!scenario||run.scenarioId===scenario)&&(!request||run.requestId===request));
  if(!runs.length)throw Error('No matching structured local LEAF request in the bounded log tail');
  mkdirSync(output,{recursive:true});const latest=new Map();
  for(const run of runs){
    const hash=createHash('sha256').update(run.requestId).digest('hex').slice(0,10),filename=safeName(run.requestId)+'-'+hash+'.json';
    const report={...run,source:{log,logBytes:tail.bytes,tailTruncated:tail.truncated},harvestedAt:new Date().toISOString()};
    writeFileSync(join(output,filename),JSON.stringify(report,null,2)+'\n');latest.set(run.scenarioId,{report,filename});
  }
  for(const [id,{report}] of latest)writeFileSync(join(output,safeName(id)+'.latest.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({reports:latest.size,requests:runs.length,output,results:[...latest.values()].map(({report,filename})=>({scenarioId:report.scenarioId,requestId:report.requestId,status:report.latest.status,elapsedMs:report.latest.elapsedMs,evidenceLabel:report.evidenceLabel,markers:report.markers.length,errors:report.errors.length,report:filename}))}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{cli();}catch(error){console.error(redact(String(error)));process.exitCode=1;}}
