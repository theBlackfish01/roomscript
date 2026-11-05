// Read-only bounded completion wait. Does not invoke Lens, start scenarios or infer a pass.
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {harvestLocalLeaf,redact} from './harvest-local-leaf.mjs';
const [scenario,sinceText]=process.argv.slice(2),since=Number(sinceText);
if(!scenario?.startsWith('roomscript-')||!Number.isFinite(since))throw Error('Expected scenario ID and earliest request timestamp');
const log='C:/Users/wadoo/AppData/Local/Snap/Lens Studio/logs/LensStudioLog-2026-11-06-01-53-34-732-ab082.txt';
const deadline=Date.now()+270000;
while(Date.now()<deadline){
  const runs=harvestLocalLeaf(readFileSync(log,'utf8')).filter(run=>run.scenarioId===scenario&&Number(run.requestId.split(':')[1])>=since);
  const run=runs.at(-1);
  if(run&&['passed','failed','cancelled'].includes(run.latest.status)){
    execFileSync(process.execPath,['Tooling/scripts/harvest-local-leaf.mjs','--request',run.requestId],{windowsHide:true,timeout:30000,stdio:'ignore'});
    console.log(JSON.stringify({scenario,requestId:run.requestId,status:run.latest.status,elapsedMs:run.latest.elapsedMs,error:run.latest.error,evidence:run.evidenceLabel,markers:run.markers.map(m=>m.name)}));
    process.exitCode=run.latest.status==='passed'&&run.scopeComplete?0:1;break;
  }
  await new Promise(resolve=>setTimeout(resolve,1000));
}
if(Date.now()>=deadline){console.error(redact('Local LEAF completion wait expired: '+scenario));process.exitCode=2;}
