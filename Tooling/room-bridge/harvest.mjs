import fs from 'node:fs';
import path from 'node:path';
const log=process.argv[2];if(!log)throw new Error('Pass Lens log path');
const out='Tooling/results/run7-room-scan';fs.mkdirSync(out,{recursive:true});const frames=new Map();
for(const line of fs.readFileSync(log,'utf8').split(/\r?\n/)){
  let index=line.indexOf('ROOM_SCAN_META|');if(index>=0){const meta=JSON.parse(line.slice(index+15));frames.set(meta.id,{meta,chunks:[],length:0});}
  index=line.indexOf('ROOM_SCAN_CHUNK|');if(index>=0){const [id,offset,data]=line.slice(index+16).split('|');const frame=frames.get(id);if(frame)frame.chunks.push({offset:Number(offset),data});}
  index=line.indexOf('ROOM_SCAN_END|');if(index>=0){const [id,length]=line.slice(index+14).split('|');const frame=frames.get(id);if(frame)frame.length=Number(length);}
}
let count=0;for(const [id,frame] of frames){const sorted=frame.chunks.sort((a,b)=>a.offset-b.offset);let cursor=0;for(const chunk of sorted){if(chunk.offset!==cursor)throw new Error('Missing/duplicate chunk');cursor+=chunk.data.length;}const jpeg=sorted.map(c=>c.data).join('');if(!frame.length||jpeg.length!==frame.length)continue;fs.writeFileSync(path.join(out,id+'.jpg'),Buffer.from(jpeg,'base64'));fs.writeFileSync(path.join(out,id+'-camera.json'),JSON.stringify(frame.meta,null,2));console.log(JSON.stringify({id,bytes:Buffer.from(jpeg,'base64').length,meta:frame.meta}));count++;}if(!count)throw new Error('No complete frames');
