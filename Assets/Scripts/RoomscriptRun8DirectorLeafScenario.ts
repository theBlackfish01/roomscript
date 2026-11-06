import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptMain} from "./RoomscriptMain";
import {RoomscriptClosingController} from "./RoomscriptClosingController";

/** Run 8 Director capture fixture: sets up one beat through real taps, then holds it for Preview captures.
 * Presentation only; every step goes through the same engine actions as play. */
@component export class RoomscriptRun8DirectorLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void> {
    const beat=config?.get("beat")||"question",hold=Math.min(220,Number(config?.get("hold")||"30")),suspect=config?.get("suspect")||"S2";
    if(beat!=="opening")await enterCase();await sleep(800);
    const flow=findSceneObjectByName("RoomscriptInterrogation").getComponent(RoomscriptInterrogationController.getTypeName()) as RoomscriptInterrogationController;
    const hand=new DefaultLeafInteractor();
    const tap=async(name:string)=>{let hits=findInteractablesByName(name,undefined,true);for(let i=0;i<30&&!hits.length;i++){await sleep(50);hits=findInteractablesByName(name,undefined,true);}expect(hits.length).toBe(1);await hand.trigger(hits[0]);await sleep(250);};
    const done=async()=>{for(let i=0;i<80&&flow.diagnostics().busy;i++)await sleep(200);};
    flow.client.forceOffline=true;flow.subtitles.holdForCapture(hold+30);
    if(beat==="question"||beat==="answer"){await tap("Question "+suspect);}
    if(beat==="answer"){await tap("Question 1");await done();}
    if(beat==="board"||beat==="web"){const engine=flow.engine;await tap("Question "+suspect);await tap("Question 1");await done();
      for(const object of ["O11","O9","O6"]){engine.dispatch({type:"PinchObject",object});await sleep(300);}
      const state=engine.snapshot(),claim=state.activeStatement;
      if(claim&&state.knowledge.evidenceIds.includes("E_KETTLE_COLD")){const result=engine.dispatch({type:"Object",suspect,statement:claim,evidence:["E_KETTLE_COLD"]});console.log("RUN8_DIRECTOR_OBJECTION|"+result.events.filter(e=>e.seq===result.lastSeq).map(e=>e.type).join(","));}
      await sleep(1500);}
    if(beat==="accuse"){await tap("Question "+suspect);await tap("Accuse");}
    if(beat==="ending"){const engine=flow.engine;const graph=engine.graphRef();engine.dispatch({type:"Accuse",who:graph.envelope.who,where:graph.envelope.where,what:graph.envelope.what});for(let i=0;i<600;i++){const p=findSceneObjectByName("RoomscriptNewspaper");if(p&&p.enabled)break;await sleep(100);}await sleep(1200);}
    if(beat==="replay"){const main=findSceneObjectByName("Roomscript").getComponent(RoomscriptMain.getTypeName()) as RoomscriptMain;main.replays.holdFor(hold);flow.engine.dispatch({type:"PinchObject",object:config?.get("object")||"O12"});await sleep(1500);}
    if(beat==="frozen"){const closing=findSceneObjectByName("RoomscriptClosing").getComponent(RoomscriptClosingController.getTypeName()) as RoomscriptClosingController;closing.holdAtBeat("freeze",hold);const graph=flow.engine.graphRef();flow.engine.dispatch({type:"Accuse",who:graph.envelope.who,where:graph.envelope.where,what:graph.envelope.what});for(let i=0;i<600&&!findSceneObjectByName("RoomscriptFrozenTableau");i++)await sleep(100);await sleep(800);}
    if(beat==="storm"){const main=findSceneObjectByName("Roomscript").getComponent(RoomscriptMain.getTypeName()) as RoomscriptMain;main.storm.flashNow(hold);}
    console.log("RUN8_DIRECTOR_READY|"+JSON.stringify({beat,suspect,subtitle:flow.subtitles.visibleLine(),chips:flow.chips.topics()}));
    await sleep(hold*1000);
  }
}
