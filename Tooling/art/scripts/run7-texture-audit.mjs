import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..'),art=path.join(root,'Tooling/art');
const manifest=JSON.parse(fs.readFileSync(path.join(art,'run7-artassetmanifest.json'),'utf8'));
const scene=JSON.parse(fs.readFileSync(path.join(root,'.virtual-scene.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'Assets/Scene.scene'),'utf8');
const rows=[];
for(const actor of manifest.actors){const component=scene.sceneObjects.flatMap(o=>o.components||[]).find(c=>c.name==='RoomscriptSuspectActor'&&c.properties.suspect?.value===actor.id);
 for(const [pose,file] of Object.entries(actor.poses)){const bytes=fs.readFileSync(path.join(root,file)),meta=fs.readFileSync(path.join(root,file+'.meta'),'utf8'),id=meta.match(/PrimaryAsset: !<reference> ([\w-]+)/)?.[1],width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 const bind=component?.properties[pose]?.value;
 rows.push({suspect:actor.id,actor:actor.name,pose,path:file,assetId:id,width,height,pngColorType:bytes[25],sourceBytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),decodedRGBABytes:width*height*4,importer:meta.match(/ImporterName: (\w+)/)?.[1],compression:meta.match(/CompressionSettings: !<([^>]+)>/)?.[1],level:meta.match(/Level: (\w+)/)?.[1],mipmap:meta.includes('Mipmap: true'),cachedBinding:bind,cachedBindingMatches:bind?.UUID===id,sceneMentionsAsset:source.includes(id)});
 }}
const allPng=manifest.assets.filter(a=>a.path.endsWith('.png'));
const report={at:new Date().toISOString(),provenance:'read-only files and cached VirtualScene; no runtime GPU residency measurement',portraits:rows,totals:{portraitCount:rows.length,sourceBytes:rows.reduce((n,r)=>n+r.sourceBytes,0),decodedRGBABytes:rows.reduce((n,r)=>n+r.decodedRGBABytes,0),allArtPngDecodedRGBABytes:allPng.reduce((n,a)=>n+(a.metrics?.width*a.metrics?.height*4||0),0)},settingsMissing:rows.filter(r=>r.compression!=='PerformanceCompressionSettings'||r.level!=='Medium'||r.pngColorType!==6).map(r=>r.path)};
fs.writeFileSync(path.join(art,'run7-texture-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({totals:report.totals,settingsMissing:report.settingsMissing,bindings:rows.map(r=>({suspect:r.suspect,pose:r.pose,cachedBinding:r.cachedBinding,sceneMentionsAsset:r.sceneMentionsAsset}))}));
