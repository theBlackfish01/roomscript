// Run 9 props: shrink a SPECS text-to-3D GLB to the ART_2D prop budget (about 0.2 MB, 256-512² texture).
// Bakes the GLB's lightmap (occlusion) into the base colour, writes one JPEG at --size (default 512),
// and drops the occlusion slot and every unused image. Geometry is copied unchanged.
// Usage: node Tooling/scripts/repack-prop-glb.mjs <in.glb> <out.glb> [--size=512] [--quality=82] [--ao=0.85]
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../art2d/package.json',import.meta.url));const sharp=require('sharp');
const [inp,out]=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const flag=(k,d)=>Number((process.argv.find(a=>a.startsWith('--'+k+'='))||'').split('=')[1]||d);
const size=flag('size',512),quality=flag('quality',82),aoStrength=flag('ao',.85);
const b=readFileSync(inp),jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString()),binStart=20+jl+8,bin=b.slice(binStart,binStart+b.readUInt32LE(20+jl));
const view=i=>{const v=j.bufferViews[i];return bin.slice(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);};
const imgOfTex=t=>j.images[j.textures[t].source];
if(j.materials.length!==1)throw Error('expected one material');const m=j.materials[0],pbr=m.pbrMetallicRoughness;
const base=view(imgOfTex(pbr.baseColorTexture.index).bufferView);
let img=sharp(base).resize(size,size,{fit:'fill'}).removeAlpha();
if(m.occlusionTexture){const ao=await sharp(view(imgOfTex(m.occlusionTexture.index).bufferView)).resize(size,size,{fit:'fill'}).removeAlpha().greyscale()
    .linear(aoStrength,255*(1-aoStrength)).toColourspace('srgb').png().toBuffer(); // soften: ao' = 1-k(1-ao)
  img=sharp(await img.png().toBuffer()).composite([{input:ao,blend:'multiply'}]);}
const jpeg=await img.jpeg({quality,mozjpeg:true}).toBuffer();
// rebuild the binary chunk: keep non-image views, append the jpeg
const imageViews=new Set(j.images.map(i=>i.bufferView));const parts=[],remap=new Map();let off=0;const views=[];
j.bufferViews.forEach((v,i)=>{if(imageViews.has(i))return;const data=view(i);remap.set(i,views.length);views.push({...v,byteOffset:off});parts.push(data);off+=data.length;const pad=(4-off%4)%4;if(pad){parts.push(Buffer.alloc(pad));off+=pad;}});
const jpegView=views.length;views.push({buffer:0,byteOffset:off,byteLength:jpeg.length});parts.push(jpeg);off+=jpeg.length;{const pad=(4-off%4)%4;if(pad){parts.push(Buffer.alloc(pad));off+=pad;}}
for(const a of j.accessors)if(a.bufferView!=null)a.bufferView=remap.get(a.bufferView);
j.bufferViews=views;j.images=[{bufferView:jpegView,mimeType:'image/jpeg',name:'baked'}];j.textures=[{sampler:0,source:0}];
pbr.baseColorTexture={index:0};delete m.occlusionTexture;pbr.metallicFactor=0;pbr.roughnessFactor=.8;m.name=(m.name||'prop')+'_rs';
j.buffers=[{byteLength:off}];
let js=Buffer.from(JSON.stringify(j));const jpad=(4-js.length%4)%4;js=Buffer.concat([js,Buffer.alloc(jpad,0x20)]);const binBuf=Buffer.concat(parts);
const header=Buffer.alloc(12);header.writeUInt32LE(0x46546C67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+js.length+8+binBuf.length,8);
const ch=(len,type)=>{const c=Buffer.alloc(8);c.writeUInt32LE(len,0);c.writeUInt32LE(type,4);return c;};
writeFileSync(out,Buffer.concat([header,ch(js.length,0x4E4F534A),js,ch(binBuf.length,0x004E4942),binBuf]));
console.log(JSON.stringify({out,kb:Math.round((12+16+js.length+binBuf.length)/1024),jpegKb:Math.round(jpeg.length/1024)}));
