/** Exact-graph action tapes. Never infer current geometry from a historical factory. */
import {readFileSync,writeFileSync,existsSync,realpathSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {Action,CaseGraph,GameState} from "../../Assets/Scripts/Engine/core/Types";
import {verifyCase} from "../../Assets/Scripts/Engine/case/Solver";
import {replayGame} from "../../Assets/Scripts/Engine/game/Reducer";
import {scoreCase} from "../../Assets/Scripts/Engine/game/Scoring";
import {canonicalJson} from "../../Assets/Scripts/Engine/core/CanonicalJson";
import {hashHex} from "../../Assets/Scripts/Engine/core/Hash";

export interface CaseActionTape {
  version:2;provenance:string;caseId:string;seal:string;graphHash:string;graph:CaseGraph;log:Action[];
  expected:{stateHash:string;verdict:GameState["verdict"];score:ReturnType<typeof scoreCase>};
}
const hash=(value:unknown)=>hashHex(canonicalJson(value));
const secretText=/(?:Bearer[ ]|-----BEGIN (?:[A-Z ]*PRIVATE KEY|CERTIFICATE)-----|\bsk-[A-Za-z0-9_-]{12,}|\bAIza[A-Za-z0-9_-]{20,}|\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,})/i;
const secretKey=/^(?:api[_-]?key|snapToken|openAIToken|googleToken|authorization|password|private[_-]?key|access[_-]?token|refresh[_-]?token)$/i;
function safe(value:unknown,depth=0):void {
  if(depth>40)throw new Error("Case tape is too deeply nested");
  if(typeof value==="string"){
    if(secretText.test(value))throw new Error("SECRET_OUTPUT_BLOCKED");
    if(/^[\[{]/.test(value.trim())){let inner:unknown;try{inner=JSON.parse(value);}catch{return;}safe(inner,depth+1);}
  }else if(Array.isArray(value))value.forEach(v=>safe(v,depth+1));
  else if(value&&typeof value==="object")for(const [key,child]of Object.entries(value)){if(secretKey.test(key))throw new Error("SECRET_OUTPUT_BLOCKED");safe(child,depth+1);}
}
export function captureCaseTape(graph:CaseGraph,log:Action[],provenance:string):CaseActionTape {
  safe({graph,log,provenance});
  if(!graph||graph.schema!==1||!graph.caseId||!Array.isArray(log)||!log.length||!log.every((a,i)=>a&&a.seq===i+1))throw new Error("Invalid graph or non-contiguous action log");
  const report=verifyCase(graph);if(!report.ok)throw new Error("Captured case failed solver verification");
  const frozen=JSON.parse(canonicalJson(graph)) as CaseGraph,actions=JSON.parse(canonicalJson(log)) as Action[],state=replayGame(frozen,actions);
  if(!state.verdict)throw new Error("Case tape has no completed verdict");
  return {version:2,provenance,caseId:frozen.caseId,seal:frozen.pitchHash,graphHash:hash(frozen),graph:frozen,log:actions,
    expected:{stateHash:hash(state),verdict:state.verdict,score:scoreCase(frozen,state)}};
}
export function replayCaseTape(tape:CaseActionTape):GameState {
  safe(tape);
  if(tape.version!==2||tape.caseId!==tape.graph.caseId||tape.seal!==tape.graph.pitchHash||tape.graphHash!==hash(tape.graph))throw new Error("Case tape identity or captured graph changed");
  const checked=captureCaseTape(tape.graph,tape.log,tape.provenance);
  if(canonicalJson(checked.expected)!==canonicalJson(tape.expected))throw new Error("Case tape replay does not match captured expectations");
  return replayGame(tape.graph,tape.log);
}

/** Handles raw Lens lines and JSON MCP envelopes. Old graphless tapes require an
 * explicitly supplied captured graph; no default factory or guessed layout.
 */
export function harvestCaseTapeText(source:string,explicitGraph?:CaseGraph):CaseActionTape[] {
  if(source.length>32*1024*1024)throw new Error("Select a capture batch below 32 MiB with --from-byte");
  const records:CaseActionTape[]=[];let pendingGraph:CaseGraph|undefined;
  const add=(graph:CaseGraph|undefined,log:Action[],kind:string)=>{
    if(!graph)throw new Error("Capture has no exact graph: emit HERO_DEMO_GRAPH before its action tape, or pass --graph explicitly");
    const tape=captureCaseTape(graph,log,"Preview LEAF "+kind+" action log with its captured case graph; not a continuous player video");
    if(!records.some(r=>r.graphHash===tape.graphHash&&r.expected.stateHash===tape.expected.stateHash))records.push(tape);
  };
  const lines=(value:string)=>{for(const line of value.split(/\r?\n/)){
    const markers=["HERO_DEMO_GRAPH|","HERO_DEMO_ACTION_TAPE|","GENERATED_CASE_CHECK|"];
    for(const marker of markers){const index=line.indexOf(marker);if(index<0)continue;
      const data=JSON.parse(line.slice(index+marker.length));
      if(marker==="HERO_DEMO_GRAPH|")pendingGraph=data;
      else if(marker==="HERO_DEMO_ACTION_TAPE|"){add(pendingGraph||explicitGraph,data,"hero");pendingGraph=undefined;}
      else {if(data.caseId&&data.graph&&data.caseId!==data.graph.caseId)throw new Error("Generated case/graph identity mismatch");add(data.graph||explicitGraph,data.log,"generated "+(data.source||"unspecified")+" seed "+data.seed);}
    }
  }};
  const visit=(value:unknown,depth=0):void=>{
    if(depth>24)throw new Error("Capture envelope too deeply nested");
    if(typeof value==="string"){
      if(/^[\[{]/.test(value.trim())){let parsed:unknown;try{parsed=JSON.parse(value);}catch{lines(value);return;}visit(parsed,depth+1);}else lines(value);
    }else if(Array.isArray(value))value.forEach(child=>visit(child,depth+1));
    else if(value&&typeof value==="object")Object.values(value).forEach(child=>visit(child,depth+1));
  };
  visit(source);return records;
}

export function main(args:string[]):void {
  if(args.length<2)throw new Error("Usage: tsx scripts/harvest-case-tape.ts <capture.log> <new-results-name.json> [--graph captured-graph.json] [--from-byte N]");
  let graph:CaseGraph|undefined,fromByte=0;
  for(let i=2;i<args.length;i+=2){if(args[i]==="--graph"&&args[i+1])graph=JSON.parse(readFileSync(resolve(args[i+1]),"utf8"));
    else if(args[i]==="--from-byte"&&args[i+1])fromByte=Number(args[i+1]);else throw new Error("Unknown or incomplete option");}
  if(!Number.isSafeInteger(fromByte)||fromByte<0)throw new Error("Invalid --from-byte");
  const results=resolve(dirname(fileURLToPath(import.meta.url)),"../results"),output=resolve(results,args[1]);
  if(dirname(output)!==results||!/^[-a-zA-Z0-9_]+\.json$/.test(args[1])||realpathSync(results).toLowerCase()!==results.toLowerCase())throw new Error("Output must be a new JSON filename directly inside Tooling/results");
  if(existsSync(output))throw new Error("Refusing to overwrite existing tape; choose a new filename");
  const records=harvestCaseTapeText(readFileSync(resolve(args[0])).subarray(fromByte).toString("utf8"),graph);
  if(records.length!==1)throw new Error("Expected one completed case capture; use --from-byte to select one run");
  replayCaseTape(records[0]);writeFileSync(output,JSON.stringify(records[0],null,2)+"\n",{flag:"wx"});
  console.log(JSON.stringify({path:output,caseId:records[0].caseId,graphHash:records[0].graphHash,actions:records[0].log.length,verdict:records[0].expected.verdict}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{main(process.argv.slice(2));}catch(error){console.error(error instanceof Error?error.message:"Case tape harvest failed");process.exitCode=1;}}
