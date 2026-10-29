import {enterCase} from "./RoomscriptLeafSetup";
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {RoomscriptSuspectActor} from "./RoomscriptSuspectActor";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
/** Engine-driven puppet regression, including audio-envelope response and grounded placement. */
@component export class RoomscriptActorLeafScenario extends Scenario {
  async run():Promise<void> { await enterCase();
    await sleep(1500);
    const object=findSceneObjectByName("RoomscriptSuspectSlot");
    const actor=object.getComponent(RoomscriptSuspectActor.getTypeName()) as RoomscriptSuspectActor;
    const engine=findSceneObjectByName("RoomscriptEngine").getComponent(RoomscriptEngineBridge.getTypeName()) as RoomscriptEngineBridge;
    expect(actor.diagnostics().pose).toBe("neutral");actor.setListening(true);expect(actor.diagnostics().pose).toBe("listening");
    actor.setAudioAmplitude(0.8);await sleep(250);expect(actor.diagnostics().jaw).toBeGreaterThan(0.6);
    actor.setAudioAmplitude(0);await sleep(300);expect(actor.diagnostics().jaw).toBeLessThan(0.1);
    engine.dispatch({type:"Ask",suspect:"S2",topic:"where@22:30"});engine.dispatch({type:"PinchObject",object:"O11"});
    engine.dispatch({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});
    expect(actor.diagnostics().pose).toBe("rattled");expect(actor.diagnostics().stress).toBeGreaterThan(0);
    expect(object.getTransform().getWorldPosition().y).toBe(-160);
    const state=engine.snapshot();state.suspects.S2.layer=2;actor.applyState(state);expect(actor.diagnostics().pose).toBe("broken");
    await sleep(10000);actor.applyState(engine.snapshot());
  }
}
