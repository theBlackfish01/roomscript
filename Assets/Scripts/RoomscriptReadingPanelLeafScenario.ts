import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar";
import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
/** Actual strict hand navigation; modal placement is checked in the grounded scene. */
@component export class RoomscriptReadingPanelLeafScenario extends Scenario {
  async run():Promise<void>{
    await sleep(700);const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const flow=opening.cast.flow,engine=flow.engine,notebook=opening.clue.notebook,hand=createIKInteractor({body:{fallback:undefined}}),offline=flow.client.forceOffline;
    const targets=(name:string)=>findInteractablesByName(name,undefined,true);
    const tap=async(name:string)=>{let hits=targets(name);for(let i=0;i<40&&!hits.length;i++){await sleep(50);hits=targets(name);}expect(hits.length).toBe(1);console.log("READING_PANEL_STEP|"+name);await hand.trigger(hits[0]);await sleep(200);};
    const inspect=(node:SceneObject,width:number,height:number,buttons:string[])=>{
      const transform=node.getTransform(),world=transform.getWorldTransform(),inverse=transform.getInvertedWorldTransform(),floor=engine.roomRoot.getTransform().getWorldPosition().y;
      const corners=[-1,1].flatMap(x=>[-1,1].map(y=>world.multiplyPoint(new vec3(x*width/2,y*height/2,0))));
      expect(transform.getWorldScale().distance(vec3.one())<.001).toBe(true);const bottom=Math.min(...corners.map(p=>p.y));expect(bottom>=floor+59.99).toBe(true);
      for(const name of buttons){const hits=targets(name);expect(hits.length).toBe(1);const buttonNode=hits[0].getSceneObject(),button=buttonNode.getComponent(RectangleButton.getTypeName()) as RectangleButton;expect(!!button).toBe(true);
        const matrix=buttonNode.getTransform().getWorldTransform();for(const x of [-1,1])for(const y of [-1,1]){const local=inverse.multiplyPoint(matrix.multiplyPoint(new vec3(x*button.size.x/2,y*button.size.y/2,0)));expect(Math.abs(local.x)<=width/2+.1).toBe(true);expect(Math.abs(local.y)<=height/2+.1).toBe(true);}
      }
      console.log("READING_PANEL_GEOMETRY|"+JSON.stringify({panel:node.name,bottom,floor,worldScale:[1,1,1],buttons}));
    };
    try{
      flow.client.forceOffline=true;engine.configurePreset();opening.finish();await sleep(350);await hand.ready;const before=engine.snapshot().elapsedMinutes;
      await tap("Notebook");expect(flow.controlsBlocked).toBe(true);expect(targets("Question 1").length).toBe(0);expect(targets("Believe").length).toBe(0);
      inspect(notebook.getSceneObject(),notebook.width,54,["Grid","Next notebook page","Close notebook"]);const notebookPosition=notebook.getTransform().getWorldPosition();
      await tap("Next notebook page");expect(notebook.getTransform().getWorldPosition().distance(notebookPosition)<.001).toBe(true);await tap("Close notebook");expect(notebook.getSceneObject().enabled).toBe(false);expect(flow.controlsBlocked).toBe(false);
      await tap("Question S2");for(let i=0;i<10&&!flow.chips.topics().includes("free");i++)await tap("More questions");const free=flow.chips.topics().indexOf("free");expect(free>=0).toBe(true);await tap("Question "+(free+1));
      expect(flow.controlsBlocked).toBe(true);expect(targets("Question 1").length).toBe(0);expect(targets("Believe").length).toBe(0);inspect(flow.questions.getSceneObject(),flow.questions.width,39,["Type a question","Submit question","Close question"]);
      const questionPosition=flow.questions.getTransform().getWorldPosition();await tap("Free whereabouts");expect(flow.questions.getTransform().getWorldPosition().distance(questionPosition)<.001).toBe(true);
      await tap("Close question");expect(flow.questions.getSceneObject().enabled).toBe(false);expect(flow.controlsBlocked).toBe(false);expect(targets("Question 1").length).toBe(1);expect(targets("Believe").length).toBe(0);expect(engine.snapshot().elapsedMinutes).toBe(before);
      console.log("READING_PANEL_CHECK|strictIK,grounded_scene,world_scale_one,controls_inside,world_locked,no_clock_charge");
    }finally{flow.cancel();flow.client.forceOffline=offline;engine.configurePreset();opening.finish();}
  }
}
