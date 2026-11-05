import fs from 'node:fs';
import {sceneTokenFields} from './scene-tokens.mjs';
const d=JSON.parse(fs.readFileSync('.virtual-scene.json','utf8'));
for(const o of d.sceneObjects.filter(o=>/Camera Object|SpectaclesInteractionKit|RoomscriptVoice|RoomscriptAudio/.test(o.name))) {
  console.log(JSON.stringify({name:o.name,components:o.components.map(c=>({type:c.type,name:c.name,properties:Object.fromEntries(Object.entries(c.properties??{}).filter(([k])=>/cameraType|deviceTrackingMode|voiceLibrary|stageMode/.test(k)))}))}));
}
const fields=sceneTokenFields(fs.readFileSync('Assets/Scene.scene','utf8'));
console.log(JSON.stringify({gatewayFields:fields.length,nonempty:fields.filter(f=>!f.empty).length}));
if(fields.some(f=>!f.empty))process.exitCode=1;
