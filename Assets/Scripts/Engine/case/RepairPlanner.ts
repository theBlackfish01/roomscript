import {CasePitch,SuspectSlot} from "./CasePitchSchema";
import {PitchIssue,PitchValidation,validatePitch} from "./PitchValidator";
import {SolverIssue} from "../core/Types";
export interface RepairPlan {errors:PitchIssue[];maxRounds:2;}
export interface PitchPatch {op:"replace"|"add"|"remove";path:string;value?:unknown;}
export function planRepairs(errors:readonly PitchIssue[],solverIssues:readonly SolverIssue[]=[]):RepairPlan {
  return {maxRounds:2,errors:errors.map(e=>({...e})).concat(solverIssues.map(issue=>({path:"/suspects",code:issue.code,why:issue.message+(issue.subject?" ("+issue.subject+")":"")})))};
}
/** Exact-path RFC-6902 subset. Adds/removals only repair missing/unknown fields. */
export function applyPitchRepair(input:unknown,patch:unknown,plan:RepairPlan,culprit:SuspectSlot,round:number):PitchValidation {
  const fail=(why:string):PitchValidation=>({ok:false,errors:[{path:"",code:"INVALID_PATCH",why}]});
  if(!Number.isInteger(round)||round<1||round>plan.maxRounds)return fail("At most two repair rounds are permitted.");
  if(!Array.isArray(patch)||patch.length>plan.errors.length)return fail("Patch exceeds listed repair paths.");
  let output:unknown;try{output=JSON.parse(JSON.stringify(input));}catch{return fail("Pitch is not serializable.");}
  const touched=new Set<string>();
  for(const raw of patch) {
    if(!raw||typeof raw!=="object"||Array.isArray(raw))return fail("Invalid patch operation.");
    const op=raw as Record<string,unknown>;
    if(Object.keys(op).some(k=>!["op","path","value"].includes(k))||!["replace","add","remove"].includes(String(op.op))||typeof op.path!=="string"||(op.op!=="remove"&&!Object.prototype.hasOwnProperty.call(op,"value"))||touched.has(op.path))return fail("Only one exact-path operation is permitted per error.");
    const error=plan.errors.find(e=>e.path===op.path);if(!error)return fail("Patch touches an unlisted path.");
    if(op.op==="add"&&error.code!=="REQUIRED"||op.op==="remove"&&error.code!=="UNKNOWN_FIELD")return fail("Add and remove must repair structural errors.");
    if(op.op!=="remove"&&error.allowed&&!error.allowed.some(v=>JSON.stringify(v)===JSON.stringify(op.value)))return fail("Replacement is outside allowed values.");
    const segments=op.path.slice(1).split("/").map(s=>s.replace(/~1/g,"/").replace(/~0/g,"~"));
    if(!op.path.startsWith("/")||segments.some(s=>["__proto__","prototype","constructor",""].includes(s)))return fail("Unsafe JSON pointer.");
    let parent=output as Record<string,unknown>;
    for(const segment of segments.slice(0,-1)) {
      if(!parent||typeof parent!=="object"||!Object.prototype.hasOwnProperty.call(parent,segment))return fail("Patch parent does not exist.");
      parent=parent[segment] as Record<string,unknown>;
    }
    const leaf=segments[segments.length-1];
    if(!parent||typeof parent!=="object")return fail("Patch parent is not an object.");
    const exists=Object.prototype.hasOwnProperty.call(parent,leaf);
    if(op.op==="add"?exists:!exists)return fail("Patch target existence does not match operation.");
    if(op.op==="remove")delete parent[leaf];else parent[leaf]=op.value;
    touched.add(op.path);
  }
  return validatePitch(output,culprit);
}
