import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep,nextFrame} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptClosingController} from "./RoomscriptClosingController";

@component export class RoomscriptClosingLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void> { await enterCase();
    await sleep(2000);const closing=findSceneObjectByName("RoomscriptClosing").getComponent(RoomscriptClosingController.getTypeName()) as RoomscriptClosingController,flow=closing.cast.flow,engine=flow.engine,hand=new DefaultLeafInteractor();flow.client.forceOffline=true;
    const tap=async(name:string)=>{const matches=findInteractablesByName(name,undefined,true);expect(matches.length).toBe(1);await hand.trigger(matches[0]);await sleep(120);};
    try {
      const mode=config?.get("mode")||"correct",fixtureStarted=Date.now();
      if(mode==="timeout"){for(let i=0;i<36;i++){engine.dispatch({type:"Ask",suspect:"S2",topic:"where@22:30"});await nextFrame();if(i===0||(i+1)%6===0)console.log("CLOSING_FIXTURE_PROGRESS|"+JSON.stringify({mode,asks:i+1,total:36,elapsedMs:Date.now()-fixtureStarted,phase:closing.diagnostics().phase,opened:closing.diagnostics().opened}));}expect(closing.diagnostics().opened).toBe(true);}
      else await tap("Accuse");
      await sleep(250); // UIKit enables the timeout-opened panel on the following frame.
      expect(closing.diagnostics().phase).toBe("idle");for(const person of engine.graphRef().cast.suspects)expect(findSceneObjectByName("RoomscriptPawn_"+person.id).enabled).toBe(false);
      if(mode!=="wrong")await tap("Accused suspect");
      await tap("Break seal");expect(engine.snapshot().accusation).toBe(null);
      // A zero-distance drag maintains a real SIK trigger for the required hold interval.
      await hand.drag(findInteractablesByName("Break seal",undefined,true)[0],new vec3(.001,0,0),1200);
      expect(engine.snapshot().verdict).toBe(mode==="wrong"?"wrong":"correct");expect(closing.diagnostics().phase).toBe("reconstruction");
      for(let i=0;i<350&&closing.diagnostics().phase!=="ending";i++)await sleep(100);
      expect(closing.diagnostics().phase).toBe("ending");expect(closing.diagnostics().result.indexOf("Holmes rating")>=0).toBe(true);
      for(const person of engine.graphRef().cast.suspects)expect(findSceneObjectByName("RoomscriptPawn_"+person.id).enabled).toBe(false);
      for(const name of ["Break seal","Cancel accusation","Question 1","Believe"])expect(findInteractablesByName(name,undefined,true).length).toBe(0);
      expect(findInteractablesByName("Ending details",undefined,true).length).toBe(1);
      const result=findSceneObjectByName("RoomscriptResult"),stampRow=findSceneObjectByName("Ending stamp",result),label=findSceneObjectByName("Label",stampRow),text=label.getComponent("Component.Text") as Text,stamp=findSceneObjectByName("Verdict stamp",stampRow),border=(stamp.getComponent("Component.ScreenTransform") as ScreenTransform).offsets;
      const labelWorld=label.getTransform().getWorldTransform(),rowInverse=stampRow.getTransform().getInvertedWorldTransform(),rect=text.layoutRect;
      for(const x of [rect.left,rect.right])for(const y of [rect.bottom,rect.top]){const point=rowInverse.multiplyPoint(labelWorld.multiplyPoint(new vec3(x,y,0)));expect(point.x>=border.left-.01&&point.x<=border.right+.01).toBe(true);expect(point.y>=border.bottom-.01&&point.y<=border.top+.01).toBe(true);}
      await tap("Ending details");expect(closing.presentationDiagnostics().details).toBe(true);for(const name of ["Ending previous","Ending next","Ending stamp"])expect(findInteractablesByName(name,undefined,true).length).toBe(1);await tap("Ending stamp");expect(closing.presentationDiagnostics().details).toBe(false);
      console.log("ENDING_PRESENTATION_CHECK|pawns_hidden,only_ending_controls,title_inside_stamp,details_roundtrip");
      const verdict=engine.snapshot().verdict;engine.dispatch({type:"Accuse",who:"S1",where:"Z2",what:"O2"});expect(engine.snapshot().verdict).toBe(verdict);
      console.log("CLOSING_CHECK|"+JSON.stringify({mode,verdict,result:closing.diagnostics().result}));
    }finally{flow.cancel();flow.client.forceOffline=false;}
  }
}
