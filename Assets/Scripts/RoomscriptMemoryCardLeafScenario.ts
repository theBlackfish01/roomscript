import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {admittedCard} from "./RoomscriptArtLibrary";
import {walletEntries} from "./Engine/game/SpatialObjection";
import {EVENING_ROOM_SCAN} from "./Content/EveningRoomScan";
import {recordedCrateSurfaceLayout} from "./Content/CrateSurfaceLayout";
import {RoomscriptPropMesh} from "./RoomscriptPropMesh";
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate";
import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
/** Regression: unknown art stays hidden; same-state wallet refresh preserves expanded reading. */
@component export class RoomscriptMemoryCardLeafScenario extends Scenario {
  async run():Promise<void>{
    await sleep(400);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const engine=opening.cast.flow.engine,objection=opening.clue.objection,hand=new DefaultLeafInteractor();engine.configurePreset();opening.finish();await sleep(300);
    const tap=async(name:string)=>{const matches=findInteractablesByName(name,undefined,true);expect(matches.length).toBe(1);await hand.trigger(matches[0]);await sleep(200);};
    const assertCrateSurface=()=>{
      const crate=opening.crate.getSceneObject(),layout=recordedCrateSurfaceLayout(),transform=crate.getTransform(),world=transform.getWorldPosition(),scale=transform.getWorldScale(),rotation=transform.getWorldRotation();
      expect(crate.getParent().name).toBe("Roomscript");expect(scale.distance(new vec3(.75,.75,.75))<.001).toBe(true);expect(rotation.multiplyVec3(vec3.up()).distance(vec3.up())<.001).toBe(true);expect(rotation.multiplyVec3(vec3.right()).distance(vec3.right())<.001).toBe(true);
      const base=findSceneObjectByName("CrateBase",crate),mesh=base.getComponent(RoomscriptPropMesh.getTypeName()) as RoomscriptPropMesh;
      const bottom=base.getTransform().getWorldTransform().multiplyPoint(new vec3(0,-mesh.height/2,0));
      expect(Math.abs(bottom.y-layout.surfaceWorld[1])<.1).toBe(true);expect(Math.abs(world.x-layout.surfaceWorld[0])<.1).toBe(true);expect(Math.abs(world.z-layout.surfaceWorld[2])<.1).toBe(true);
      const card=findSceneObjectByName("RoomscriptOpeningCard",crate),tab=findSceneObjectByName("RoomscriptPullTab",crate);
      expect(card.getParent().isSame(crate)).toBe(true);expect(tab.getParent().isSame(crate)).toBe(true);
      const backing=card.getChild(0),plate=backing.getComponent(BackPlate.getTypeName()) as BackPlate,buttonObject=findSceneObjectByName("Pull tab",tab),button=buttonObject.getComponent(RectangleButton.getTypeName()) as RectangleButton;
      const lowest=(object:SceneObject,width:number,height:number)=>Math.min(...[-1,1].flatMap(x=>[-1,1].map(y=>object.getTransform().getWorldTransform().multiplyPoint(new vec3(x*width/2,y*height/2,0)).y)));
      const cardBottom=lowest(backing,plate.size.x,plate.size.y),tabBottom=lowest(tab,layout.pullTab.width,layout.pullTab.height),buttonBottom=lowest(buttonObject,button.size.x,button.size.y);
      expect(cardBottom>layout.surfaceWorld[1]).toBe(true);expect(tabBottom>layout.surfaceWorld[1]).toBe(true);expect(buttonBottom>layout.surfaceWorld[1]).toBe(true);expect(button.size.y).toBe(9);
      console.log("CRATE_SURFACE_CHECK|"+JSON.stringify({surface:layout.surfaceWorld,baseBottom:[bottom.x,bottom.y,bottom.z],cardBottom,tabBottom,buttonBottom}));
    };assertCrateSurface();
    expect(opening.cast.room.propCount()).toBe(6);
    const legacy=opening.cast.room.legacyPropDiagnostics();expect(legacy.replaced.length).toBe(6);expect(legacy.hidden).toBe(11);expect(legacy.visible).toBe(0);expect(legacy.anchorsEnabled).toBe(true);
    expect(opening.cast.room.objectAnchor("O4").enabled).toBe(true);expect(findSceneObjectByName("InterrogationMark").enabled).toBe(false);expect(findSceneObjectByName("RoomscriptDoorTape").enabled).toBe(false);
    console.log("PROP_LEGACY_CHECK|"+JSON.stringify(legacy));expect(admittedCard(engine.graphRef(),engine.snapshot(),"E_KETTLE_COLD")).toBe(null);
    await tap("RoomscriptObject_O11");expect((findSceneObjectByName("Toast").getChild(0).getComponent("Component.Text") as Text).text).toBe("Memory collected");expect(objection.cardDiagnostics().expanded).toBe(false);expect(opening.cast.flow.controlsBlocked).toBe(true);
    await tap("Expand memory");expect(objection.cardDiagnostics().expanded).toBe(true);expect(objection.cardDiagnostics().authored).toBe(true);
    expect(engine.snapshot().knowledge.evidenceIds.includes(objection.cardDiagnostics().id!)).toBe(true);
    await tap("Close memory");await tap("Evidence");await tap("Expand evidence");expect(objection.wallet.cardDiagnostics().expanded).toBe(true);
    objection.wallet.setEntries(walletEntries(engine.graphRef(),engine.snapshot()));expect(objection.wallet.cardDiagnostics().expanded).toBe(true);
    const generatedView={...engine.graphRef(),caseId:"generated-card-guard"};expect(admittedCard(generatedView,engine.snapshot(),"E_KETTLE_COLD")!.authored).toBe(false);
    await tap("Close evidence");console.log("MEMORY_CARD_CHECK|"+JSON.stringify({unknownHidden:true,expandedPreserved:true,dynamicBlankFrame:true,knowledge:engine.snapshot().knowledge.evidenceIds.length}));
    expect(engine.configureDynamic(7,EVENING_ROOM_SCAN).ok).toBe(true);expect(opening.cast.room.propCount()).toBe(0);engine.configurePreset();opening.finish();expect(opening.cast.room.propCount()).toBe(6);expect(opening.cast.room.legacyPropDiagnostics().visible).toBe(0);expect(opening.cast.room.legacyPropDiagnostics().hidden).toBe(11);assertCrateSurface();console.log("PROP_RESET_CHECK|6_preset,0_dynamic,6_restored_no_legacy");
  }
}
