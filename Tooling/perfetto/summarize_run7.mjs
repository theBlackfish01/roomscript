import {readFileSync,writeFileSync} from 'node:fs';
const phase=JSON.parse(readFileSync('Tooling/results/performance/run7-s2-phase2.json','utf8'));
const csv=phase.queries.find(q=>q.name==='frames').csv.trim().split(/\r?\n/).filter(x=>x.trim());
const frames=csv.slice(1).map(line=>{const[id,name,ts,dur]=line.trim().split(',');return{id:Number(id),name,ts:Number(ts),dur:Number(dur)};}).filter(f=>f.dur>=0);
const process=frames.filter(f=>f.name==='ProcessFrame'),render=frames.filter(f=>f.name==='CoreManagerRender');
function stats(values){const sorted=values.slice().sort((a,b)=>a-b),sum=values.reduce((a,b)=>a+b,0),p=x=>sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*x))];return{count:values.length,meanMs:sum/values.length,p50Ms:p(.5),p90Ms:p(.9),p99Ms:p(.99),maxMs:p(1),over8ms:values.filter(x=>x>8).length,over16_67ms:values.filter(x=>x>16.67).length};}
const pairs=[];
for(let i=0;i<process.length-1;i++){const p=process[i],next=process[i+1],r=render.find(x=>x.ts>=p.ts+p.dur&&x.ts<next.ts);if(r)pairs.push({sumMs:(p.dur+r.dur)/1e6,spanMs:(r.ts+r.dur-p.ts)/1e6,cadenceMs:(next.ts-p.ts)/1e6,gapMs:(r.ts-p.ts-p.dur)/1e6});}
const report={
 trace:phase.trace,capture:'Lens Studio Preview, 10-second steady-state capture; not device or activation',
 processFrame:stats(process.map(f=>f.dur/1e6)),coreManagerRender:stats(render.map(f=>f.dur/1e6)),
 paired: {count:pairs.length,nonoverlappingInstrumentedStages:stats(pairs.map(p=>p.sumMs)),startToRenderEnd:stats(pairs.map(p=>p.spanMs)),processFrameStartCadence:stats(pairs.map(p=>p.cadenceMs)),betweenStageGap:stats(pairs.map(p=>p.gapMs))},
 interpretation:{target8ms:'Not met: ProcessFrame alone averages 10.71ms; paired nonoverlapping processing plus rendering costs more.',
 primary:'Confirmed inclusive Track stage: 9.13ms mean, 85.3% of ProcessFrame. Exposed FaceDetectPreprocess and FaceTrack children explain only ~0.54ms/frame; most tracking time is not attributed to children.',
 secondary:'CoreManagerRender 5.24ms mean, including Scene::Update 2.56ms. No per-script child instrumentation is available.',
 rendering:'RenderFrame 0.75ms mean; DrawCallNum peaks at 30. CPU drawing/shader work is not the dominant recorded cost.',
 limits:'Durations are wall-clock spans, not CPU scheduled time. sched is empty; no GPU timing. Cannot prove active CPU cost, resource starvation, exact script cost, or root cause of 25s MCP response delays. Preview profile only.',
 analyzerCaveat:'Ignore Phase1 FPS1305.9, mobile profile,33.3ms budget, and pooled790-slice percentiles. These are incorrect heuristics for this Preview trace.',
 next:'Compare matched Preview captures with tracking demand reduced safely; measure one controlled change. Do not remove SIK hand tracking blindly.'}
};
writeFileSync('Tooling/results/performance/run7-s2-summary.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
