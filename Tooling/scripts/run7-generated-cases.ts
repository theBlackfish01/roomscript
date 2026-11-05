import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {prepareDynamicCase} from "../../Assets/Scripts/Content/DynamicCase";
import {createHeroCase} from "../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {minimumCostRoute,solvePlayerKnowledge} from "../../Assets/Scripts/Engine/case/Solver";
import {replayGame} from "../../Assets/Scripts/Engine/game/Reducer";
import {hashHex} from "../../Assets/Scripts/Engine/core/Hash";
import {TerminalPlayer} from "./play";

const roomAt=process.argv.indexOf("--room"),seedAt=process.argv.indexOf("--seeds");
const room=roomAt>=0?JSON.parse(readFileSync(process.argv[roomAt+1],"utf8")):createHeroCase().room;
const seeds=seedAt>=0?process.argv[seedAt+1].split(",").map(Number):[7,1041,2026];
const outputAt=process.argv.indexOf("--out"),output=outputAt>=0?process.argv[outputAt+1]:"results/run7-generated-cases.json";
const runs=seeds.map(seed=>{
  const result=prepareDynamicCase(seed,room);if(!result.ok)throw new Error("Compilation rejected seed "+seed+": "+JSON.stringify(result));
  const graph=result.graph!,player=new TerminalPlayer(graph),commands:string[]=[],transcript:string[]=[];
  const run=(command:string)=>{commands.push(command);transcript.push(...player.execute(command).lines);};
  for(const ref of minimumCostRoute(graph).refs) {
    const evidence=graph.evidence.find(e=>e.id===ref),statement=graph.statements.find(s=>s.id===ref);
    if(evidence)run("pinch "+evidence.holder);else if(statement)run("chip "+statement.speaker+" "+statement.topic);
  }
  const solutions=solvePlayerKnowledge(graph,player.state.knowledge).hypotheses;
  if(solutions.length!==1||player.state.verdict)throw new Error("Unsolved route for seed "+seed);
  const h=solutions[0];run(`accuse ${h.who} ${h.where} ${h.what}`);
  const replay=replayGame(graph,player.state.log),exact=JSON.stringify(replay)===JSON.stringify(player.state);
  if(player.state.verdict!=="correct"||!exact)throw new Error("Verdict/replay failed for seed "+seed);
  return {seed,caseId:graph.caseId,roomId:graph.room.roomId,verdict:player.state.verdict,minutes:player.state.elapsedMinutes,
    attempts:result.compilation!.attempts,physicalObjects:graph.room.objects.filter(o=>!o.virtual).length,virtualObjects:graph.room.objects.filter(o=>o.virtual).length,
    replayExact:exact,stateHash:hashHex(JSON.stringify(player.state)),commands,transcript,log:player.state.log};
});
mkdirSync("results",{recursive:true});
const out={provenance:roomAt>=0?"Supplied room input; terminal validation only":"Authored hero-room anchors; not a scan, not Lens/LEAF evidence",runs};
writeFileSync(output,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(runs.map(({seed,caseId,verdict,minutes,replayExact,physicalObjects,virtualObjects})=>({seed,caseId,verdict,minutes,replayExact,physicalObjects,virtualObjects})),null,2));
