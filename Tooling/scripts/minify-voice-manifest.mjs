// Fix 10 (Run 9): shrink the generated voice manifests without changing their shape. Writes compact JSON,
// one record per line, with alignment times rounded to the millisecond (well under one video frame).
// Usage: node Tooling/scripts/minify-voice-manifest.mjs [files...]  (defaults to both manifests)
import {readFileSync,writeFileSync} from 'node:fs';
const files=process.argv.slice(2).length?process.argv.slice(2):['Assets/Scripts/Content/VoiceManifest.ts','Assets/Scripts/Content/Run7VoiceManifest.ts'];
const round=v=>typeof v==='number'&&!Number.isInteger(v)?Math.round(v*1000)/1000:v;
for(const file of files){
  const src=readFileSync(file,'utf8'),m=src.match(/^([\s\S]*?export const (\w+)\s*(?::[^=]+)?=\s*)(\[[\s\S]*\])\s*;?\s*$/);
  if(!m)throw Error('unrecognised manifest '+file);
  const data=JSON.parse(m[3]);
  const walk=x=>Array.isArray(x)?x.map(walk):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,walk(v)])):round(x);
  const out=m[1]+'[\n'+data.map(r=>JSON.stringify(walk(r))).join(',\n')+'\n];\n';
  writeFileSync(file,out);console.log(file,Math.round(src.length/1024)+'KB ->',Math.round(out.length/1024)+'KB',data.length,'records');
}
