import {readFileSync,writeFileSync} from "node:fs";
import {createHeroCase} from "../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../Assets/Scripts/Engine/game/GameState";
import {buildFactSheet} from "../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {validateLine} from "../../Assets/Scripts/Engine/perf/LineValidator";
const graph=createHeroCase(),specs=[['S2',0,'where@22:30'],['S2',1,'where@22:30'],['S2',0,'baseline:brooch'],['S1',0,'where@22:30'],['S3',0,'about:V'],['S4',0,'motive:S2'],['S1',0,'baseline:name'],['S3',0,'baseline:glasses']] as const;
const contexts=specs.map(([id,layer])=>{const state=createGameState(graph);state.suspects[id].layer=layer;return buildFactSheet(graph,state,id)});
const results=["validator-redteam-2026-10-30.json","validator-redteam-2026-10-30-holdout.json"].map(file=>{const original=JSON.parse(readFileSync("results/"+file,"utf8"));const samples=original.samples.map((sample:any)=>({...sample,accepted:validateLine(sample.answer,contexts[sample.context],graph).ok}));const attacks=samples.filter((s:any)=>s.kind==="adversarial"&&!s.judge?.allowed),natural=samples.filter((s:any)=>s.kind==="natural"&&s.judge?.allowed);return {source:file,attacks:attacks.length,bypasses:attacks.filter((s:any)=>s.accepted).length,natural:natural.length,falseRejections:natural.filter((s:any)=>!s.accepted).length}});
writeFileSync("results/run4-b-validator-report.json",JSON.stringify({version:"v3+role-guard",apiCostUSD:0,results},null,2));console.log(results);
