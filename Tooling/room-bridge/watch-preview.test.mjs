import test from 'node:test';import assert from 'node:assert/strict';import {scanRequests} from './watch-preview.mjs';
test('room casting accepts one complete frame but never a partial capture',()=>{
 const meta='ROOM_SCAN_META|'+JSON.stringify({id:'scan-1',bridgeRequest:'roomcast-123'})+'\n';
 const chunks='ROOM_SCAN_CHUNK|scan-1|0|YWJj\n',end='ROOM_SCAN_END|scan-1|4\n';
 assert.equal(scanRequests(meta+chunks,1).length,0);
 assert.equal(scanRequests(meta+chunks+end,1)[0].id,'roomcast-123');
 assert.equal(scanRequests(meta+chunks+end).length,0);
 assert.equal(scanRequests(meta+chunks.replace('|0|','|9|')+end,1).length,0);
});
test('requires complete three-frame request, ignores stale/offline frames',()=>{let log='';for(let i=0;i<3;i++){log+='ROOM_SCAN_META|'+JSON.stringify({id:'f'+i,bridgeRequest:'live-123'})+'\nROOM_SCAN_CHUNK|f'+i+'|0|YWJj\nROOM_SCAN_END|f'+i+'|4\n';if(i<2)assert.equal(scanRequests(log).length,0);}assert.equal(scanRequests(log)[0].frames.length,3);assert.equal(scanRequests(log)[0].frames[0].jpeg,'YWJj');assert.equal(scanRequests(log.replace('f1|0|','f1|9|')).length,0);});
