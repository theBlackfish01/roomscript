/** Preview-only file handoff. Reads Lens logs, never calls Lens Studio HTTP. */
import fs from 'node:fs';
import path from 'node:path';
export function scanRequests(log,minFrames=3){
  const frames=new Map();
  for(const line of log.split(/\r?\n/)){
    let i=line.indexOf('ROOM_SCAN_META|');if(i>=0){try{const meta=JSON.parse(line.slice(i+15));if(meta.bridgeRequest)frames.set(meta.id,{...meta,chunks:new Map()});}catch{}}
    i=line.indexOf('ROOM_SCAN_CHUNK|');if(i>=0){const [id,offset,data]=line.slice(i+16).split('|');frames.get(id)?.chunks.set(Number(offset),data);}
    i=line.indexOf('ROOM_SCAN_END|');if(i>=0){const [id,len]=line.slice(i+14).split('|');const frame=frames.get(id);if(frame)frame.length=Number(len);}
  }
  const groups=new Map();for(const frame of frames.values()){
    let jpeg='',valid=true;for(const [offset,data] of [...frame.chunks].sort((a,b)=>a[0]-b[0])){if(offset!==jpeg.length){valid=false;break;}jpeg+=data;}
    if(!valid||!frame.length||jpeg.length!==frame.length)continue;
    const {chunks,length,...meta}=frame;const group=groups.get(meta.bridgeRequest)||[];group.push({...meta,jpeg});groups.set(meta.bridgeRequest,group);
  }
  return [...groups].filter(([,frames])=>frames.length>=minFrames).map(([id,frames])=>({id,frames:frames.slice(0,minFrames)}));
}
export function watchPreview({detect,root}){
  const directory=path.join(process.env.LOCALAPPDATA,'Snap/Lens Studio/logs');const handled=new Set();let busy=false;
  const replyPath=path.resolve(root,'../Assets/Scripts/Content/LiveScanReply.ts');
  const writeReply=value=>fs.writeFileSync(replyPath,'/** Local Preview scan handoff. No provider credentials. */\nexport const LIVE_SCAN_REPLY:any = '+JSON.stringify(value)+';\n');
  const timer=setInterval(async()=>{if(busy)return;busy=true;try{
    const file=fs.readdirSync(directory).filter(n=>/^LensStudioLog-.*\.txt$/.test(n)).sort().at(-1);if(!file)return;
    const stat=fs.statSync(path.join(directory,file));const fd=fs.openSync(path.join(directory,file),'r'),size=Math.min(stat.size,3_000_000),buffer=Buffer.alloc(size);fs.readSync(fd,buffer,0,size,stat.size-size);fs.closeSync(fd);
    const requests=scanRequests(buffer.toString('utf8')).filter(r=>!handled.has(r.id)&&Date.now()-Number(r.id.replace('live-',''))<120000);
    for(const request of requests){handled.add(request.id);const views=[];try{for(let i=0;i<request.frames.length;i++){const frame=request.frames[i],result=await detect(frame,request.id+'-'+i);const {jpeg,...meta}=frame;views.push({frame:meta,response:result});}writeReply({requestId:request.id,views,error:null});console.log(JSON.stringify({event:'live_scan_ready',requestId:request.id,views:views.length}));}catch{writeReply({requestId:request.id,views:[],error:'Scan unavailable. Preset is ready.'});console.log(JSON.stringify({event:'live_scan_fallback',requestId:request.id}));}}
  }finally{busy=false;}},500);
  return ()=>clearInterval(timer);
}
