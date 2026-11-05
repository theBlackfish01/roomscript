import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,nextFrame} from "Leaf.lspkg/Utils/common/Utils";
import {enterCase} from "./RoomscriptLeafSetup";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
/** S2/S3 regressions: immutable shared views and simultaneous tick/refutation audio. */
@component export class RoomscriptPolishLeafScenario extends Scenario {
  async run():Promise<void>{
    await enterCase();const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const engine=opening.cast.flow.engine,audio=opening.clue.objection.tells.audio,first=engine.snapshot();
    console.log("POLISH_CACHE|"+JSON.stringify({same:engine.snapshot()===first,frozen:Object.isFrozen(first.knowledge.factIds)}));expect(engine.snapshot()===first).toBe(true);expect(Object.isFrozen(first.knowledge.factIds)).toBe(true);
    engine.dispatch({type:"Ask",suspect:"S2",topic:"baseline:name"});expect(engine.snapshot()===first).toBe(false);
    const point=opening.cast.room.objectAnchor("O7").getTransform().getWorldPosition();audio.playAt("Chime",point);audio.playAt("ClockTick",point);
    await nextFrame();console.log("POLISH_AUDIO|"+JSON.stringify(audio.diagnostics()));expect(audio.diagnostics().spatial).toBe(1);expect(audio.diagnostics().tick).toBe(true);
    let sum=0,max=0;for(let i=0;i<600;i++){await nextFrame();const ms=getDeltaTime()*1000;sum+=ms;max=Math.max(max,ms);}
    console.log("POLISH_FRAME_PROBE|"+JSON.stringify({frames:600,meanMs:sum/600,maxMs:max,targetMs:8}));
  }
}
