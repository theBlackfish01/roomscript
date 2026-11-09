import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {sleep,findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {RoomscriptRun10LeafDriver} from "./RoomscriptRun10LeafDriver";
import {RoomscriptRoomMap} from "./RoomscriptRoomMap";
/** Preview-only placement integration probe. */
@component export class RoomscriptRoomCastLeafScenario extends Scenario {
 async run(config?:ScenarioConfig):Promise<void>{
  await sleep(700);const d=new RoomscriptRun10LeafDriver();d.opening.setFilmMode(true);d.flow.client.forceOffline=true;d.audio.silence(true);
  if(config?.get("mode")==="fallback"){
   global.persistentStorageSystem.store.putString("roomscript.roomCast.pending","roomcast-"+Date.now());
   await (RoomscriptRoomMap.current as any).fallback("verification_unavailable");
   expect(RoomscriptRoomMap.current.diagnostics().mapped).toBe(false);expect(d.opening.diagnostics().phase).toBe("ready");expect(d.engine.graphRef().roomMapping).toBe(undefined);return;
  }
  if(config?.get("mode")==="scan"){await RoomscriptRoomMap.current.start();this.assertMapped(d);return;}
  await d.open();await d.prove();await d.prepareAccusation();await d.tap("Break seal");
  await d.waitUntil(()=>!!findSceneObjectByName("RoomscriptNewspaper")?.enabled,"newspaper");
  expect(d.engine.snapshot().verdict).toBe("correct");await d.tap("Another case");
  expect(findInteractablesByName("Play Harlow in this room",undefined,true).length).toBe(1);
  expect(findInteractablesByName("Replay Harlow",undefined,true).length).toBe(1);
  await d.tap("Play Harlow in this room",false);expect(RoomscriptRoomMap.current.diagnostics().busy).toBe(true);
  console.log("ROOM_CAST_LAUNCHED|ending-button; local editor handoff");
  await d.waitUntil(()=>!RoomscriptRoomMap.current.diagnostics().busy,"mapped replay",180000);this.assertMapped(d);
 }
 private assertMapped(d:RoomscriptRun10LeafDriver):void{
  expect(RoomscriptRoomMap.current.diagnostics().mapped).toBe(true);expect(d.engine.graphRef().envelope).toEqual({who:"S2",where:"Z1",what:"O1"});expect(d.opening.cast.room.audit()).toEqual([]);expect(d.opening.diagnostics().phase).toBe("ready");expect(findInteractablesByName("Question S2",undefined,true).length).toBe(1);
 }
}
