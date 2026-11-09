import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {watchRoomCast} from './watch-room-cast.mjs';
test('restarting the watcher cannot overwrite the latest scan with an older cast',async()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'room-cast-test-')),previous=process.env.LOCALAPPDATA;process.env.LOCALAPPDATA=base;
 const logs=path.join(base,'Snap/Lens Studio/logs');fs.mkdirSync(logs,{recursive:true});const root=path.join(base,'Tooling');
 const old='roomcast-'+(Date.now()-1000),latest='roomcast-'+Date.now(),calls=[];
 const frame=(id,n)=>'ROOM_SCAN_META|'+JSON.stringify({id:'f'+n,bridgeRequest:id})+'\nROOM_SCAN_CHUNK|f'+n+'|0|YWJj\nROOM_SCAN_END|f'+n+'|4\n';
 fs.writeFileSync(path.join(logs,'LensStudioLog-test.txt'),frame(old,0)+'ROOM_CAST_REQUEST|'+JSON.stringify({id:old})+'\n'+frame(latest,1));
 const stop=watchRoomCast({root,detect:async(frame,id)=>{calls.push(id);return {objects:[]};},cast:async()=>{throw Error('stale cast must not run');}});
 try{await new Promise(r=>setTimeout(r,1100));const reply=JSON.parse(fs.readFileSync(path.join(root,'results/room-cast/live.json')));assert.equal(reply.requestId,latest);assert.equal(reply.stage,'detected');assert.deepEqual(calls,[latest]);}
 finally{stop();if(previous===undefined)delete process.env.LOCALAPPDATA;else process.env.LOCALAPPDATA=previous;fs.rmSync(base,{recursive:true,force:true});}
});
