/** Reproducible authored fallback if a Preview capture is unavailable. No model or network. */
import {mkdirSync,writeFileSync} from "node:fs";
import {runDemo,HERO_DEMO_COMMANDS} from "../scripts/play";
import {scoreCase} from "../../Assets/Scripts/Engine/game/Scoring";
import {canonicalJson} from "../../Assets/Scripts/Engine/core/CanonicalJson";
import {hashHex} from "../../Assets/Scripts/Engine/core/Hash";
const {player,lines}=runDemo();
if(player.state.verdict!=="correct"||player.state.arguments.length!==4||lines.some(l=>l.startsWith("REJECTED")))throw new Error("Authored demo failed");
const data={version:1,provenance:"Authored deterministic terminal route; not a Preview capture or generated model output",caseId:player.graph.caseId,seal:player.graph.pitchHash,commands:HERO_DEMO_COMMANDS,log:player.state.log,expected:{stateHash:hashHex(canonicalJson(player.state)),score:scoreCase(player.graph,player.state)}};
mkdirSync("results",{recursive:true});writeFileSync("results/run4-b-hero-v3.json",JSON.stringify(data,null,2));console.log(data.expected);
