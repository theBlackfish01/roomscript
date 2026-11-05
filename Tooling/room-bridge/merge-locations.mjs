import fs from 'node:fs';
const log=fs.readFileSync(process.argv[2],'utf8');
const observations=[];
for(const line of log.split(/\r?\n/)){const i=line.indexOf('ROOM_SCAN_LOCATED|');if(i>=0){const v=JSON.parse(line.slice(i+18));for(const o of v.located)if(o.hit)observations.push({...o,view:v.view,scanId:v.id});}}
const latest=new Map(observations.map(o=>[o.view+'|'+o.label,o]));
const labels=['media console','record player','left speaker','right speaker','woven chair','coffee table','sofa'];
const zoneFor=[0,0,0,1,1,2,2];
const chosen=labels.map(label=>{const rows=[...latest.values()].filter(o=>o.label===label);if(!rows.length)throw new Error('Missing '+label);rows.sort((a,b)=>(label==='record player'?b.hit.normal[1]-a.hit.normal[1]:b.confidence-a.confidence));return {...rows[0],observations:rows};});
// Two visible-floor World Query hits measured -177.07 and -174.58 cm.
const floorY=-176;
const zones=['Console','Reading corner','Lounge'].map((label,i)=>{const members=chosen.filter((_,j)=>zoneFor[j]===i);return {id:'Z'+(i+1),label:label.toLowerCase(),clueName:['Study','Conservatory','Lounge'][i],anchor:[members.reduce((s,o)=>s+o.hit.position[0],0)/members.length,-180,members.reduce((s,o)=>s+o.hit.position[2],0)/members.length]};});
const room={source:'vision',zones:zones.map(z=>({...z,anchor:[z.anchor[0],0,z.anchor[2]]})),objects:chosen.map((o,i)=>({id:'SCAN_'+(i+1),label:o.label,type:o.type,zone:zones[zoneFor[i]].id,pos:[o.hit.position[0],o.hit.position[1]-floorY,o.hit.position[2]],affordances:[],origin:'vision',confidence:o.confidence,virtual:false}))};
const result={schema:1,recordedAt:new Date().toISOString(),source:'Actual Evening Room CameraModule + Claude Opus + World Query',coordinateFrame:'Floor-local centimeters; original World Query positions retained in observations',floorY,room,observations:chosen};
fs.writeFileSync('Tooling/results/run7-room-scan/accepted-room.json',JSON.stringify(room,null,2)+'\n');
fs.writeFileSync('Tooling/results/run7-room-scan/placement-evidence.json',JSON.stringify(result,null,2)+'\n');
fs.writeFileSync('Assets/Scripts/Content/EveningRoomScan.ts','/** Recorded real Preview scan. Fictional roles are compiled separately. */\nimport {RoomInput} from "../Engine/room/RoomModel";\nexport const EVENING_ROOM_FLOOR_Y = '+floorY+';\nexport const EVENING_ROOM_SCAN:RoomInput = '+JSON.stringify(room,null,2)+';\n');
console.log(JSON.stringify({objects:room.objects.length,zones:room.zones.length,labels:chosen.map(o=>o.label)}));
