import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {replayGame} from "./Engine/game/Reducer";
/** Runs the real engine inside Lens and verifies state isolation and replay. */
@component export class RoomscriptEngineLeafScenario extends Scenario {
  async run():Promise<void> { await enterCase();
    await sleep(1500);const bridge=findSceneObjectByName("RoomscriptEngine").getComponent(RoomscriptEngineBridge.getTypeName()) as RoomscriptEngineBridge;
    expect(bridge.caseGraph().solver.ok).toBe(true);expect(bridge.caseGraph().solver.hypotheses.length).toBe(1);
    const before=bridge.snapshot();const after=bridge.dispatch({type:"Ask",suspect:"S2",topic:"where@22:30"});
    expect(after.elapsedMinutes-before.elapsedMinutes).toBe(5);expect(after.knowledge.factIds.indexOf("X_VALE_KITCHEN")).toBe(-1);
    expect(JSON.stringify(replayGame(bridge.caseGraph(),after.log))).toBe(JSON.stringify(after));
    expect(Object.isFrozen(after)).toBe(true);expect(bridge.snapshot()===after).toBe(true);expect(Object.isFrozen(bridge.graphRef().facts)).toBe(true);const copy=bridge.caseGraph();copy.caseId="mutated";expect(bridge.graphRef().caseId==="mutated").toBe(false);
  }
}
