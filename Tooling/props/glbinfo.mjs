import {readFileSync} from 'node:fs';
for(const f of process.argv.slice(2)){const b=readFileSync(f);const jl=b.readUInt32LE(12);const j=JSON.parse(b.slice(20,20+jl).toString());
const prims=j.meshes.flatMap(m=>m.primitives);const attrs=[...new Set(prims.flatMap(p=>Object.keys(p.attributes)))];
const imgs=(j.images||[]).map(im=>({mime:im.mimeType,bytes:im.bufferView!=null?j.bufferViews[im.bufferView].byteLength:0}));
console.log(f,JSON.stringify({meshes:j.meshes.length,prims:prims.length,attrs,materials:(j.materials||[]).map(m=>({name:m.name,alpha:m.alphaMode,pbr:Object.keys(m.pbrMetallicRoughness||{}),ext:Object.keys(m.extensions||{})})),imgs,ext:j.extensionsUsed}));}
