/** Read-only art inventory + exact current VirtualScene handoff. No scene writes. */
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..'),art=resolve(root,'Tooling/art');
const manifest=JSON.parse(readFileSync(resolve(art,'manifest.json'),'utf8'));
const registry=JSON.parse(readFileSync(resolve(art,'generated/ArtManifest.ts'),'utf8').split('export const ROOMSCRIPT_ART = ')[1].replace(/ as const;\s*$/,''));
const scene=JSON.parse(readFileSync(resolve(root,'.virtual-scene.json'),'utf8')),modify={},actors=[];
for(const actor of registry.actors){
  const matches=scene.sceneObjects.flatMap(o=>(o.components||[]).filter(c=>c.name==='RoomscriptSuspectActor'&&c.properties.suspect?.value===actor.id).map(c=>({o,c})));
  if(matches.length!==1)throw Error('ACTOR_COMPONENT_NOT_UNIQUE '+actor.id);
  const {o,c}=matches[0],properties=Object.fromEntries(Object.entries(actor.poses).map(([pose,path])=>[pose,'@asset:'+path.replace(/^Assets\//,'')]));
  modify['@id:'+c.id]=properties;
  actors.push({...actor,sceneObject:o.name,componentId:c.id,bindings:properties,localTellAnchorCm:[(actor.anchor[0]/512-.5)*85,(1-actor.anchor[1]/1024)*170,5]});
}
const assets=manifest.assets.map(a=>{
  const file=resolve(root,a.path),bytes=readFileSync(file),sha256=createHash('sha256').update(bytes).digest('hex');
  if(sha256!==a.sha256)throw Error('ART_HASH_CHANGED '+a.path);
  const meta=readFileSync(file+'.meta','utf8');
  return {...a,assetRef:'@asset:'+a.path.replace(/^Assets\//,''),primaryAssetId:meta.match(/PrimaryAsset: !<reference> ([\w-]+)/)?.[1],compression:meta.match(/Level: (\w+)/)?.[1]||null,mipmap:meta.includes('Mipmap: true'),decodedRgbaBytes:a.metrics?.width*a.metrics?.height*4||0,convertMetersToCentimeters:meta.includes('ConvertMetersToCentimeters: true')};
});
const ghosts=registry.actors.map(a=>({id:a.id,name:a.name,preset:{claim:`Assets/Art/Ghosts/${a.name}-claim.png`,truth:`Assets/Art/Ghosts/${a.name}-truth.png`,suggestion:`Assets/Art/Ghosts/${a.name}-suggestion.png`},dynamicTintable:a.poses.neutral}));
const props=registry.props.map(p=>({...p,heightCm:p.heightMeters*100,primaryAssetId:assets.find(a=>a.path===p.path).primaryAssetId,importAlreadyConvertsMeters:true,instanceScale:[1,1,1]}));
const report={schema:1,provenance:'Run6 deterministic art audited from committed source; current snapshot bindings only, not applied or Preview-verified',actors,cards:registry.cards,props,ghosts,victim:{standing:'Assets/Art/Actors/Harlow/Harlow-standing.png',falling:'Assets/Art/Actors/Harlow/Harlow-falling.png'},heroWords:registry.heroWords,assets,totals:{files:assets.length,sourceBytes:assets.reduce((n,a)=>n+a.bytes,0),decodedRgbaBytes:assets.reduce((n,a)=>n+a.decodedRgbaBytes,0),portraitDecodedRgbaBytes:assets.filter(a=>a.kind==='portrait').reduce((n,a)=>n+a.decodedRgbaBytes,0)}};
writeFileSync(resolve(art,'run7-artassetmanifest.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(resolve(art,'run7-actor-bindings.json'),JSON.stringify({command:'apply',instructions:{modify}},null,2)+'\n');
console.log(JSON.stringify({verifiedHashes:assets.length,actors:actors.length,poseBindings:Object.values(modify).reduce((n,p)=>n+Object.keys(p).length,0),cards:registry.cards.length,props:props.length,ghosts:ghosts.length*3,totals:report.totals}));
