import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptCastController} from "./RoomscriptCastController";
import {RoomscriptSpatialObjectionController} from "./RoomscriptSpatialObjectionController";

/** Visible identities, UI selection, voice routing, and crate-local card regression. */
@component export class RoomscriptCastLeafScenario extends Scenario {
  async run():Promise<void> {
    await sleep(2000);const cast=findSceneObjectByName("RoomscriptCast").getComponent(RoomscriptCastController.getTypeName()) as RoomscriptCastController;
    const flow=cast.flow,hand=new DefaultLeafInteractor();flow.client.forceOffline=true;
    try {
      expect(cast.actors().length).toBe(4);const roots=cast.actors().map(a=>a.getSceneObject().uniqueIdentifier);expect(new Set(roots).size).toBe(4);
      for(const id of ["S1","S3","S4","S2"]){const button=findInteractablesByName("Select "+id,undefined,true)[0];expect(!!button).toBe(true);await hand.trigger(button);await sleep(100);
        expect(flow.actor.suspect).toBe(id);expect(flow.tts.actor.suspect).toBe(id);expect(flow.actor.getSceneObject().enabled).toBe(true);
        expect(!!flow.actor.getSceneObject().getComponent("Component.RenderMeshVisual")).toBe(true);
        await flow.askChip("baseline:name");expect(flow.engine.snapshot().activeSuspect).toBe(id);
        expect(flow.actor.voice()).toBe(flow.engine.caseGraph().cast.suspects.find(s=>s.id===id)!.voice);
      }
      for(const name of ["RoomscriptChipBarUI","RoomscriptVerbBarUI","RoomscriptEvidenceWalletUI","RoomscriptSubtitleUI","RoomscriptObjection"])expect(findSceneObjectByName(name).getParent().name).toBe("RoomscriptCrate");
      const objection=findSceneObjectByName("RoomscriptObjection").getComponent(RoomscriptSpatialObjectionController.getTypeName()) as RoomscriptSpatialObjectionController;
      expect(objection.diagnostics().shatterEnabled).toBe(false);
      console.log("CAST_CHECK|four visible selectable identities; authored voices; crate-local cards");
    }finally{flow.cancel();flow.client.forceOffline=false;}
  }
}
