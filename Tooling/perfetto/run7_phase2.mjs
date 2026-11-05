import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const trace=resolve(process.argv[2]);
const queries=[
 ['identity','SELECT pid,name FROM process LIMIT 10'],
 ['threads','SELECT id,name,type FROM track WHERE id=0 LIMIT 10'],
 ['topLevel','SELECT name,COUNT(*) AS calls,SUM(dur)/1e6 AS total_ms,AVG(dur)/1e6 AS avg_ms,MIN(dur)/1e6 AS min_ms,MAX(dur)/1e6 AS max_ms FROM slice WHERE track_id=0 AND depth=0 GROUP BY name ORDER BY total_ms DESC LIMIT 15'],
 ['trackChildren',"SELECT c.name,COUNT(*) AS calls,SUM(c.dur)/1e6 AS total_ms,AVG(c.dur)/1e6 AS avg_ms,MAX(c.dur)/1e6 AS max_ms FROM slice c JOIN slice p ON c.parent_id=p.id WHERE c.track_id=0 AND p.track_id=0 AND p.name='Track' GROUP BY c.name ORDER BY total_ms DESC LIMIT 20"],
 ['updateChildren',"SELECT c.name,COUNT(*) AS calls,SUM(c.dur)/1e6 AS total_ms,AVG(c.dur)/1e6 AS avg_ms,MAX(c.dur)/1e6 AS max_ms FROM slice c JOIN slice p ON c.parent_id=p.id WHERE c.track_id=0 AND p.track_id=0 AND p.name='Scene::Update' GROUP BY c.name ORDER BY total_ms DESC LIMIT 20"],
 ['frames',"SELECT id,name,ts,dur FROM slice WHERE track_id=0 AND depth=0 AND name IN ('ProcessFrame','CoreManagerRender') ORDER BY ts LIMIT 800"],
 ['worstChildren',"SELECT name,depth,dur/1e6 AS ms FROM slice WHERE track_id=0 AND parent_id=(SELECT id FROM slice WHERE track_id=0 AND name='ProcessFrame' ORDER BY dur DESC LIMIT 1) ORDER BY dur DESC LIMIT 20"],
 ['counters','SELECT t.name,COUNT(*) AS samples,AVG(c.value) AS avg_value,MAX(c.value) AS max_value FROM counter c JOIN counter_track t ON c.track_id=t.id GROUP BY t.name LIMIT 20'],
 ['scheduling','SELECT COUNT(*) AS sched_count FROM sched']
];
const child=spawn(resolve('Tooling/bin/perfetto/venv/Scripts/python.exe'),['-u',resolve('Tooling/perfetto/run_trace_server.py'),trace,'--row-limit','800'],{windowsHide:true});
let out='',err='',index=-1,buffer='',started=false; const results={trace,queries:[]};
const timeout=setTimeout(()=>{child.kill();throw Error('Phase2 exceeded 90s');},90000);
function next(){index++;if(index===queries.length){child.stdin.write('EXIT\n');return;}child.stdin.write(queries[index][1]+'\n');}
child.stderr.on('data',d=>{err+=d; if(!started&&err.includes('Ready.')){started=true;next();}});
child.stdout.on('data',d=>{out+=d;buffer+=d;while(buffer.includes('END_OF_QUERY')){const at=buffer.indexOf('END_OF_QUERY');results.queries.push({name:queries[index][0],sql:queries[index][1],csv:buffer.slice(0,at).trim()});buffer=buffer.slice(at+'END_OF_QUERY'.length).replace(/^\r?\n/,'');next();}});
child.on('close',code=>{clearTimeout(timeout);writeFileSync('Tooling/results/performance/run7-s2-phase2.json',JSON.stringify({...results,exitCode:code,stderr:err},null,2)); console.log(JSON.stringify({exitCode:code,queries:results.queries.length,report:'Tooling/results/performance/run7-s2-phase2.json'}));if(code||!started)process.exitCode=1;});
