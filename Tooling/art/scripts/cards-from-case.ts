import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import * as source from '../../../Assets/Scripts/Content/HeroCaseHarlow1041';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const exported=Object.values(source);
const graph:any=exported.map(v=>typeof v==='function'?(v as Function)():v).find((v:any)=>v?.evidence&&v?.room);
if(!graph)throw new Error('Hero case export is missing');
const data={caseId:graph.caseId,cards:graph.evidence.map((e:any)=>({
  id:e.id,caption:e.canonical,holder:e.holder,holderLabel:graph.room.objects.find((o:any)=>o.id===e.holder)?.label||graph.cast.suspects.find((s:any)=>s.id===e.holder)?.name||e.holder,
  objectType:graph.room.objects.find((o:any)=>o.id===e.holder)?.type||'witness',
  facts:e.proves,time:(e.entities||[]).find((v:string)=>/^\d\d:\d\d$/.test(v))||'',
})),cast:graph.cast};
mkdirSync(resolve(root,'out'),{recursive:true});
writeFileSync(resolve(root,'out/case.json'),JSON.stringify(data,null,2)+'\n');
console.log('Case-derived cards:',data.cards.length);
