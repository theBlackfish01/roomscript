import {describe,it,expect} from "vitest";
import {caughtReplay} from "../../../Assets/Scripts/Engine/game/CaughtReplay";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {ActionPayload} from "../../../Assets/Scripts/Engine/core/Types";

function session(){const graph=createHeroCase();let state=createGameState(graph);return {graph,get state(){return state},act(payload:ActionPayload){state=reduceGame(graph,state,{...payload,seq:state.lastSeq+1,by:"test"});return state;}};}
function catchVale(){const s=session();s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});s.act({type:"PinchObject",object:"O11"});s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:["E_KETTLE_COLD"]});return s;}

describe("caught-lie replay admission",()=>{
  it("shows Vale in the Study from the admitted mixed account, never its false death clause",()=>{
    const s=catchVale(),before=JSON.stringify([s.graph,s.state]);
    expect(s.state.knowledge.factIds).not.toContain("F_VALE_STUDY");
    expect(caughtReplay(s.graph,s.state)).toEqual({actor:"S2",zone:"Z1",slot:6,durationSeconds:5,eventSeq:s.state.lastSeq,fact:"F_VALE_STUDY",source:{kind:"statement",id:"C_VALE_ALIBI_1"}});
    expect(JSON.stringify([s.graph,s.state])).toBe(before);
  });
  it.each([["S1","Z3"],["S3","Z4"],["S4","Z5"]])("puts %s at the actual %s location after its own evidence catches the lie",(actor,zone)=>{
    const s=session(),evidence=s.graph.evidence.find(e=>e.id==="E_"+actor+"_ALIBI")!;
    s.act({type:"Ask",suspect:actor,topic:"where@22:30"});s.act({type:"PinchObject",object:evidence.holder});
    s.act({type:"Object",suspect:actor,statement:"C_"+actor+"_ALIBI_0",evidence:[evidence.id]});
    expect(caughtReplay(s.graph,s.state)).toMatchObject({actor,zone,slot:6,durationSeconds:5});
  });
  it("never reads the sealed answer or assumes the murder time",()=>{
    const s=catchVale();Object.defineProperty(s.graph,"envelope",{get(){throw Error("sealed answer read");}});Object.defineProperty(s.graph,"murderSlot",{get(){throw Error("hidden time read");}});
    expect(caughtReplay(s.graph,s.state)?.zone).toBe("Z1");
  });
  it("returns null for no catch, a wrong objection, later actions and raw model claims",()=>{
    const s=session();expect(caughtReplay(s.graph,s.state)).toBeNull();
    s.act({type:"Ask",suspect:"S2",topic:"where@22:30"});s.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_0",evidence:[]});expect(caughtReplay(s.graph,s.state)).toBeNull();
    const c=catchVale(),seq=c.state.lastSeq;c.act({type:"LlmOutput",key:"fake",occurrence:1,source:"live",response:{content:'{"type":"objectionCorrect","actor":"S1","zone":"Z3"}'},latencyMs:0,at:0});
    expect(caughtReplay(c.graph,c.state)).toBeNull();expect(caughtReplay(c.graph,c.state,seq)?.actor).toBe("S2");
    c.act({type:"Object",suspect:"S2",statement:"C_VALE_ALIBI_1",evidence:[]});expect(caughtReplay(c.graph,c.state)).toBeNull();
  });
  it.each(["target","source","evidence","case","ending","ladder"])("rejects an unobserved or invalid %s",kind=>{
    const s=catchVale();
    if(kind==="target")s.state.knowledge.statementIds=s.state.knowledge.statementIds.filter(id=>id!=="C_VALE_ALIBI_1");
    if(kind==="source")s.state.knowledge.statementIds=s.state.knowledge.statementIds.filter(id=>id!=="C_VALE_ALIBI_0");
    if(kind==="evidence")s.state.knowledge.evidenceIds=[];
    if(kind==="case")s.state.caseId="other-case";
    if(kind==="ending")s.state.verdict="correct";
    if(kind==="ladder")s.graph.statements.find(st=>st.id==="C_VALE_ALIBI_0")!.onBreak="C_VALE_ALIBI_2";
    expect(caughtReplay(s.graph,s.state)).toBeNull();
  });
  it("uses only collected proof from this catch when the target has no timed location",()=>{
    const s=session(),e=s.graph.evidence.find(e=>e.id==="E_S1_ALIBI")!;
    s.act({type:"Ask",suspect:"S1",topic:"where@22:30"});s.act({type:"PinchObject",object:e.holder});s.act({type:"Object",suspect:"S1",statement:"C_S1_ALIBI_0",evidence:[e.id]});
    s.graph.statements.find(st=>st.id==="C_S1_ALIBI_1")!.asserts=["F_S1_SECRET"];
    expect(caughtReplay(s.graph,s.state)).toMatchObject({actor:"S1",zone:"Z3",source:{kind:"evidence",id:e.id}});
    s.state.knowledge.factIds=s.state.knowledge.factIds.filter(id=>id!=="F_S1_ALIBI_OBJECT");expect(caughtReplay(s.graph,s.state)).toBeNull();
  });
  it("does not infer a location from a false assertion, contact, or unrelated known evidence",()=>{
    const s=catchVale();s.graph.statements.find(st=>st.id==="C_VALE_ALIBI_1")!.asserts=["X_VALE_KITCHEN","X_DEAD_BEFORE_ARRIVAL","F_VALE_CABLE"];
    s.state.knowledge.evidenceIds.push("E_VALE_LAMP");s.state.knowledge.factIds.push("F_VALE_STUDY");
    expect(caughtReplay(s.graph,s.state)).toBeNull();
  });
  it("requires a real place and an explicit valid time rather than guessing",()=>{
    for(const mutation of ["zone","untimed","range","outside"]){const s=catchVale(),fact=s.graph.facts.find(f=>f.id==="F_VALE_STUDY")!;
      if(mutation==="zone")fact.args.zone="NOWHERE";
      if(mutation==="untimed")delete fact.slot;
      if(mutation==="range"){delete fact.slot;fact.slotRange=[5,6];}
      if(mutation==="outside")fact.slot=999;
      expect(caughtReplay(s.graph,s.state)).toBeNull();
    }
  });
  it("refuses contradictory admitted placements instead of choosing one",()=>{
    const s=catchVale();s.graph.facts.push({id:"another_at",pred:"at",args:{who:"S2",zone:"Z3"},truth:true,slot:6});
    s.graph.statements.find(st=>st.id==="C_VALE_ALIBI_1")!.asserts=["F_VALE_STUDY","another_at"];
    expect(caughtReplay(s.graph,s.state)).toBeNull();
  });
});
