import{readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';
const folder='Tooling/staging/run7/ui-diet/',manifest=JSON.parse(readFileSync(folder+'manifest.json','utf8')),hash=s=>createHash('sha256').update(s).digest('hex');
const rows=manifest.files.map(row=>{const path='Assets/Scripts/'+row.name,before=readFileSync(path,'utf8'),after=readFileSync(folder+row.name,'utf8');if(hash(before)!==row.sourceSha256||hash(after)!==row.stagedSha256)throw Error('Hash mismatch: '+row.name);return{path,after};});
for(const row of rows)writeFileSync(row.path,row.after);console.log(JSON.stringify({published:rows.map(r=>r.path),status:'hold resumed'}));
