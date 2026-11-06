import {enterCase} from "./RoomscriptLeafSetup";
import {verdictStampText} from "./Engine/perf/CaseBoardLayout";
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
      // WHO opens on the suspect you face; cycle to the culprit (correct/timeout) or to an innocent (wrong).
      {const g=engine.graphRef(),want=(id:string)=>mode==="wrong"?id!==g.envelope.who:id===g.envelope.who;for(let i=0;i<=g.cast.suspects.length&&!want(closing.diagnostics().picked.who);i++)await tap("Accused suspect");expect(want(closing.diagnostics().picked.who)).toBe(true);}
      // Run 9: room and weapon open unset ("?"); a seal hold on an incomplete accusation commits nothing.
      expect(closing.diagnostics().picked.where).toBe("");expect(closing.diagnostics().picked.what).toBe("");
      await hand.drag(findInteractablesByName("Break seal",undefined,true)[0],new vec3(.001,0,0),1200);expect(engine.snapshot().accusation).toBe(null);
      const graph0=engine.graphRef();for(const [key,name,length] of [["where","Accused room",graph0.room.zones.length],["what","Accused weapon",graph0.weapons.length]] as ["where"|"what",string,number][]){for(let i=0;i<=length&&closing.diagnostics().picked[key]!==graph0.envelope[key];i++)await tap(name);expect(closing.diagnostics().picked[key]).toBe(graph0.envelope[key]);}
      console.log("CLOSING_PICKED|"+JSON.stringify({mode,picked:closing.diagnostics().picked}));
      await tap("Break seal");expect(engine.snapshot().accusation).toBe(null);
      // A zero-distance drag maintains a real SIK trigger for the required hold interval.
      await hand.drag(findInteractablesByName("Break seal",undefined,true)[0],new vec3(.001,0,0),1200);
      expect(engine.snapshot().verdict).toBe(mode==="wrong"?"wrong":"correct");expect(closing.diagnostics().phase).toBe("reconstruction");
      for(let i=0;i<350&&closing.diagnostics().phase!=="ending";i++)await sleep(100);
      expect(closing.diagnostics().phase).toBe("ending");expect(closing.diagnostics().result.indexOf("Holmes rating")>=0).toBe(true);
      for(const person of engine.graphRef().cast.suspects)expect(findSceneObjectByName("RoomscriptPawn_"+person.id).enabled).toBe(false);
      for(const name of ["Break seal","Cancel accusation","Question 1","Believe"])expect(findInteractablesByName(name,undefined,true).length).toBe(0);
      for(let i=0;i<20&&findInteractablesByName("Ending details",undefined,true).length===0;i++)await sleep(100);expect(findInteractablesByName("Ending details",undefined,true).length).toBe(1);
      // Run 8 ending: the Morning Edition in your hands and the verdict stamp on the wall board, no results page.
      const paper=findSceneObjectByName("RoomscriptNewspaper");expect(!!paper&&paper.enabled).toBe(true);const headline=findSceneObjectByName("Headline",paper).getComponent("Component.Text") as Text;expect(headline.text.length>0).toBe(true);
      {const stamp="Board stamp "+verdictStampText(engine.snapshot().verdict!);expect(!!findSceneObjectByName(stamp)).toBe(true);if(mode!=="correct")expect(!!findSceneObjectByName("Board stamp CASE CLOSED")).toBe(false);expect(!!findSceneObjectByName("Board stamp FILED")).toBe(false);}console.log("ENDING_NEWSPAPER|"+headline.text);
      await tap("Ending details");expect(closing.presentationDiagnostics().details).toBe(true);for(const name of ["Ending previous","Ending next","Ending stamp"])expect(findInteractablesByName(name,undefined,true).length).toBe(1);await tap("Ending stamp");expect(closing.presentationDiagnostics().details).toBe(false);
      console.log("ENDING_PRESENTATION_CHECK|pawns_hidden,only_ending_controls,newspaper,board_stamp,details_roundtrip");
      const verdict=engine.snapshot().verdict;engine.dispatch({type:"Accuse",who:"S1",where:"Z2",what:"O2"});expect(engine.snapshot().verdict).toBe(verdict);
      console.log("CLOSING_CHECK|"+JSON.stringify({mode,verdict,result:closing.diagnostics().result}));
    }finally{flow.cancel();flow.client.forceOffline=false;}
  }
}
