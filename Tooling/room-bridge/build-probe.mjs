import fs from 'node:fs';
const ids=process.argv.slice(2);
const views=ids.map(id=>({frame:JSON.parse(fs.readFileSync(`Tooling/results/run7-room-scan/${id}-camera.json`,'utf8')),response:JSON.parse(fs.readFileSync(`Tooling/results/run7-room-scan/${id}-response.json`,'utf8'))}));
fs.writeFileSync('Assets/Scripts/Content/RoomScanProbe.ts','/** Actual Preview camera observations; untrusted proposals, not game truth. */\nexport const ROOM_SCAN_PROBE = '+JSON.stringify(views,null,2)+';\n');
console.log(JSON.stringify({views:views.length,objects:views.map(v=>v.response.objects.length)}));
