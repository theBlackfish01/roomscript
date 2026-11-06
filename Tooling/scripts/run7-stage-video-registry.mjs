import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),name='RoomscriptLeafIndex.ts',source=fs.readFileSync(path.join(root,'Assets/Scripts',name),'utf8');
const before='{id:"roomscript-continuous-capture",typename:RoomscriptContinuousCaptureLeafScenario.getTypeName(),parameters:{seconds:"5",input:"default",source:"capture"}},';
const after='{id:"roomscript-continuous-capture",typename:RoomscriptContinuousCaptureLeafScenario.getTypeName(),parameters:{seconds:"5",input:"default",source:"capture",quiet:"true"}},';
if(!source.includes(before))throw Error('Continuous capture registration changed');
fs.writeFileSync(path.join(root,'Tooling/staging',name),source.replace(before,after));
fs.writeFileSync(path.join(root,'Tooling/staging/run7-video-registry-source.json'),JSON.stringify({name,sha256:crypto.createHash('sha256').update(source).digest('hex')},null,2)+'\n');
console.log('Staged quiet parameter, retaining every other registry entry.');
