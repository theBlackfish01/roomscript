/** Preserve only explicit scenario evidence and a replay-checked earlier-cast tape. */
import {readFileSync,writeFileSync} from "node:fs";
import {createHeroCase} from "../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {replayGame} from "../../Assets/Scripts/Engine/game/Reducer";
const paths=process.argv.slice(2);if(!paths.length)throw new Error("Pass log file paths");
const evidence:string[]=[];let tape:unknown;
for(const path of paths){for(const line of readFileSync(path,"utf8").split(/\r?\n/)){
  const at=line.indexOf("[Preview 1] ");if(at<0)continue;
  const text=line.slice(at+12);
  if(/(?:PASSED:|FAILED:|BUNDLED_VOICE_CHECK\||POLISH_(?:CACHE|AUDIO|FRAME_PROBE)\||HERO_DEMO_CHECK\|)/.test(text))evidence.push(text);
  const marker="HERO_DEMO_ACTION_TAPE|",index=text.indexOf(marker);
  if(index>=0){const log=JSON.parse(text.slice(index+marker.length)),state=replayGame(createHeroCase(),log);if(state.verdict!=="correct"||state.arguments.length!==4||state.suspects.S2.layer!==2)throw new Error("Hero replay incomplete");tape={provenance:"Run 6 strict Preview hero pass BEFORE Vale voice replacement. Bundled audio; not final-gate evidence.",log,verdict:state.verdict,deductions:state.arguments.length};}
}}
writeFileSync("Tooling/results/run6-lens-verification.log",evidence.join("\n")+"\n");
if(tape)writeFileSync("Tooling/results/run6-hero-earlier-cast.json",JSON.stringify(tape,null,2)+"\n");
console.log(JSON.stringify({evidenceLines:evidence.length,replayVerified:!!tape}));
