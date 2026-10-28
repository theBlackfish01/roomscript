import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {replayGame} from "./Engine/game/Reducer";

/** Exercises production controls, charged intent, topic correction and network-off behavior. */
@component export class RoomscriptInterrogationLeafScenario extends Scenario {
  async run():Promise<void> {
    await sleep(1500);
    const flow=findSceneObjectByName("RoomscriptInterrogation").getComponent(RoomscriptInterrogationController.getTypeName()) as RoomscriptInterrogationController;
    const engine=flow.engine,hand=new DefaultLeafInteractor(),oldOffline=flow.client.forceOffline;
    const tap=async(name:string)=>{const hits=findInteractablesByName(name,undefined,true);expect(hits.length).toBe(1);await hand.trigger(hits[0]);await sleep(200);};
    const done=async()=>{for(let i=0;i<50&&flow.diagnostics().busy;i++)await sleep(200);expect(flow.diagnostics().busy).toBe(false);};
    try {
      flow.client.forceOffline=true;
      const start=engine.snapshot().elapsedMinutes;
      await tap("Question 1");await done();
      expect(engine.snapshot().elapsedMinutes-start).toBe(15);
      expect(flow.diagnostics().last!.origin).toBe("cache");
      expect(engine.snapshot().activeStatement!==null).toBe(true);
      expect(flow.subtitles.text().length).toBeGreaterThan(0);
      const before=engine.snapshot().elapsedMinutes;
      await tap("Ask anything");await tap("Free whereabouts");await tap("Correct topic 2");
      expect(engine.snapshot().elapsedMinutes).toBe(before);
      await tap("Submit question");await done();
      const corrected=engine.snapshot().log.filter(action=>action.type==="Ask").slice(-1)[0];
      expect(corrected.type==="Ask"&&corrected.topic==="baseline:name").toBe(true);
      expect(corrected.type==="Ask"&&corrected.question==="Where were you at 22:30?").toBe(true);
      await tap("Ask anything");await tap("Free weird");const weirdStart=engine.snapshot().elapsedMinutes;
      await tap("Submit question");await done();
      expect(engine.snapshot().elapsedMinutes-weirdStart).toBe(5);
      expect(flow.diagnostics().last!.mode).toBe("deflect");
      expect(JSON.stringify(replayGame(engine.caseGraph(),engine.snapshot().log))).toBe(JSON.stringify(engine.snapshot()));
      console.log("INTERROGATION_CHECK|offline,charged-once,topic-correction,exact-question,replay");
    } finally {flow.cancel();flow.client.forceOffline=oldOffline;}
  }
}
