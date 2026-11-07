import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {sleep,findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptRun10LeafDriver} from "./RoomscriptRun10LeafDriver";
/** Four persistent identities and their production row/voice routing. */
@component export class RoomscriptCastLeafScenario extends Scenario {
 async run():Promise<void>{await sleep(700);const d=new RoomscriptRun10LeafDriver(),old=d.flow.client.forceOffline,muted=d.audio.speechMuted();d.flow.client.forceOffline=true;d.audio.silence(true);
  try{await d.open();const actors=d.opening.cast.actors();expect(actors.length).toBe(4);expect(new Set(actors.map(a=>a.getSceneObject().uniqueIdentifier)).size).toBe(4);
   for(const id of ["S1","S3","S4","S2"]){await d.ask(id);expect(d.flow.actor.suspect).toBe(id);expect(d.flow.tts.actor.suspect).toBe(id);expect(d.flow.actor.getSceneObject().enabled).toBe(true);expect(d.flow.actor.voice()).toBe(d.engine.graphRef().cast.suspects.find(s=>s.id===id)!.voice);expect(d.flow.row.diagnostics().visible).toBe(true);}
   for(const name of ["RoomscriptCrate","RoomscriptChipBarUI","RoomscriptVerbBarUI","RoomscriptEvidenceWalletUI","RoomscriptObjection"])expect(!!findSceneObjectByName(name)).toBe(false);
   console.log("CAST_CHECK|four identities,authored voices,single row,no retired scene nodes");
  }finally{d.flow.client.forceOffline=old;d.audio.silence(muted);}
 }
}
