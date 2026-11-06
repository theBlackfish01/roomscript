import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
const scene=JSON.parse(readFileSync('.virtual-scene.json','utf8')),names=new Set(scene.sceneObjects.map(o=>o.name));
const rows=[];for(const file of readdirSync('Assets/Scripts').filter(n=>n.includes('Leaf')&&n.endsWith('.ts'))){const source=readFileSync('Assets/Scripts/'+file,'utf8');for(const match of source.matchAll(/findSceneObjectByName\("([^"]+)"\)/g))rows.push({file,name:match[1],authored:names.has(match[1])});}
const report={rows,unmatched:rows.filter(r=>!r.authored)};writeFileSync('Tooling/staging/run7/leaf-name-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.unmatched,null,2));
