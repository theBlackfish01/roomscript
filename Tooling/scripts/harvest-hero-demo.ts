/** Import the actual offline Preview action log as a credential-free golden demo. */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {createHeroCase} from "../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {replayGame} from "../../Assets/Scripts/Engine/game/Reducer";
import {scoreCase} from "../../Assets/Scripts/Engine/game/Scoring";
import {canonicalJson} from "../../Assets/Scripts/Engine/core/CanonicalJson";
import {hashHex} from "../../Assets/Scripts/Engine/core/Hash";
const source=process.argv[2];if(!source)throw new Error("Pass the Lens log path");
const marker="HERO_DEMO_ACTION_TAPE|",line=readFileSync(source,"utf8").split(/\r?\n/).filter(l=>l.includes(marker)).at(-1);if(!line)throw new Error("No completed hero demo tape");
const log=JSON.parse(line.slice(line.indexOf(marker)+marker.length)),graph=createHeroCase(),state=replayGame(graph,log);
if(state.verdict!=="correct"||state.arguments.length!==4||state.suspects.S2.layer!==2)throw new Error("Incomplete hero run");
const output={version:1,provenance:"Authored performances captured from an offline Preview LEAF run; not generated model output",caseId:graph.caseId,log,expected:{stateHash:hashHex(canonicalJson(state)),score:scoreCase(graph,state)}};
const json=JSON.stringify(output,null,2);if(/\bsk-[A-Za-z0-9_-]{20,}|\bAIza[0-9A-Za-z_-]{35}/.test(json))throw new Error("SECRET_OUTPUT_BLOCKED");
writeFileSync(resolve("../Assets/Scripts/Content/Tapes/HeroDemo.ts"),'/** Golden action log from the complete offline hero Preview tour. */\nimport {Action} from "../../Engine/core/Types";\nexport const heroDemo = '+json.replace('"log": [','"log": [')+';\nexport const heroActions = heroDemo.log as Action[];\n');
console.log({caseId:output.caseId,actions:log.length,expected:output.expected});
