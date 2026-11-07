import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptNextGlow} from "./RoomscriptNextGlow";
/** Run 9 (phase 5): the next useful object glows after the player stalls, and goes out when they act.
 * Opens the case, waits idle: a ring on an unquestioned suspect. Asks one question: the ring goes out at once,
 * then after another stall it moves to a clue object or another suspect. Parameter hold (s) keeps each ring up
 * for a Preview capture. Uses public UI only; never dispatches. */
@component export class RoomscriptNextGlowLeafScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void>{
    const hold=Math.min(20,Number(config?.get("hold")||"0"))*1000;await sleep(1200);
    const opening=findSceneObjectByName("RoomscriptOpening").getComponent(RoomscriptOpeningController.getTypeName()) as RoomscriptOpeningController;
    const flow=opening.cast.flow,hand=new DefaultLeafInteractor(),offline=flow.client.forceOffline;flow.client.forceOffline=true;
    const control=async(name:string)=>{let t=findInteractablesByName(name,undefined,true);for(let i=0;i<30&&t.length===0;i++){await sleep(50);t=findInteractablesByName(name,undefined,true);}expect(t.length).toBe(1);return t[0];};
    const tap=async(name:string)=>{await hand.trigger(await control(name));await sleep(180);};
    const waitGlow=async(seconds:number)=>{let last="";for(let i=0;i<seconds*10&&!RoomscriptNextGlow.current?.diagnostics().visible;i++){const w=RoomscriptNextGlow.current!.diagnostics().waiting;if(w!==last){last=w;console.log("NEXT_GLOW_WAITING|"+w);}await sleep(100);}return RoomscriptNextGlow.current!.diagnostics();};
    try{
      expect(!!RoomscriptNextGlow.current).toBe(true);
      if(opening.diagnostics().phase==="placement")await tap("Place case");
      for(let i=0;i<100&&opening.diagnostics().phase!=="tab";i++)await sleep(100);
      await hand.drag(await control("RoomscriptPullTab"),new vec3(12,0,0),500);
      for(let i=0;i<200&&opening.diagnostics().phase!=="ready";i++)await sleep(100);
      expect(opening.diagnostics().phase).toBe("ready");
      const first=await waitGlow(90);console.log("NEXT_GLOW_FIRST|"+JSON.stringify(first));
      expect(first.visible).toBe(true);expect(first.kind).toBe("suspect");
      console.log("NEXT_GLOW_HOLD|first");if(hold)await sleep(hold);
      await tap("Question "+first.id);await tap("Question 1");
      for(let i=0;i<300&&flow.diagnostics().busy;i++)await sleep(100);
      const after=RoomscriptNextGlow.current!.diagnostics();console.log("NEXT_GLOW_AFTER_ACT|"+JSON.stringify(after));expect(after.visible).toBe(false);
      const second=await waitGlow(26);console.log("NEXT_GLOW_SECOND|"+JSON.stringify(second));
      expect(second.visible).toBe(true);expect(second.kind==="object"||second.kind==="suspect").toBe(true);
      console.log("NEXT_GLOW_HOLD|second");if(hold)await sleep(hold);
      console.log("NEXT_GLOW_CHECK|"+JSON.stringify({first,second}));
    }finally{flow.client.forceOffline=offline;}
  }
}
