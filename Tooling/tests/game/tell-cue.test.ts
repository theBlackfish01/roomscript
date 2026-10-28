import {describe,it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {tellCue} from "../../../Assets/Scripts/Engine/game/TellCue";
import {ActionPayload,AnswerMode} from "../../../Assets/Scripts/Engine/core/Types";
const session=()=>{const graph=createHeroCase();let state=createGameState(graph);return {graph,get state(){return state;},act(action:ActionPayload){state=reduceGame(graph,state,{...action,seq:state.lastSeq+1,by:"P1"});return state.lastSeq;}};};
describe("engine tell cues",()=>{
  it("targets the authored object 300ms after an admitted lie",()=>{const s=session(),seq=s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});expect(tellCue(s.graph,s.state,seq,"S2","answer")).toMatchObject({targetObject:"O11",prop:"brooch",delayMs:300});});
  it.each(["deflect","lawyered","filler","confession"] as AnswerMode[])("does not fire on %s even when a previous lie exists",mode=>{const s=session(),seq=s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});expect(tellCue(s.graph,s.state,seq,"S2",mode)).toBeNull();});
  it("requires the current action, suspect and statement",()=>{const s=session(),seq=s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});expect(tellCue(s.graph,s.state,seq+1,"S2","answer")).toBeNull();expect(tellCue(s.graph,s.state,seq,"S1","answer")).toBeNull();s.act({type:"Ask",suspect:"S2",topic:"baseline:name"});expect(tellCue(s.graph,s.state,seq,"S2","answer")).toBeNull();});
  it("covers all suspect baselines and keeps their truthful baselines quiet",()=>{const s=session();for(const person of s.graph.cast.suspects){let seq=s.act({type:"Ask",suspect:person.id,topic:person.baseline.truthTopic});expect(tellCue(s.graph,s.state,seq,person.id,"answer")).toBeNull();seq=s.act({type:"Ask",suspect:person.id,topic:person.baseline.lieTopic});expect(tellCue(s.graph,s.state,seq,person.id,"answer")?.prop).toBe(person.tellProp);}});
  it("switches target on the next cover and stops at the truthful layer",()=>{const s=session();s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});s.act({type:"PinchObject",object:"O11"});let seq=s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});expect(tellCue(s.graph,s.state,seq,"S2","broken")?.targetObject).toBe("O12");s.act({type:"PinchObject",object:"O12"});seq=s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_1",evidence:["E_RECORDING"]});expect(tellCue(s.graph,s.state,seq,"S2","broken")).toBeNull();});
});
