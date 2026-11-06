/** Run only after main releases Assets. Validate the entire batch before any write. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const folder='Tooling/staging/run7/leaf-routes/';
const manifest=JSON.parse(readFileSync(folder+'manifest.json','utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const pending=manifest.files.map(row=>{
 const target='Assets/Scripts/'+row.name,before=readFileSync(target,'utf8'),after=readFileSync(folder+row.name,'utf8');
 if(hash(before)!==row.sourceSha256)throw Error('Source changed; rebase first: '+row.name);
 if(hash(after)!==row.stagedSha256)throw Error('Staged content changed: '+row.name);
 return {target,after};
});
for(const row of pending)writeFileSync(row.target,row.after);
console.log(JSON.stringify({published:pending.map(row=>row.target),status:'Assets stable; hold resumed'}));
