import {RoomscriptCaseBoard} from "./RoomscriptCaseBoard";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {admittedCard} from "./RoomscriptArtLibrary";
import {walletEntries} from "./Engine/game/SpatialObjection";
import {EVENING_ROOM_SCAN,EVENING_ROOM_FLOOR_Y} from "./Content/EveningRoomScan";
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
      console.log("CRATE_SURFACE_PRE|"+JSON.stringify({surface:layout.surfaceWorld,world:[world.x,world.y,world.z],baseBottom:bottom.y,scale:scale.x,parent:crate.getParent().name}));
      expect(Math.abs(bottom.y-layout.surfaceWorld[1])<.1).toBe(true);expect(Math.abs(world.x-layout.surfaceWorld[0])<.1).toBe(true);expect(Math.abs(world.z-layout.surfaceWorld[2])<.1).toBe(true);
      const card=findSceneObjectByName("RoomscriptOpeningCard",crate),tab=findSceneObjectByName("RoomscriptPullTab",crate);
      console.log("CRATE_SURFACE_PARENTS|"+JSON.stringify({card:card?card.getParent().name:null,tab:tab?tab.getParent().name:null}));
      expect(card.getParent().isSame(crate)).toBe(true);const inside=(o:SceneObject)=>{for(let p=o.getParent();p;p=p.getParent())if(p.isSame(crate))return true;return false;};expect(inside(tab)).toBe(true); // Run 8: the tab lives in RoomscriptCaseFiles under the crate
      const backing=card.getChildrenCount()?card.getChild(0):card,plate=backing.getComponent(BackPlate.getTypeName()) as BackPlate;
      // Run 9: the Run 8 case files replaced the "Pull tab" button; the Preset file keeps the RoomscriptPullTab name.
      const lowest=(object:SceneObject,width:number,height:number)=>Math.min(...[-1,1].flatMap(x=>[-1,1].map(y=>object.getTransform().getWorldTransform().multiplyPoint(new vec3(x*width/2,y*height/2,0)).y)));
      const cardBottom=plate?lowest(backing,plate.size.x,plate.size.y):card.getTransform().getWorldPosition().y, // Run 8: a caption line, no plate
        tabBottom=lowest(tab,layout.pullTab.width,layout.pullTab.height);
      console.log("CRATE_SURFACE_UI|"+JSON.stringify({cardBottom,tabBottom}));
      expect(cardBottom>layout.surfaceWorld[1]).toBe(true);expect(tabBottom>layout.surfaceWorld[1]).toBe(true);
      console.log("CRATE_SURFACE_CHECK|"+JSON.stringify({surface:layout.surfaceWorld,baseBottom:[bottom.x,bottom.y,bottom.z],cardBottom,tabBottom}));
    };assertCrateSurface();
    // Run 9: every Preset object has one visual (mesh, highlight drawing or the authored cable); counts come from the graph.
    const presetObjects=engine.graphRef().room.objects.length;
    const legacy=opening.cast.room.legacyPropDiagnostics();console.log("PROP_COUNT_CHECK|"+JSON.stringify({props:opening.cast.room.propCount(),objects:presetObjects,replaced:legacy.replaced.length,hidden:legacy.hidden,visible:legacy.visible}));
    expect(opening.cast.room.propCount()).toBe(presetObjects);expect(legacy.replaced.length).toBe(presetObjects-1);expect(legacy.visible).toBe(0);expect(legacy.anchorsEnabled).toBe(true);
    console.log("MEMORY_STATE_PRE|"+JSON.stringify({mark:findSceneObjectByName("InterrogationMark").enabled,tape:findSceneObjectByName("RoomscriptDoorTape").enabled}));
    expect(opening.cast.room.objectAnchor("O4").enabled).toBe(true);expect(findSceneObjectByName("InterrogationMark").enabled).toBe(false);expect(findSceneObjectByName("RoomscriptDoorTape").enabled).toBe(true); // Run 8: the "nobody leaves" tape stays across the door for the case
    console.log("PROP_LEGACY_CHECK|"+JSON.stringify(legacy));expect(admittedCard(engine.graphRef(),engine.snapshot(),"E_KETTLE_COLD")).toBe(null);
    await tap("RoomscriptObject_O11");console.log("MEMORY_STATE_TAP|"+JSON.stringify({toast:(findSceneObjectByName("Toast").getChild(0).getComponent("Component.Text") as Text).text,expanded:objection.cardDiagnostics().expanded,blocked:opening.cast.flow.controlsBlocked}));expect((findSceneObjectByName("Toast").getChild(0).getComponent("Component.Text") as Text).text).toBe("Memory collected");expect(objection.cardDiagnostics().expanded).toBe(false);expect(opening.cast.flow.controlsBlocked).toBe(true);
    await tap("Expand memory");expect(objection.cardDiagnostics().expanded).toBe(true);expect(objection.cardDiagnostics().authored).toBe(true);
    expect(engine.snapshot().knowledge.evidenceIds.includes(objection.cardDiagnostics().id!)).toBe(true);
    await tap("Close memory");await tap("Evidence");await tap("Expand evidence");expect(objection.wallet.cardDiagnostics().expanded).toBe(true);
    objection.wallet.setEntries(walletEntries(engine.graphRef(),engine.snapshot()));expect(objection.wallet.cardDiagnostics().expanded).toBe(true);
    const generatedView={...engine.graphRef(),caseId:"generated-card-guard"};expect(admittedCard(generatedView,engine.snapshot(),"E_KETTLE_COLD")!.authored).toBe(false);
    await tap("Close evidence");console.log("MEMORY_CARD_CHECK|"+JSON.stringify({unknownHidden:true,expandedPreserved:true,dynamicBlankFrame:true,knowledge:engine.snapshot().knowledge.evidenceIds.length}));
    expect(engine.configureDynamic(7,EVENING_ROOM_SCAN).ok).toBe(true);expect(opening.cast.room.propCount()).toBe(engine.graphRef().room.objects.filter(o=>o.virtual).length);engine.configurePreset();opening.finish();expect(opening.cast.room.propCount()).toBe(presetObjects);expect(opening.cast.room.legacyPropDiagnostics().visible).toBe(0);expect(opening.cast.room.legacyPropDiagnostics().hidden).toBe(legacy.hidden);assertCrateSurface();console.log("PROP_RESET_CHECK|preset,dynamic_virtual_only,preset_restored_no_legacy");
    {const board=RoomscriptCaseBoard.current!,y=board.root.getTransform().getWorldPosition().y-EVENING_ROOM_FLOOR_Y;console.log("BOARD_HEIGHT_CHECK|"+y.toFixed(1));expect(board.root.enabled&&y>80&&y<200).toBe(true);} // Run 9 regression: the board hung under the floor
  }
}
