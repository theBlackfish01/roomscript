import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";

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
    console.log("RUN8_DIRECTOR_READY|"+JSON.stringify({beat,suspect,subtitle:flow.subtitles.visibleLine(),chips:flow.chips.topics()}));
    await sleep(hold*1000);
  }
}
