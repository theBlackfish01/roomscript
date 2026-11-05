import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const trace=resolve(process.argv[2]);
const drill=process.argv.includes('--drill');
const reportPrefix=process.argv.includes('--startup')?'run7-leaf-startup':'run7-leaf-poststartup';
const report='Tooling/results/performance/'+reportPrefix+(drill?'-drill.json':'-sql.json');
const pairs=`WITH p AS (SELECT id,ts,dur,LEAD(ts) OVER (ORDER BY ts) AS next_ts FROM slice WHERE track_id=0 AND depth=0 AND name='ProcessFrame' AND dur>=0), r AS (SELECT p.id,p.ts,p.dur,p.next_ts,COUNT(c.id) AS renders,COALESCE(SUM(c.dur),0) AS render_dur,MIN(c.ts) AS render_start,MAX(c.ts+c.dur) AS render_end FROM p LEFT JOIN slice c ON c.track_id=0 AND c.depth=0 AND c.name='CoreManagerRender' AND c.dur>=0 AND c.ts>=p.ts AND c.ts<p.next_ts WHERE p.next_ts IS NOT NULL GROUP BY p.id), pairs AS (SELECT *, (dur+render_dur)/1e6 AS paired_ms,(next_ts-ts)/1e6 AS interval_ms,(next_ts-MAX(ts+dur,COALESCE(render_end,ts+dur)))/1e6 AS gap_ms FROM r)`;
const queries=drill?[
 ['firstUpdateChildren',"SELECT name,depth,dur/1e6 AS ms FROM slice WHERE parent_id=(SELECT id FROM slice WHERE track_id=0 AND name='Scene::Update' AND dur>=0 ORDER BY dur DESC LIMIT 1) ORDER BY dur DESC LIMIT 20"],
 ['trackingChildren',"SELECT c.name,COUNT(*) AS calls,SUM(c.dur)/1e9 AS total_seconds,AVG(c.dur)/1e6 AS mean_ms,MAX(c.dur)/1e6 AS max_ms FROM slice c JOIN slice p ON c.parent_id=p.id WHERE p.track_id=0 AND p.name='Track' AND c.dur>=0 GROUP BY c.name ORDER BY total_seconds DESC LIMIT 15"],
 ['majorSpans',"SELECT name,COUNT(*) AS calls,AVG(dur)/1e6 AS mean_ms,MAX(dur)/1e6 AS max_ms FROM slice WHERE track_id=0 AND dur>=0 AND name IN ('Track','Scene::Update','RenderFrame') GROUP BY name"]
]:[
 ['bounds','SELECT start_ts,end_ts,(end_ts-start_ts)/1e9 AS seconds FROM trace_bounds'],
 ['tracks','SELECT id,name,type FROM track LIMIT 20'],
 ['topLevel',"SELECT name,COUNT(*) AS calls,AVG(dur)/1e6 AS avg_ms,MAX(dur)/1e6 AS max_ms,SUM(dur)/1e9 AS sum_seconds FROM slice WHERE track_id=0 AND depth=0 AND dur>=0 GROUP BY name ORDER BY sum_seconds DESC LIMIT 15"],
 ['pairSummary',pairs+` SELECT COUNT(*) AS pairs,AVG(paired_ms) AS paired_mean_ms,MAX(paired_ms) AS paired_max_ms,AVG(interval_ms) AS interval_mean_ms,MAX(interval_ms) AS interval_max_ms,MAX(gap_ms) AS max_unaccounted_gap_ms,SUM(CASE WHEN renders<>1 THEN 1 ELSE 0 END) AS non_single_render_pairs,SUM(CASE WHEN render_start<ts+dur THEN 1 ELSE 0 END) AS overlap_pairs,SUM(CASE WHEN paired_ms<=8 THEN 1 ELSE 0 END) AS pairs_within_8ms FROM pairs`],
 ['percentiles',pairs+`, ranked AS (SELECT paired_ms,ROW_NUMBER() OVER (ORDER BY paired_ms) AS rn,COUNT(*) OVER () AS n FROM pairs) SELECT paired_ms,rn,n FROM ranked WHERE rn=CAST((n*0.5+0.999999) AS INT) OR rn=CAST((n*0.9+0.999999) AS INT) OR rn=CAST((n*0.99+0.999999) AS INT)`],
 ['worstGaps',pairs+` SELECT (ts-(SELECT start_ts FROM trace_bounds))/1e9 AS trace_seconds,paired_ms,interval_ms,gap_ms,renders FROM pairs ORDER BY gap_ms DESC LIMIT 10`],
 ['longestSlices',"SELECT name,depth,(ts-(SELECT start_ts FROM trace_bounds))/1e9 AS trace_seconds,dur/1e6 AS ms,parent_id FROM slice WHERE track_id=0 AND dur>=0 ORDER BY dur DESC LIMIT 20"],
 ['renderChildren',"SELECT name,depth,dur/1e6 AS ms FROM slice WHERE parent_id=(SELECT id FROM slice WHERE track_id=0 AND name='CoreManagerRender' AND dur>=0 ORDER BY dur DESC LIMIT 1) ORDER BY dur DESC LIMIT 20"],
 ['unclosed',"SELECT name,depth,COUNT(*) AS slices FROM slice WHERE dur<0 GROUP BY name,depth ORDER BY slices DESC LIMIT 10"],
 ['scheduling','SELECT COUNT(*) AS sched_count FROM sched']
];
const child=spawn(resolve('Tooling/bin/perfetto/venv/Scripts/python.exe'),['-u',resolve('Tooling/perfetto/run_trace_server.py'),trace,'--row-limit','50'],{windowsHide:true});
let err='',index=-1,buffer='',started=false;const results={trace,queries:[]};
const timeout=setTimeout(()=>{child.kill();console.error('SQL analysis exceeded120s');process.exitCode=1;},120000);
function next(){index++;if(index===queries.length){child.stdin.write('EXIT\n');return;}child.stdin.write(queries[index][1]+'\n');}
child.stderr.on('data',d=>{err+=d;if(!started&&err.includes('Ready.')){started=true;next();}});
child.stdout.on('data',d=>{buffer+=d;while(buffer.includes('END_OF_QUERY')){const at=buffer.indexOf('END_OF_QUERY');results.queries.push({name:queries[index][0],sql:queries[index][1],csv:buffer.slice(0,at).trim()});buffer=buffer.slice(at+'END_OF_QUERY'.length).replace(/^\r?\n/,'');next();}});
child.on('close',code=>{clearTimeout(timeout);writeFileSync(report,JSON.stringify({...results,exitCode:code,stderr:err},null,2));console.log(JSON.stringify({exitCode:code,queries:results.queries.length,report}));if(code||!started)process.exitCode=1;});
