/** Read-only evidence that the installed native editor exposes profiler member names. */
import {createReadStream,writeFileSync} from 'node:fs';
const path='C:/Program Files/Snap Inc/Lens Studio/Lens Studio.exe';
const names=['startTrace','activeTraceSession','profiling'],found={};let tail=Buffer.alloc(0),offset=0;
for await(const chunk of createReadStream(path,{highWaterMark:1024*1024})){
  const data=Buffer.concat([tail,chunk]);
  for(const name of names)if(!found[name])for(const encoding of ['utf8','utf16le']){
    const index=data.indexOf(Buffer.from(name,encoding));if(index<0)continue;
    found[name]={encoding,offset:offset-tail.length+index};break;
  }
  offset+=chunk.length;tail=data.subarray(-128);if(names.every(name=>found[name]))break;
}
const report={path,found,interpretation:'Native string evidence only; actual callable capability still checked by the canonical EEC start snippet.'};
writeFileSync('Tooling/perfetto/native-api-evidence.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
