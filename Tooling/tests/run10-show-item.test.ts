import {describe,expect,it} from "vitest";
import {createRun10HeroCase} from "../../Assets/Scripts/Content/Run10HeroCase";
import {ActionPayload} from "../../Assets/Scripts/Engine/core/Types";
import {createGameState} from "../../Assets/Scripts/Engine/game/GameState";
import {judgeObjection} from "../../Assets/Scripts/Engine/game/ObjectionJudge";
import {reduceGame} from "../../Assets/Scripts/Engine/game/Reducer";
import {showItemEvidence} from "../../Assets/Scripts/Engine/game/ShowItem";

function session(){
  const graph=createRun10HeroCase();let state=createGameState(graph);
  return {graph,get state(){return state;},act(payload:ActionPayload){state=reduceGame(graph,state,{...payload,seq:state.lastSeq+1,by:"show-test"});return state;}};
}

describe("Run 10 showing one physical item",()=>{
  it("uses the recorder's exact breaker despite its several collected observations",()=>{
    const s=session();s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});s.act({type:"PinchObject",object:"O11"});
    s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:showItemEvidence(s.graph,s.state,"S2","C_VALE_ALIBI_0","O11")});
    s.act({type:"PinchObject",object:"O12"});
    const all=s.graph.evidence.filter(e=>e.holder==="O12"&&s.state.knowledge.evidenceIds.includes(e.id)).map(e=>e.id);
    expect(all.length).toBeGreaterThan(1);
    expect(judgeObjection(s.graph,s.state,"S2","C_VALE_ALIBI_1",all).correct).toBe(false);
    const chosen=showItemEvidence(s.graph,s.state,"S2","C_VALE_ALIBI_1","O12");expect(chosen).toEqual(["E_RECORDING"]);
    const pips=s.state.pips;s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_1",evidence:chosen});
    expect(s.state.suspects.S2.layer).toBe(2);expect(s.state.pips).toBe(pips);
    expect(s.state.events.some(e=>e.type==="objectionCorrect"&&e.seq===s.state.lastSeq)).toBe(true);
  });
  it("shows the found kettle to break Vale's first account",()=>{
    const s=session();s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});s.act({type:"PinchObject",object:"O11"});
    const chosen=showItemEvidence(s.graph,s.state,"S2","C_VALE_ALIBI_0","O11");expect(chosen).toEqual(["E_KETTLE_COLD"]);
    expect(judgeObjection(s.graph,s.state,"S2","C_VALE_ALIBI_0",chosen).correct).toBe(true);
  });
  it("keeps a wrong item wrong and charges the normal Object cost",()=>{
    const s=session();s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});s.act({type:"PinchObject",object:"O1"});
    const chosen=showItemEvidence(s.graph,s.state,"S2","C_VALE_ALIBI_0","O1");expect(chosen).toEqual(["E_CABLE"]);
    const pips=s.state.pips;s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:chosen});
    expect(s.state.suspects.S2.layer).toBe(0);expect(s.state.pips).toBe(pips-1);
  });
  it("never invents uncollected evidence or treats a non-object holder as an item",()=>{
    const s=session();s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});
    expect(showItemEvidence(s.graph,s.state,"S2","C_VALE_ALIBI_0","O11")).toEqual([]);
    expect(showItemEvidence(s.graph,s.state,"S2","C_VALE_ALIBI_0","missing")).toEqual([]);
    s.state.knowledge.evidenceIds.push("fake");s.graph.evidence.push({...s.graph.evidence[0],id:"fake",holder:"S2"});
    expect(showItemEvidence(s.graph,s.state,"S2","C_VALE_ALIBI_0","S2")).toEqual([]);
  });
  it("selects the first complete authored breaker, without mutating its definition",()=>{
    const s=session();s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});s.act({type:"PinchObject",object:"O12"});
    const evidence=s.graph.evidence.filter(e=>e.holder==="O12"&&s.state.knowledge.evidenceIds.includes(e.id)).map(e=>e.id);
    const claim=s.graph.statements.find(c=>c.id==="C_VALE_ALIBI_0")!;
    claim.breakers=[["not-collected"],[evidence[1],evidence[0]],[evidence[0]]];
    const chosen=showItemEvidence(s.graph,s.state,"S2",claim.id,"O12");expect(chosen).toEqual([evidence[1],evidence[0]]);
    chosen.pop();expect(claim.breakers[1]).toHaveLength(2);
  });
  it("does not select a breaker for another speaker, an unheard claim or a superseded claim",()=>{
    const s=session();s.act({type:"PinchObject",object:"O12"});
    const evidence=s.graph.evidence.filter(e=>e.holder==="O12"&&s.state.knowledge.evidenceIds.includes(e.id)).map(e=>e.id);
    const claim=s.graph.statements.find(c=>c.id==="C_VALE_ALIBI_0")!;claim.breakers=[[evidence[1]]];
    expect(showItemEvidence(s.graph,s.state,"S2",claim.id,"O12")).toEqual([evidence[0]]);
    s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});
    expect(showItemEvidence(s.graph,s.state,"S1",claim.id,"O12")).toEqual([evidence[0]]);
    s.state.suspects.S2.layer=1;
    expect(showItemEvidence(s.graph,s.state,"S2",claim.id,"O12")).toEqual([evidence[0]]);
  });
});
