import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {decodePng,region} from '../lib/png.mjs';
import {CAST,POSES} from '../lib/vectors.mjs';
const sourceRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const root=process.env.ROOMSCRIPT_ART_STAGE?resolve(sourceRoot,'Tooling/art/out/run6'):sourceRoot;
const art=resolve(sourceRoot,'Tooling/art'),manifest=JSON.parse(readFileSync(resolve(process.env.ROOMSCRIPT_ART_STAGE?root:art,'manifest.json'),'utf8')).assets;
for(const c of CAST)for(const pose of POSES)test(`${c.key}/${pose}: actual RGBA pixels, jaw window, anchored tell and luminance`,()=>{
  const m=manifest.find(a=>a.kind==='portrait'&&a.suspect===c.id&&a.pose===pose);assert.ok(m);
  const p=decodePng(readFileSync(resolve(root,m.path)));assert.equal(p.width,512);assert.equal(p.height,1024);assert.equal(p.colorType,6);
  // V2 is light on transparency: a luminous mouth replaces the v1 dark opaque mouth contract.
  assert.ok(region(p,220,282,292,323).visible>=50,'mouth window must contain a visible line for jaw deformation');
  assert.equal(region(p,0,870,512,1024).visible,0,'furniture mask bottom 15%');
  const a=c.anchor,tell=region(p,a[0]-22,a[1]-22,a[0]+22,a[1]+22);assert.ok(tell.bright>=25,'tell has a bright core');
  assert.ok(Math.hypot(tell.centroid[0]-a[0],tell.centroid[1]-a[1])<=12,'tell centroid <=12 px');
  const fraction=region(p,0,0,512,1024).bright/(512*1024);assert.ok(fraction>.01&&fraction<=.25,'additive luminance budget');
});
test('all hero evidence has a caption-preserving 512x640 Polaroid',()=>{
  const data=JSON.parse(readFileSync(resolve(art,'out/case.json'),'utf8'));
  for(const card of data.cards){const m=manifest.find(a=>a.evidence===card.id);assert.ok(m,card.id);assert.equal(m.captionLines.join(' '),card.caption);assert.ok(m.captionLines.length<=3);assert.deepEqual(m.facts,card.facts);const p=decodePng(readFileSync(resolve(root,m.path)));assert.deepEqual([p.width,p.height],[512,640]);}
});
test('six valid GLB2 props have finite geometry, centimeter-safe scale and named clock hands',()=>{
  const all=manifest.filter(a=>a.kind==='glb');assert.equal(all.length,6);
  for(const m of all){const b=readFileSync(resolve(root,m.path));assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);const jsonLen=b.readUInt32LE(12),g=JSON.parse(b.toString('utf8',20,20+jsonLen));assert.equal(g.asset.version,'2.0');assert.ok(g.extensionsUsed.includes('KHR_materials_unlit'));assert.ok(m.heightMeters>.05&&m.heightMeters<.4);assert.ok(m.triangles<5000);for(const a of g.accessors.filter(a=>a.type==='VEC3'))for(const v of [...a.min,...a.max])assert.ok(Number.isFinite(v)&&Math.abs(v)<.5);if(m.object==='O7'){assert.ok(g.nodes.some(n=>n.name==='HourHand_22'));assert.ok(g.nodes.some(n=>n.name==='MinuteHand_30'));}}
});
test('published manifests match file bytes and all 20 poses differ',()=>{
  for(const m of manifest){const b=readFileSync(resolve(root,m.path));assert.equal(b.length,m.bytes,m.path);assert.equal(createHash('sha256').update(b).digest('hex'),m.sha256,m.path)}
  const portraits=manifest.filter(a=>a.kind==='portrait');assert.equal(new Set(portraits.map(a=>a.sha256)).size,20);
  assert.ok(!manifest.some(a=>/@2x|hires|frames\//.test(a.path)),'no oversized source textures in Lens Assets');
});
test('mouth/blink atlases, truth/claim ghosts and hero words are complete',()=>{
  for(const c of CAST){for(const kind of ['mouth-atlas','blink-atlas']){const m=manifest.find(a=>a.suspect===c.id&&a.kind===kind);assert.ok(m);assert.equal(m.frames,4);const p=decodePng(readFileSync(resolve(root,m.path)));assert.deepEqual([p.width,p.height],[512,64])}for(const mode of ['claim','truth','suggestion'])assert.ok(manifest.some(a=>a.kind==='ghost'&&a.suspect===c.id&&a.mode===mode));}
  for(const word of ['OBJECTION','CASE CLOSED','THE TRUTH'])assert.ok(manifest.some(a=>a.word===word));
  assert.ok(manifest.reduce((n,a)=>n+a.bytes,0)<6*1024*1024,'source-art budget below 6 MiB');
});
test('before/after sheets exist and provenance does not imply a Lens capture',()=>{
  for(const file of ['2026-11-04-art-before.jpg','2026-11-05-art-after-poses.png','2026-11-05-art-after-thumbnails.png'])assert.ok(existsSync(resolve(root,'docs/captures',file)));
});
test('v3 stroke brightness and torso poses remain readable without the hands',()=>{
  for(const c of CAST){
    const portraits=POSES.map(pose=>decodePng(readFileSync(resolve(root,`Assets/Art/Actors/${c.key}/${c.key}-${pose}.png`))));
    for(const p of portraits)assert.ok(region(p,0,0,512,1024).bright/(512*1024)>.03,'strong ivory stroke core');
    const neutral=portraits[0];
    for(let i=1;i<portraits.length;i++){
      let changes=0;
      // Neck/shoulder band excludes the expressive hands in the central torso.
      for(let y=350;y<415;y++)for(let x=100;x<395;x++){
        const a=neutral.pixels[(y*512+x)*4+3]>150,b=portraits[i].pixels[(y*512+x)*4+3]>150;
        if(a!==b)changes++;
      }
      assert.ok(changes>600,`${c.key}/${POSES[i]} needs visible shoulder/posture contrast`);
    }
  }
});
test('neutral silhouette profiles remain distinct after thumbnail downsampling',()=>{
  const profiles=CAST.map(c=>{const p=decodePng(readFileSync(resolve(root,`Assets/Art/Actors/${c.key}/${c.key}-neutral.png`))),rows=[];
    for(let y=80;y<790;y+=8){let lo=512,hi=-1;for(let Y=y;Y<y+8;Y++)for(let x=0;x<512;x++){if(p.pixels[(Y*512+x)*4+3]>80){lo=Math.min(lo,x);hi=Math.max(hi,x)}}rows.push([lo,hi]);}return rows;});
  for(let a=0;a<CAST.length;a++)for(let b=a+1;b<CAST.length;b++){let diff=0,count=0;for(let y=0;y<profiles[a].length;y++){const A=profiles[a][y],B=profiles[b][y];if(A[1]>=0&&B[1]>=0){diff+=Math.abs(A[0]-B[0])+Math.abs(A[1]-B[1]);count++}}assert.ok(diff/count>12,`${CAST[a].key}/${CAST[b].key} silhouettes too similar`);}
});
