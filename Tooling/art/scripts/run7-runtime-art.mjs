/** Generate an unimported Lens proposal and audit exact GLB bounds; no Assets writes. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..'),art=resolve(root,'Tooling/art'),stage=resolve(root,'Tooling/staging');
const manifest=JSON.parse(readFileSync(resolve(art,'run7-artassetmanifest.json'),'utf8'));mkdirSync(stage,{recursive:true});
const cases=(rows,type)=>rows.map(row=>`    case ${JSON.stringify(row.id)}:return ${type==='ObjectPrefab'?'checkedPrefab(':''}requireAsset(${JSON.stringify('../'+row.path.replace(/^Assets\//,''))})${type==='ObjectPrefab'?')':` as ${type}`};`).join('\n');
const source=`import {CaseGraph,GameState} from "./Engine/core/Types";
import {isHarlowPreset} from "./Engine/game/NarrativeAudio";
/** Proposed presentation registry. Static references are NOT a claim of lazy GPU loading. */
function checkedPrefab(asset:Asset):ObjectPrefab {
  if(!asset||typeof (asset as ObjectPrefab).instantiate!=="function")throw new Error("Imported prop primary is not ObjectPrefab: "+asset?.name);
  return asset as ObjectPrefab;
}
export function presetProp(graph:CaseGraph,id:string):ObjectPrefab|null {
  if(!isHarlowPreset(graph)||!graph.room.objects.some(object=>object.id===id))return null;
  switch(id){
${cases(manifest.props,'ObjectPrefab')}
    default:return null;
  }
}
function authoredCard(id:string):Texture|null {
  switch(id){
${cases(manifest.cards,'Texture')}
    default:return null;
  }
}
/** Caller displays only this admitted card; Dynamic never receives baked Harlow facts. */
export function admittedCard(graph:CaseGraph,state:GameState,id:string):{title:string;caption:string;texture:Texture;authored:boolean}|null {
  if(!state.knowledge.evidenceIds.includes(id))return null;
  const evidence=graph.evidence.find(entry=>entry.id===id);if(!evidence)return null;
  const holder=graph.room.objects.find(object=>object.id===evidence.holder);
  const specific=isHarlowPreset(graph)?authoredCard(id):null;
  return {title:(holder?.label||"Filed memory").split(/\\s+/).slice(0,3).join(" "),caption:evidence.canonical,
    texture:specific||(requireAsset("../Art/Run7/MemoryPhoto.png") as Texture),authored:!!specific};
}
`;
writeFileSync(resolve(stage,'RoomscriptArtLibrary.ts'),source);
const props=manifest.props.map(prop=>{
  const metadata=readFileSync(resolve(root,prop.path+'.meta'),'utf8');
  const primary=metadata.match(/PrimaryAsset: !<reference> ([\w-]+)/)?.[1],scene=metadata.match(/Scene: !<reference> ([\w-]+)/)?.[1];
  const data=metadata.match(/AssetDataMap:[\s\S]*?Scene: !<own> ([\w-]+)/)?.[1];
  if(!primary||primary!==scene||!data||!metadata.includes('!<ObjectPrefabAssetData/'+data+'>'))throw Error('PRIMARY_NOT_SCENE_PREFAB '+prop.path);
  const bytes=readFileSync(resolve(root,prop.path));if(bytes.readUInt32LE(0)!==0x46546c67)throw Error('NOT_GLB');
  const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
  // Current authored meshes have identity nodes. Reject any transform instead of reporting false bounds.
  for(const node of json.nodes||[])if(node.matrix||node.translation||node.rotation||node.scale)throw Error('NODE_TRANSFORM_REQUIRES_FULL_BOUNDS '+prop.path);
  const accessors=json.meshes.flatMap(mesh=>mesh.primitives.map(p=>json.accessors[p.attributes.POSITION]));
  const min=[0,1,2].map(axis=>Math.min(...accessors.map(a=>a.min[axis]))*100),max=[0,1,2].map(axis=>Math.max(...accessors.map(a=>a.max[axis]))*100);
  return {...prop,primaryAssetType:'ObjectPrefab',primarySubasset:'Scene',primaryDataId:data,boundsCm:{min,max},supportOffsetCm:[0,-min[1],0],footprintCm:[max[0]-min[0],max[2]-min[2]],note:prop.id==='O9'?'Preset fictional visual proxy; source graph calls mug a fixture. Never show as a newly detected object.':'Preset authored virtual prop.'};
});
writeFileSync(resolve(art,'run7-runtime-props.json'),JSON.stringify({schema:1,provenance:'Exact identity-node GLB POSITION accessor bounds, import conversion already100x',props},null,2)+'\n');
console.log(JSON.stringify({staged:'Tooling/staging/RoomscriptArtLibrary.ts',props:props.length,cards:manifest.cards.length,bounds:props.map(p=>({id:p.id,minY:p.boundsCm.min[1],footprintCm:p.footprintCm}))}));
