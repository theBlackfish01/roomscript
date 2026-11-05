import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep,nextFrame} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptMain} from "./RoomscriptMain";
import {replayGame} from "./Engine/game/Reducer";
/** Director fixture advances through real engine actions; card opening uses real UI pinches. */
@component export class RoomscriptStoryMomentsLeafScenario extends Scenario {
  async run():Promise<void>{
    await sleep(500);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const main=findSceneObjectByName("Roomscript").getComponent(RoomscriptMain.getTypeName()) as RoomscriptMain,flow=opening.cast.flow,engine=flow.engine,oldOffline=flow.client.forceOffline,hand=new DefaultLeafInteractor();
    flow.client.forceOffline=true;engine.configurePreset();opening.finish();await sleep(200);
    const tap=async(name:string)=>{const hits=findInteractablesByName(name,undefined,true);expect(hits.length).toBe(1);await hand.trigger(hits[0]);await sleep(100);};
    const advance=async(minutes:number)=>{for(let i=0;i<30&&engine.snapshot().elapsedMinutes<minutes;i++){engine.dispatch({type:"Ask",suspect:"S3",topic:"baseline:name"});await nextFrame();}expect(engine.snapshot().elapsedMinutes).toBe(minutes);console.log("STORY_ADVANCE|"+minutes);};
    try{
      expect(main.storyMoments.diagnostics().cards).toBe(0);expect(main.storyMoments.diagnostics().uv).toBe(false);
      await advance(45);await sleep(300);expect(main.storyMoments.diagnostics().cards).toBe(1);const before=JSON.stringify(engine.snapshot().knowledge);
      await tap("Read letter");expect(main.storyMoments.diagnostics().modal).toBe(true);expect(flow.controlsBlocked).toBe(true);expect(engine.snapshot().elapsedMinutes).toBe(45);await tap("Close story memory");expect(JSON.stringify(engine.snapshot().knowledge)).toBe(before);
      await advance(75);await sleep(300);expect(main.storyMoments.diagnostics().cards).toBe(2);await tap("Read voicemail");expect(main.storyMoments.diagnostics().modal).toBe(true);await tap("Close story memory");
      const pike=flow.actorFor("S4")!.getTransform(),home=pike.getWorldPosition();await advance(105);await sleep(1100);expect(main.storyMoments.diagnostics().active).toBe("flight");expect(pike.getWorldPosition().distance(home)>1).toBe(true);expect(engine.snapshot().elapsedMinutes).toBe(105);
      await sleep(4200);expect(pike.getWorldPosition().distance(home)<.01).toBe(true);
      await advance(120);await sleep(900);expect(main.storyMoments.diagnostics().active).toBe("blackout");expect(main.storyMoments.diagnostics().uv).toBe(true);await sleep(3500);expect(main.storyMoments.diagnostics().active).toBe(null);expect(main.storyMoments.diagnostics().uv).toBe(true);
      const state=engine.snapshot();expect(state.elapsedMinutes).toBe(120);expect(JSON.stringify(replayGame(engine.graphRef(),state.log))).toBe(JSON.stringify(state));
      console.log("STORY_MOMENTS_CHECK|"+JSON.stringify({moments:main.storyMoments.diagnostics(),cardsAdmitted:true,physicalPinches:true,flightReturned:true,blackoutResumed:true,replay:true}));
    }finally{flow.cancel();flow.client.forceOffline=oldOffline;engine.configurePreset();opening.finish();}
    expect(main.storyMoments.diagnostics().cards).toBe(0);expect(main.storyMoments.diagnostics().uv).toBe(false);
  }
}
