import {describe,it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame,performanceMode} from "../../../Assets/Scripts/Engine/game/Reducer";
import {ActionPayload} from "../../../Assets/Scripts/Engine/core/Types";
import {buildKnowledgeBrief,answerWren,admitWrenChoice} from "../../../Assets/Scripts/Engine/game/WrenKnowledge";
import {routeSample,routeReplay} from "../../../Assets/Scripts/Engine/game/RouteReplay";

describe("knowledge-only Wren",()=>{
  it("reveals no hidden case data, even if the envelope/unknown facts/secret strings change",()=>{
    const graph=createHeroCase(),knowledge=createGameState(graph).knowledge;
    const a=buildKnowledgeBrief(graph,knowledge);graph.envelope.who="different";graph.cast.suspects.forEach(s=>s.secret="HIDDEN SECRET");graph.facts.forEach(f=>f.canonical="HIDDEN TRUTH");
    expect(buildKnowledgeBrief(graph,knowledge)).toEqual(a);expect(JSON.stringify(a)).not.toMatch(/HIDDEN|forged|culprit|cable|Harlow/);
    expect(answerWren(a,"who killed Harlow?").id).toBe("guide:unknown");
  });
  it("attributes heard cover accounts without certifying them and only cites admitted facts",()=>{
    const graph=createHeroCase();let state=createGameState(graph);
    state=reduceGame(graph,state,{seq:1,by:"test",type:"Ask",suspect:"S2",topic:"where@22:30"});
    let brief=buildKnowledgeBrief(graph,state.knowledge);expect(brief.accountCount).toBe(1);expect(brief.options.find(o=>o.kind==="account")?.text.startsWith(graph.cast.suspects.find(s=>s.id==="S2")!.name+" said:")).toBe(true);
    expect(brief.options.find(o=>o.kind==="account")?.factIds).toEqual([]);
    state=reduceGame(graph,state,{seq:2,by:"test",type:"PinchObject",object:"O11"});
    brief=buildKnowledgeBrief(graph,state.knowledge);
    for(const option of brief.options)expect(option.factIds.every(id=>state.knowledge.factIds.includes(id))).toBe(true);
    const kettle=answerWren(brief,"what about the kettle?");expect(kettle.kind).toBe("fact");expect(kettle.text).toContain("kettle");
    expect(admitWrenChoice(brief,{optionId:kettle.id,text:"invented confession"})).toBeUndefined();
    const next=reduceGame(graph,state,{seq:3,by:"test",type:"WrenSpoken",key:"one",optionId:kettle.id});
    expect(next.events.at(-1)?.text).toBe(kettle.text);expect(next.knowledge).toEqual(state.knowledge);expect(next.elapsedMinutes).toBe(state.elapsedMinutes);expect(replayGame(graph,next.log)).toEqual(next);
    const bad=reduceGame(graph,next,{seq:4,by:"test",type:"WrenSpoken",key:"two",optionId:"fact:F_VALE_MOTIVE"});expect(bad.events.at(-1)?.text).toBe("unknown_wren_option");
  });
});

describe("route replay",()=>{
  it("samples once a second, excludes teleport distance, counts repeat inspections and replays exactly",()=>{
    const graph=createHeroCase();let state=createGameState(graph);
    const send=(payload:ActionPayload)=>{state=reduceGame(graph,state,{...payload,seq:state.lastSeq+1,by:"test"});};
    expect(routeSample(state,[0,170,0],0)).toBeUndefined();send({type:"SetupCase",origin:[0,0,0],forward:[0,0,-1]});
    for(const [position,atMs] of [[[0,170,0],0],[[0,175,-100],1000],[[100,170,-100],2000],[[5000,170,0],3000]] as Array<[[number,number,number],number]>)send(routeSample(state,position,atMs)!);
    expect(routeSample(state,[5001,170,0],3500)).toBeUndefined();
    expect(routeSample(state,[NaN,170,0],4000)).toBeUndefined();
    send({type:"PinchObject",object:"O11"});send({type:"PinchObject",object:"O11"});send({type:"PinchObject",object:"unknown"});
    const route=routeReplay(state);expect(route.distanceMeters).toBe(2);expect(route.segments).toHaveLength(2);expect(route.inspections.O11).toBe(2);expect(route.inspections.unknown).toBeUndefined();
    expect(replayGame(graph,state.log)).toEqual(state);
  });
  it("movement/Wren cannot change a pending performance mode or advance gameplay",()=>{
    const graph=createHeroCase();let state=createGameState(graph);
    state=reduceGame(graph,state,{seq:1,by:"test",type:"SetupCase",origin:[0,0,0],forward:[0,0,-1]});
    state=reduceGame(graph,state,{seq:2,by:"test",type:"Ask",suspect:"S2",topic:"where@22:30"});
    const next=reduceGame(graph,state,{seq:3,by:"test",type:"PlayerMoved",position:[0,170,-10],atMs:1000});
    expect(next.elapsedMinutes).toBe(state.elapsedMinutes);expect(next.grid).toEqual(state.grid);expect(next.knowledge).toEqual(state.knowledge);expect(next.beatsFired).toEqual(state.beatsFired);
    expect(performanceMode(graph,next,"S2","where@22:30")).toBe(performanceMode(graph,state,"S2","where@22:30"));
  });
});
