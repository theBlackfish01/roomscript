// Offline visual check only: composites against the camera-frame inset in an
// existing Preview capture. It does not claim a new runtime render or device QA.
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {CAST,POSES,text,palette as P} from '../lib/vectors.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..'),REPO=resolve(ROOT,'../..');
const staged=process.argv.includes('--stage'),output=staged?resolve(ROOT,'out/run6'):REPO;
const assets=resolve(output,'Assets/Art'),captures=resolve(output,'docs/captures');
mkdirSync(captures,{recursive:true});
const room=resolve(REPO,'docs/captures/2026-10-28-a4-camera-fixed.png');
const jobs=CAST.map(c=>({width:1500,height:970,scale:1,background:'#10151C',
  output:resolve(captures,`2026-11-05-art-room-${c.key}.png`),items:[
    text(`${c.key.toUpperCase()} / ALL FIVE POSES`,30,22,34,P.ivory),
    text('OFFLINE COMPOSITE / HISTORICAL PREVIEW CAMERA FRAME / NOT A RUNTIME CAPTURE',30,71,20,P.yellow),
    {type:'image',path:room,source:[509,1146,439,242],x:0,y:118,w:1500,h:827},
    ...POSES.flatMap((pose,i)=>[{type:'image',path:resolve(assets,`Actors/${c.key}/${c.key}-${pose}.png`),x:i*300,y:153,w:300,h:600},
      text(pose.toUpperCase(),i*300+150,810,22,P.ivory,{align:'center'})]),
    text('Source: docs/captures/2026-10-28-a4-camera-fixed.png (camera inset crop)',30,945,15,P.ivory)
  ]}));
const batch=resolve(ROOT,'out/composite.json');writeFileSync(batch,JSON.stringify(jobs));
execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',resolve(ROOT,'scripts/render.ps1'),'-Batch',batch],{timeout:120000,stdio:'inherit',windowsHide:true});
