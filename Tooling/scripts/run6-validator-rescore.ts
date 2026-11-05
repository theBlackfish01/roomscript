/** Zero-network replay of the saved, already judged corpora. Never reads .env. */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {createHeroCase} from "../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../Assets/Scripts/Engine/game/GameState";
import {buildFactSheet} from "../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {validateLine} from "../../Assets/Scripts/Engine/perf/LineValidator";
const tooling=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const specs=[['S2',0,'where@22:30'],['S2',1,'where@22:30'],['S2',0,'baseline:brooch'],['S1',0,'where@22:30'],['S3',0,'about:V'],['S4',0,'motive:S2'],['S1',0,'baseline:name'],['S3',0,'baseline:glasses']] as const;
const graph=createHeroCase();
const contexts=specs.map(([suspect,layer,topic])=>{const state=createGameState(graph);state.suspects[suspect].layer=layer;const sheet=buildFactSheet(graph,state,suspect);return {sheet,canonical:sheet.account.find(r=>r.ref===sheet.topicToRef[topic])!.text};});
const results=['validator-redteam-2026-10-30.json','validator-redteam-2026-10-30-holdout.json'].map(source=>{
  const sourceText=readFileSync(resolve(tooling,'results',source),'utf8'),sourceSha256=createHash('sha256').update(sourceText).digest('hex');
  const original=JSON.parse(sourceText);
  const samples=original.samples.map((s:any)=>{const result=validateLine(s.answer,contexts[s.context].sheet,graph);return {id:s.id,context:s.context,kind:s.kind,allowed:s.judge?.allowed,line:s.answer.line,accepted:result.ok,errors:result.errors};});
  const attacks=samples.filter((s:any)=>s.kind==='adversarial'&&s.allowed===false),natural=samples.filter((s:any)=>s.kind==='natural'&&s.allowed===true);
  const bypasses=attacks.filter((s:any)=>s.accepted).length,falseRejections=natural.filter((s:any)=>!s.accepted).length;
  const allDisallowed=samples.filter((s:any)=>s.allowed===false),allDisallowedAccepted=allDisallowed.filter((s:any)=>s.accepted).length;
  return {source,sourceSha256,attacks:attacks.length,bypasses,allDisallowed:allDisallowed.length,allDisallowedAccepted,natural:natural.length,falseRejections,falseRejectionRate:falseRejections/natural.length,samples};
});
const label=process.argv.includes('--baseline')?'baseline':'candidate';
writeFileSync(resolve(tooling,`results/run6-validator-${label}.json`),JSON.stringify({apiCostUSD:0,contexts:contexts.map(c=>c.canonical),results},null,2)+'\n');
console.log(JSON.stringify(results.map(({samples,...summary})=>summary)));
if(results.some(r=>r.allDisallowedAccepted>0))process.exitCode=1;
if(process.argv.includes('--details'))for(const r of results){console.log(r.source);for(const s of r.samples.filter((s:any)=>s.kind==='natural'&&s.allowed&&!s.accepted))console.log(JSON.stringify(s));}
