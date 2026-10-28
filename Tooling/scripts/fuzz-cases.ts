import {performance} from "node:perf_hooks";
import {pathToFileURL} from "node:url";
import {resolve} from "node:path";
import {compileCase} from "../../Assets/Scripts/Engine/case/CaseCompiler";
import {getPitch} from "../../Assets/Scripts/Content/PitchLibrary";
import {getRoomFixture,ROOM_FIXTURE_NAMES} from "../../Assets/Scripts/Engine/room/RoomFixtures";
export interface CaseFuzzReport {seedsPerFixture:number;total:number;accepted:number;acceptance:number;fixtures:Record<string,{accepted:number;total:number}>;maxAttempts:number;maxMs:number;p95Ms:number;over300ms:number;distinctEnvelopes:number;failures:{seed:number;fixture:string;codes:string[]}[];livePitchAcceptance:"not_measured";}
/** Acceptance is measured independently on every fixture; no live model/network result is inferred. */
function* caseRuns(seedsPerFixture:number):Generator<void,CaseFuzzReport,unknown> {
  if(!Number.isSafeInteger(seedsPerFixture)||seedsPerFixture<1)throw new Error("Invalid seed count");
  const report:CaseFuzzReport={seedsPerFixture,total:0,accepted:0,acceptance:0,fixtures:{},maxAttempts:0,maxMs:0,p95Ms:0,over300ms:0,distinctEnvelopes:0,failures:[],livePitchAcceptance:"not_measured"};
  const timings:number[]=[],envelopes=new Set<string>();
  for(const fixture of ROOM_FIXTURE_NAMES) {
    const room=getRoomFixture(fixture);report.fixtures[fixture]={accepted:0,total:seedsPerFixture};
    for(let seed=0;seed<seedsPerFixture;seed++) {
      const start=performance.now();const result=compileCase(seed,room,getPitch(seed));const elapsed=performance.now()-start;
      timings.push(elapsed);report.maxMs=Math.max(report.maxMs,elapsed);if(elapsed>300)report.over300ms++;
      report.total++;report.maxAttempts=Math.max(report.maxAttempts,result.attempts);
      if(result.ok) {
        report.accepted++;report.fixtures[fixture].accepted++;envelopes.add(fixture+":"+JSON.stringify(result.graph!.envelope));
        if(!result.graph!.solver!.ok||result.graph!.solver!.minRouteMinutes>result.graph!.clockMinutes*0.6)throw new Error("Compiler admitted an unproven case");
        if(result.timeline!.length!==60)throw new Error("Incomplete simulated timeline");
      } else report.failures.push({seed,fixture,codes:result.errors.map(e=>e.code).concat(result.solverIssues.map(e=>e.code))});
      yield;
    }
  }
  timings.sort((a,b)=>a-b);report.p95Ms=timings[Math.min(timings.length-1,Math.floor(timings.length*.95))];
  report.acceptance=report.accepted/report.total;report.distinctEnvelopes=envelopes.size;
  return report;
}
export function fuzzCases(seedsPerFixture=1000):CaseFuzzReport {
  const runs=caseRuns(seedsPerFixture);
  for(;;){const next=runs.next();if(next.done)return next.value;}
}
/** Yield only between completed cases; seeded inputs and compiler execution remain unchanged. */
export async function fuzzCasesAsync(seedsPerFixture=1000,batchSize=25):Promise<CaseFuzzReport> {
  if(!Number.isSafeInteger(batchSize)||batchSize<1)throw new Error("Invalid batch size");
  const runs=caseRuns(seedsPerFixture);let completed=0;
  for(;;) {
    const next=runs.next();if(next.done)return next.value;
    if(++completed%batchSize===0)await new Promise<void>(done=>setImmediate(done));
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  void fuzzCasesAsync(process.argv[2]===undefined?1000:Number(process.argv[2])).then(report=>{
    console.log(JSON.stringify(report,null,2));if(Object.values(report.fixtures).some(f=>f.accepted/f.total<.9))process.exitCode=1;
  }).catch(error=>{console.error(error);process.exitCode=1;});
}
