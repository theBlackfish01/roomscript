import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {admittedCard} from "./RoomscriptArtLibrary";
import {walletEntries} from "./Engine/game/SpatialObjection";
import {EVENING_ROOM_SCAN} from "./Content/EveningRoomScan";
/** Regression: unknown art stays hidden; same-state wallet refresh preserves expanded reading. */
@component export class RoomscriptMemoryCardLeafScenario extends Scenario {
  async run():Promise<void>{
    await sleep(400);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const engine=opening.cast.flow.engine,objection=opening.clue.objection,hand=new DefaultLeafInteractor();engine.configurePreset();opening.finish();await sleep(300);
    const tap=async(name:string)=>{const matches=findInteractablesByName(name,undefined,true);expect(matches.length).toBe(1);await hand.trigger(matches[0]);await sleep(200);};
    expect(opening.cast.room.propCount()).toBe(6);expect(admittedCard(engine.graphRef(),engine.snapshot(),"E_KETTLE_COLD")).toBe(null);
    await tap("RoomscriptObject_O11");expect((findSceneObjectByName("Toast").getChild(0).getComponent("Component.Text") as Text).text).toBe("Memory collected");expect(objection.cardDiagnostics().expanded).toBe(false);expect(opening.cast.flow.controlsBlocked).toBe(true);
    await tap("Expand memory");expect(objection.cardDiagnostics().expanded).toBe(true);expect(objection.cardDiagnostics().authored).toBe(true);
    expect(engine.snapshot().knowledge.evidenceIds.includes(objection.cardDiagnostics().id!)).toBe(true);
    await tap("Close memory");await tap("Evidence");await tap("Expand evidence");expect(objection.wallet.cardDiagnostics().expanded).toBe(true);
    objection.wallet.setEntries(walletEntries(engine.graphRef(),engine.snapshot()));expect(objection.wallet.cardDiagnostics().expanded).toBe(true);
    const generatedView={...engine.graphRef(),caseId:"generated-card-guard"};expect(admittedCard(generatedView,engine.snapshot(),"E_KETTLE_COLD")!.authored).toBe(false);
    await tap("Close evidence");console.log("MEMORY_CARD_CHECK|"+JSON.stringify({unknownHidden:true,expandedPreserved:true,dynamicBlankFrame:true,knowledge:engine.snapshot().knowledge.evidenceIds.length}));
    expect(engine.configureDynamic(7,EVENING_ROOM_SCAN).ok).toBe(true);expect(opening.cast.room.propCount()).toBe(0);engine.configurePreset();opening.finish();expect(opening.cast.room.propCount()).toBe(6);console.log("PROP_RESET_CHECK|6_preset,0_dynamic,6_restored");
  }
}
