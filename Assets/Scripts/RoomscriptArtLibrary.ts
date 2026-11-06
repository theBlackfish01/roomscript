import {CaseGraph,GameState} from "./Engine/core/Types";
import {isHarlowPreset} from "./Engine/game/NarrativeAudio";
function authoredCard(id:string):Texture|null {
  switch(id){
    case "E_CABLE":return requireAsset("../Art/Cards/Card_E_CABLE.png") as Texture;
    case "E_CLOCK_FOUND":return requireAsset("../Art/Cards/Card_E_CLOCK_FOUND.png") as Texture;
    case "E_KETTLE_COLD":return requireAsset("../Art/Cards/Card_E_KETTLE_COLD.png") as Texture;
    case "E_LETTER":return requireAsset("../Art/Cards/Card_E_LETTER.png") as Texture;
    case "E_O2_LOCATION":return requireAsset("../Art/Cards/Card_E_O2_LOCATION.png") as Texture;
    case "E_O3_LOCATION":return requireAsset("../Art/Cards/Card_E_O3_LOCATION.png") as Texture;
    case "E_O4_LOCATION":return requireAsset("../Art/Cards/Card_E_O4_LOCATION.png") as Texture;
    case "E_O5_LOCATION":return requireAsset("../Art/Cards/Card_E_O5_LOCATION.png") as Texture;
    case "E_RECORDING":return requireAsset("../Art/Cards/Card_E_RECORDING.png") as Texture;
    case "E_S1_ALIBI":return requireAsset("../Art/Cards/Card_E_S1_ALIBI.png") as Texture;
    case "E_S1_BASELINE":return requireAsset("../Art/Cards/Card_E_S1_BASELINE.png") as Texture;
    case "E_S2_BASELINE_MUG":return requireAsset("../Art/Cards/Card_E_S2_BASELINE_MUG.png") as Texture;
    case "E_S2_BASELINE":return requireAsset("../Art/Cards/Card_E_S2_BASELINE.png") as Texture;
    case "E_S3_ALIBI":return requireAsset("../Art/Cards/Card_E_S3_ALIBI.png") as Texture;
    case "E_S3_BASELINE":return requireAsset("../Art/Cards/Card_E_S3_BASELINE.png") as Texture;
    case "E_S4_ALIBI":return requireAsset("../Art/Cards/Card_E_S4_ALIBI.png") as Texture;
    case "E_S4_BASELINE":return requireAsset("../Art/Cards/Card_E_S4_BASELINE.png") as Texture;
    case "E_TRUST_NOTE":return requireAsset("../Art/Cards/Card_E_TRUST_NOTE.png") as Texture;
    case "E_UV_DRAG":return requireAsset("../Art/Cards/Card_E_UV_DRAG.png") as Texture;
    case "E_VALE_LAMP":return requireAsset("../Art/Cards/Card_E_VALE_LAMP.png") as Texture;
    case "E_VICTIM_LAMP":return requireAsset("../Art/Cards/Card_E_VICTIM_LAMP.png") as Texture;
    case "E_VICTIM_MUG":return requireAsset("../Art/Cards/Card_E_VICTIM_MUG.png") as Texture;
    case "E_VOICEMAIL":return requireAsset("../Art/Cards/Card_E_VOICEMAIL.png") as Texture;
    default:return null;
  }
}
/** Caller displays only this admitted card; Dynamic never receives baked Harlow facts. */
export function admittedCard(graph:CaseGraph,state:GameState,id:string):{title:string;caption:string;texture:Texture;authored:boolean}|null {
  if(!state.knowledge.evidenceIds.includes(id))return null;
  const evidence=graph.evidence.find(entry=>entry.id===id);if(!evidence)return null;
  const holder=graph.room.objects.find(object=>object.id===evidence.holder);
  const specific=isHarlowPreset(graph)?authoredCard(id):null;
  return {title:(holder?.label||"Filed memory").split(/\s+/).slice(0,3).join(" "),caption:evidence.canonical,
    texture:specific||(requireAsset("../Art/Run7/MemoryPhoto.png") as Texture),authored:!!specific};
}
