// Read-only lens size estimate (fix 10). Sizes every asset under Assets/ (and Packages/), and marks an asset
// unreferenced when no scene, prefab, material or other meta mentions its UUIDs and no script names its path
// in requireAsset. Usage: node Tooling/scripts/asset-budget.mjs [--list-unref] [--json out.json]
import {readdirSync,statSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,relative,dirname,posix} from 'node:path';
const BS=String.fromCharCode(92),root=process.cwd(),A=join(root,'Assets');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(d,e.name)):[join(d,e.name)]);
const all=walk(A),metas=all.filter(f=>f.endsWith('.meta')),assets=all.filter(f=>!f.endsWith('.meta'));
const textual=all.filter(f=>/\.(scene|prefab|mat|meta|graphShader|ss_graph|json|lsc)$/i.test(f)&&statSync(f).size<8e6);
const corpus=textual.map(f=>({f,t:readFileSync(f,'utf8')}));
const scripts=assets.filter(f=>/\.(ts|js)$/.test(f)).map(f=>({f,t:readFileSync(f,'utf8')}));
const reqPaths=new Set();for(const s of scripts)for(const m of s.t.matchAll(/requireAsset\(\s*["'`]([^"'`]+)["'`]/g))reqPaths.add(posix.normalize(posix.join(posix.dirname(relative(root,s.f).split(BS).join('/')),m[1])));
const uuidsOf=meta=>{if(!existsSync(meta))return[];const t=readFileSync(meta,'utf8');return [...new Set([...t.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)].map(m=>m[0]).filter(id=>id!=='00000000-0000-0000-0000-000000000000'))];};
const rows=[];
for(const f of assets){const rel=relative(root,f).split(BS).join('/'),size=statSync(f).size,meta=f+'.meta';
  const ids=uuidsOf(meta).slice(0,40);let ref=reqPaths.has(rel);
  if(!ref&&ids.length){const own=meta;for(const c of corpus){if(c.f===own)continue;if(ids.some(id=>c.t.includes(id))){ref=true;break;}}}
  rows.push({rel,size,ref,ext:(rel.match(/\.[^.\/]+$/)||[''])[0].toLowerCase(),top:rel.split('/').slice(0,3).join('/')});}
const byTop={};for(const r of rows){const k=r.top;byTop[k]=byTop[k]||{bytes:0,unref:0,files:0};byTop[k].bytes+=r.size;byTop[k].files++;if(!r.ref)byTop[k].unref+=r.size;}
const mb=b=>Math.round(b/1048576*100)/100,code=/\.(ts|js|md|txt)$/;
const media=rows.filter(r=>!code.test(r.rel));
console.log('total media MB',mb(media.reduce((s,r)=>s+r.size,0)),'referenced MB',mb(media.filter(r=>r.ref).reduce((s,r)=>s+r.size,0)),'unreferenced MB',mb(media.filter(r=>!r.ref).reduce((s,r)=>s+r.size,0)));
for(const [k,v] of Object.entries(byTop).sort((a,b)=>b[1].bytes-a[1].bytes).slice(0,25))console.log(k.padEnd(48),String(mb(v.bytes)).padStart(7),'MB  unref',mb(v.unref),' files',v.files);
if(process.argv.includes('--list-unref'))for(const r of media.filter(r=>!r.ref).sort((a,b)=>b.size-a.size))console.log('UNREF',Math.round(r.size/1024)+'KB',r.rel);
const j=process.argv.indexOf('--json');if(j>0)writeFileSync(process.argv[j+1],JSON.stringify(rows,null,1));
