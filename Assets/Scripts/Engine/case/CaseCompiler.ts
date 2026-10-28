import {CaseGraph,RoomScan,SolverIssue} from "../core/Types";
import {CasePitch} from "./CasePitchSchema";
import {PitchIssue,validatePitch} from "./PitchValidator";
import {culpritForSeed,simulateCase,TimelineEntry} from "./Simulator";
import {dealEvidence} from "./Dealer";
import {buildStatements} from "./StatementBuilder";
import {planBeats} from "./BeatPlanner";
import {verifyCase} from "./Solver";
import {planRepairs,RepairPlan} from "./RepairPlanner";
export interface CompileTrace {stage:"pitch"|"bind"|"simulate"|"solver"|"accepted"|"repair";attempt:number;ok:boolean;details:string;}
export interface CompileResult {ok:boolean;graph?:CaseGraph;attempts:number;trace:CompileTrace[];errors:PitchIssue[];solverIssues:SolverIssue[];repair:RepairPlan;bindings?:Record<string,string>;timeline?:TimelineEntry[];}
export interface CompileOptions {maxAttempts?:number;}
/** Pure deterministic compiler. Model-provided narrative cannot select or overwrite the envelope. */
export function compileCase(seed:number,room:RoomScan,input:unknown,options:CompileOptions={}):CompileResult {
  const trace:CompileTrace[]=[];
  const fail=(errors:PitchIssue[],solverIssues:SolverIssue[],attempts:number):CompileResult=>({ok:false,attempts,trace,errors,solverIssues,repair:planRepairs(errors,solverIssues)});
  if(!Number.isSafeInteger(seed))return fail([{path:"",code:"SEED",why:"Seed must be a safe integer."}],[],0);
  if(options.maxAttempts!==undefined&&(!Number.isInteger(options.maxAttempts)||options.maxAttempts<1||options.maxAttempts>50))return fail([{path:"",code:"ATTEMPT_LIMIT",why:"Attempt limit must be between one and fifty."}],[],0);
  const validation=validatePitch(input,culpritForSeed(seed));
  trace.push({stage:"pitch",attempt:0,ok:validation.ok,details:validation.ok?"Pitch schema and narrative constraints accepted.":"Pitch needs constrained repair."});
  if(!validation.ok)return fail(validation.errors,[],0);
  const pitch=validation.pitch as CasePitch;let last:SolverIssue[]=[];
  for(let attempt=0;attempt<(options.maxAttempts??50);attempt++) {
    try {
      const simulation=simulateCase(seed,room,pitch,attempt);
      trace.push({stage:"bind",attempt:attempt+1,ok:true,details:Object.keys(simulation.bindings).length+" roles bound to physical or explicit virtual objects."});
      trace.push({stage:"simulate",attempt:attempt+1,ok:true,details:simulation.timeline.length+" actor-slot observations generated."});
      dealEvidence(simulation);buildStatements(simulation,pitch);planBeats(simulation,pitch);
      const report=verifyCase(simulation.graph);last=report.issues;
      trace.push({stage:"solver",attempt:attempt+1,ok:report.ok,details:report.ok?"All eight proof checks passed.":report.issues.map(i=>i.code).join(",")});
      if(report.ok) {
        simulation.graph.solver=report;trace.push({stage:"accepted",attempt:attempt+1,ok:true,details:"Sealed deterministic case accepted."});
        return {ok:true,graph:simulation.graph,attempts:attempt+1,trace,errors:[],solverIssues:[],repair:planRepairs([]),bindings:simulation.bindings,timeline:simulation.timeline};
      }
    } catch(error) {
      trace.push({stage:"bind",attempt:attempt+1,ok:false,details:error instanceof Error?error.message:String(error)});
      // Invalid physical inputs cannot be repaired by repeatedly sampling the same invalid room.
      return fail([{path:"/room",code:"ROOM_BINDING",why:trace[trace.length-1].details}],[],attempt+1);
    }
  }
  trace.push({stage:"repair",attempt:options.maxAttempts??50,ok:false,details:"Deterministic timeline samples exhausted; request bounded pitch repair."});
  return fail([],last,options.maxAttempts??50);
}
export const CaseCompiler={compile:compileCase};
