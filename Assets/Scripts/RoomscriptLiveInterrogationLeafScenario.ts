import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptTellVisual} from "./RoomscriptTellVisual";

/** Three real production requests including their first spoken audio. */
@component export class RoomscriptLiveInterrogationLeafScenario extends Scenario {
  async run():Promise<void> { await enterCase();
    await sleep(2000);
    const flow=findSceneObjectByName("RoomscriptInterrogation").getComponent(RoomscriptInterrogationController.getTypeName()) as RoomscriptInterrogationController;
    flow.client.forceOffline=false;
    const tells=findSceneObjectByName("RoomscriptTells").getComponent(RoomscriptTellVisual.getTypeName()) as RoomscriptTellVisual;
    const rows:unknown[]=[];
    for(const question of ["Where were you at 22:30?","What is your name?","Could a dragon juggle the moon?"]) {
      const before=flow.engine.snapshot().log.length;
      await flow.askFree(question);
      const result=flow.diagnostics(),actions=flow.engine.snapshot().log.slice(before);
      expect(result.last!==null).toBe(true);expect(result.last!.origin).toBe("model");
      expect(result.audioMs!==null&&result.audioMs<=6500).toBe(true);
      const raw=actions.findIndex(action=>action.type==="LlmOutput");
      const spoken=actions.findIndex(action=>action.type==="LineSpoken"&&action.mode!=="filler");
      expect(raw>=0&&spoken>raw).toBe(true);
      expect(tells.diagnostics().count).toBe(1);
      expect(tells.diagnostics().delayMs>=290&&tells.diagnostics().delayMs<450).toBe(true);
      rows.push({question,textMs:result.last!.latencyMs,audioMs:result.audioMs,rejections:result.last!.rejectionCount});
      console.log("LIVE_INTERROGATION_SAMPLE|"+JSON.stringify(rows[rows.length-1]));
      await sleep(200);
    }
    console.log("LIVE_INTERROGATION_SUMMARY|"+JSON.stringify(rows));
  }
}
