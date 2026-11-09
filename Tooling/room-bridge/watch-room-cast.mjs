/** Local log/file transport: no public relay, provider key, or HTTP request to Lens Studio. */
import fs from 'node:fs';import path from 'node:path';
import {scanRequests} from './watch-preview.mjs';
export function watchRoomCast({detect,cast,root}){
 const directory=path.join(process.env.LOCALAPPDATA,'Snap/Lens Studio/logs'),done=new Set();let busy=false;
 const output=path.join(root,'results/room-cast');fs.mkdirSync(output,{recursive:true});
 const replyPath=path.join(output,'live.json');
 const write=value=>fs.writeFileSync(replyPath,JSON.stringify(value));
 const fresh=id=>/^roomcast-\d+$/.test(id)&&Date.now()-Number(id.slice(9))<240000;
 const timer=setInterval(async()=>{if(busy)return;busy=true;try{
  const file=fs.readdirSync(directory).filter(n=>/^LensStudioLog-.*\.txt$/.test(n)).sort().at(-1);if(!file)return;
  const filename=path.join(directory,file),stat=fs.statSync(filename),size=Math.min(stat.size,8_000_000),buffer=Buffer.alloc(size),fd=fs.openSync(filename,'r');fs.readSync(fd,buffer,0,size,stat.size-size);fs.closeSync(fd);const log=buffer.toString('utf8');
  for(const request of scanRequests(log,1).filter(r=>fresh(r.id)&&!done.has(r.id+':scan'))){
   done.add(request.id+':scan');const frame=request.frames[0];
   try{const resultFile=path.join(output,request.id+'-detection.json');let response;
    if(fs.existsSync(resultFile))response=JSON.parse(fs.readFileSync(resultFile,'utf8'));else{fs.writeFileSync(path.join(output,request.id+'-frame.json'),JSON.stringify(frame));fs.writeFileSync(path.join(output,request.id+'.jpg'),Buffer.from(frame.jpeg,'base64'));response=await detect(frame,request.id);fs.writeFileSync(resultFile,JSON.stringify(response));}
    const {jpeg,...meta}=frame;write({requestId:request.id,stage:'detected',detection:{...response,frame:meta}});console.log(JSON.stringify({event:'room_cast_detected',id:request.id,objects:response.objects.length}));
   }catch(e){write({requestId:request.id,stage:'failed',error:'room_scan_unavailable'});console.log(JSON.stringify({event:'room_cast_failed',phase:'scan',id:request.id}));}
  }
  for(const line of log.split(/\r?\n/)){const index=line.indexOf('ROOM_CAST_REQUEST|');if(index<0)continue;let request;try{request=JSON.parse(line.slice(index+18));}catch{continue;}
   if(!fresh(request.id)||done.has(request.id+':cast'))continue;done.add(request.id+':cast');
   try{const frame=JSON.parse(fs.readFileSync(path.join(output,request.id+'-frame.json'),'utf8'));const result=await cast({...request,frame},request.id);
    const detection=JSON.parse(fs.readFileSync(path.join(output,request.id+'-detection.json'),'utf8'));
    write({requestId:request.id,stage:'cast',scan:request.scan,response:result,detection});console.log(JSON.stringify({event:'room_cast_ready',id:request.id}));
   }catch(e){write({requestId:request.id,stage:'failed',error:'room_cast_unavailable'});console.log(JSON.stringify({event:'room_cast_failed',phase:'cast',id:request.id}));}
  }
 }catch{console.log(JSON.stringify({event:'room_cast_watch_failed'}));}finally{busy=false;}},500);
 return ()=>clearInterval(timer);
}
