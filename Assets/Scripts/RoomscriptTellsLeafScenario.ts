import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptTellVisual} from "./RoomscriptTellVisual";

@component export class RoomscriptTellsLeafScenario extends Scenario {
  async run():Promise<void> { await enterCase();
    await sleep(1500);const tells=findSceneObjectByName("RoomscriptTells").getComponent(RoomscriptTellVisual.getTypeName()) as RoomscriptTellVisual;
    const flow=tells.flow,engine=flow.engine,hand=new DefaultLeafInteractor();flow.client.forceOffline=true;
    const tap=async(name:string)=>{const matches=findInteractablesByName(name,undefined,true);expect(matches.length).toBe(1);await hand.trigger(matches[0]);await sleep(150);};
    try {
      await tap("Question S2");await flow.askChip("baseline:name");await sleep(500);expect(tells.diagnostics().count).toBe(0);
      await flow.askChip("baseline:brooch");await sleep(450);expect(tells.diagnostics().count).toBe(1);expect(tells.diagnostics().prop).toBe(true);
      expect(tells.diagnostics().delayMs>=290&&tells.diagnostics().delayMs<400).toBe(true);
      await flow.askFree("Could a dragon juggle the moon?");await sleep(450);expect(tells.diagnostics().count).toBe(1);expect(tells.diagnostics().prop).toBe(false);
      await flow.askChip("where@22:30");await sleep(450);expect(tells.diagnostics().target).toBe("O11");expect(tells.diagnostics().line).toBe(true);
      const press=findInteractablesByName("Press",undefined,true)[0],hover=hand.hover(press,400);await sleep(150);
      expect(flow.verbs.previewText().replace(/\n/g," ").indexOf("Press: I was in the Kitchen")>=0).toBe(true);
      await hover;
      await tap("Press");await tap("Press");await tap("Press");await sleep(1800);
      expect(tells.diagnostics().absent).toBe(true);expect(flow.actor.getSceneObject().enabled).toBe(false);expect(tells.diagnostics().segments).toBe(1);
      const clock=engine.snapshot().elapsedMinutes;await flow.askChip("where@22:30");expect(engine.snapshot().elapsedMinutes).toBe(clock);
      engine.dispatch({type:"Ask",suspect:"S3",topic:"about:V"});expect(tells.diagnostics().absent).toBe(true);
      engine.dispatch({type:"Ask",suspect:"S3",topic:"about:V"});await sleep(1800);
      expect(tells.diagnostics().absent).toBe(false);expect(flow.actor.getSceneObject().enabled).toBe(true);
      console.log("TELLS_CHECK|"+JSON.stringify({delayMs:tells.diagnostics().delayMs,count:tells.diagnostics().count,baseline:true,deflectionQuiet:true,doorReturn:true}));
    } finally {flow.cancel();flow.client.forceOffline=false;}
  }
}
