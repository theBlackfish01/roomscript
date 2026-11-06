/** Read-only bounded search of installed Lens configuration and native preference strings. */
import {readdirSync,readFileSync,statSync,openSync,readSync,closeSync,mkdirSync,writeFileSync} from 'node:fs';import {join,resolve,extname} from 'node:path';
const app='C:/Program Files/Snap Inc/Lens Studio',output=resolve('Tooling/results/run7-preview-settings');mkdirSync(output,{recursive:true});
const needles=/throttl|(?:background|inactive|unfocused|hidden|minimiz).{0,45}(?:fps|framerate|frame.?rate|render|preview)|(?:fps|framerate|frame.?rate|render|preview).{0,45}(?:background|inactive|unfocused|hidden|minimiz)|runInBackground|renderWhen|continuousRender|targetFps|maximumFrameRate|Qt::ApplicationInactive|\bfps\b|frame.?rate|render.?interval|refresh.?rate|isExposed|isMinimized|applicationStateChanged|fixedDelta|fixed.?timestep|tickInterval/i;
const results=[],deadline=Date.now()+90000;let files=0,bytes=0;
const textExtensions=new Set(['.js','.ts','.json','.qml','.ini','.xml','.cfg','.conf','.txt']);
function walk(dir){if(Date.now()>deadline)return;let entries;try{entries=readdirSync(dir,{withFileTypes:true});}catch{return;}
  for(const entry of entries){const file=join(dir,entry.name);if(entry.isSymbolicLink())continue;if(entry.isDirectory()){if(!['Cache','Templates','node_modules'].includes(entry.name))walk(file);continue;}
    if(!textExtensions.has(extname(file).toLowerCase()))continue;const size=statSync(file).size;if(size>4000000)continue;files++;const text=readFileSync(file,'utf8');bytes+=size;
    text.split(/\r?\n/).forEach((line,index)=>{if(needles.test(line))results.push({file,line:index+1,text:line.slice(0,600)});});
  }
}
for(const dir of ['JsPlugins','PreviewResources.bundle','CoreResources.bundle','resources','Plugins','qml'])walk(join(app,dir));
const binary=join(app,'Lens Studio.exe'),fd=openSync(binary,'r'),buffer=Buffer.alloc(1024*1024);let offset=0,tail='',count=0;
try{while(Date.now()<deadline&&(count=readSync(fd,buffer,0,buffer.length,offset))>0){const text=tail+buffer.subarray(0,count).toString('latin1'),parts=text.split('\0');tail=parts.pop().slice(-2048);for(const part of [...parts,buffer.subarray(0,count).toString('utf16le'),buffer.subarray(1,count).toString('utf16le')]){for(const printable of part.match(/[\x20-\x7e]{6,}/g)||[])if(printable.length<2000&&needles.test(printable))results.push({file:binary,offsetApprox:offset,text:printable.slice(0,1200)});}offset+=count;}}finally{closeSync(fd);}
const unique=[...new Map(results.map(row=>[row.file+'|'+row.text,row])).values()];const result={at:new Date().toISOString(),textFiles:files,textBytes:bytes,binaryBytesRead:offset,binaryBytes:statSync(binary).size,truncated:Date.now()>deadline,matches:unique};
writeFileSync(join(output,'settings-search.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({textFiles:files,binaryBytesRead:offset,truncated:result.truncated,matches:unique.filter(row=>row.file===binary&&!/grpc|Mapping|mapping|EMAIL|Texture|Video|audio|Audio|Animation|Animated|stream|Stream|encoding|Encoder|Decoder|H264|profile|Profile|h264|source|Source/.test(row.text))}));
