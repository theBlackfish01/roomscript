/** Preserve explicit current-cast A2 evidence, excluding credentials and unrelated logs. */
import {readFileSync,writeFileSync} from "node:fs";
import {createHeroCase} from "../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {replayGame} from "../../Assets/Scripts/Engine/game/Reducer";
const evidence:string[]=[];let tape:unknown;
for(const path of process.argv.slice(2))for(const line of readFileSync(path,"utf8").split(/\r?\n/)){
  const at=line.indexOf("[Preview 1] ");if(at<0)continue;const text=line.slice(at+12);
  if(/(?:PASSED|FAILED|BUNDLED_VOICE_CHECK\||HERO_DEMO_CHECK\|)/.test(text))evidence.push(text);
  const marker="HERO_DEMO_ACTION_TAPE|",index=text.indexOf(marker);
  if(index>=0){const log=JSON.parse(text.slice(index+marker.length)),state=replayGame(createHeroCase(),log);if(state.verdict!=="correct"||state.arguments.length!==4||state.suspects.S2.layer!==2)throw new Error("Hero replay incomplete");tape={provenance:"Run 7 A2 strict Preview hero, Vale S2-1 replacement compressed library. Current-cast baseline, before Run 7 feature changes; not final integrated acceptance.",log,verdict:state.verdict,deductions:state.arguments.length};}
}
if(!tape)throw new Error("No verified hero tape found");
writeFileSync("Tooling/results/run7-a2-verification.log",evidence.join("\n")+"\n");
writeFileSync("Tooling/results/run7-a2-hero.json",JSON.stringify(tape,null,2)+"\n");
console.log(JSON.stringify({evidenceLines:evidence.length,replayVerified:true}));
