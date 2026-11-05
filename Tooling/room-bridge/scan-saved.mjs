/** Explicit offline vision pass on captured simulated room frames. */
import fs from 'node:fs';
import path from 'node:path';
for(const file of process.argv.slice(2)){
  const meta=JSON.parse(fs.readFileSync(file.replace(/\.jpg$/,'-camera.json'),'utf8'));
  const response=await fetch('http://127.0.0.1:8787/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...meta,jpeg:fs.readFileSync(file).toString('base64')}),signal:AbortSignal.timeout(110000)});
  const result=await response.json();if(!response.ok){console.log(JSON.stringify({file:path.basename(file),error:result.error}));process.exitCode=1;break;}
  console.log(JSON.stringify({source:path.basename(file),resultId:result.id,objects:result.objects}));
}
