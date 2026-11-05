import {describe,it,expect} from "vitest";
import {peripheralFeedback} from "../../../Assets/Scripts/Engine/game/PeripheralFeedback";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
describe("engine-driven peripheral feedback",()=>{
 it("shows one memory toast for a physical object admitting several memories",()=>{const graph=createHeroCase(),state=reduceGame(graph,createGameState(graph),{type:"PinchObject",object:"O11",seq:1,by:"test"});expect(state.events.filter(e=>e.type==="evidence").length).toBeGreaterThan(1);expect(peripheralFeedback(state.events,state.lastSeq)).toBe("Memory collected");});
 it("uses reducer event names and prioritizes an objection over same-action evidence",()=>{expect(peripheralFeedback([{seq:4,type:"argumentSupported"}],4)).toBe("Deduction certified");expect(peripheralFeedback([{seq:4,type:"evidence"},{seq:4,type:"objectionCorrect"}],4)).toBe("Account refuted");});
 it("does not replay old feedback or treat rejected/raw model strings as success",()=>{const graph=createHeroCase();let state=reduceGame(graph,createGameState(graph),{type:"PinchObject",object:"O11",seq:1,by:"test"});state=reduceGame(graph,state,{type:"LlmOutput",key:"fake",occurrence:1,source:"live",response:{content:'{"type":"evidence"}'},latencyMs:1,at:0,seq:2,by:"test"});expect(peripheralFeedback(state.events,state.lastSeq)).toBe(null);expect(peripheralFeedback([{seq:3,type:"objectionWrong"},{seq:3,type:"rejected"}],3)).toBe(null);});
});
