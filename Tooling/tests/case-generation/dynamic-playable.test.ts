import {describe,it,expect} from "vitest";
import {prepareDynamicCase} from "../../../Assets/Scripts/Content/DynamicCase";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {minimumCostRoute,solvePlayerKnowledge} from "../../../Assets/Scripts/Engine/case/Solver";
import {TerminalPlayer} from "../../scripts/play";
import {replayGame,reduceGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {buildFactSheet} from "../../../Assets/Scripts/Engine/perf/FactSheetBuilder";
import {lookupLine} from "../../../Assets/Scripts/Engine/perf/LineBank";
import {getCurrentStatements} from "../../../Assets/Scripts/Engine/game/Actions";
import {generatedLineBank} from "../../../Assets/Scripts/Engine/perf/GeneratedPerformance";

describe("generated case product boundary",()=>{
  for(const seed of [7,1041,2026])it("plays authored room seed "+seed+" to a replayable terminal verdict",()=>{
    const room=createHeroCase().room,before=JSON.stringify(room),result=prepareDynamicCase(seed,room);
    expect(result.ok,JSON.stringify(result)).toBe(true);expect(JSON.stringify(room)).toBe(before);
    const graph=result.graph!,player=new TerminalPlayer(graph),route=minimumCostRoute(graph);
    for(const ref of route.refs) {
      const evidence=graph.evidence.find(e=>e.id===ref),statement=graph.statements.find(s=>s.id===ref);
      if(evidence)player.execute("pinch "+evidence.holder);
      else if(statement)player.execute("chip "+statement.speaker+" "+statement.topic);
    }
    const possible=solvePlayerKnowledge(graph,player.state.knowledge).hypotheses;
    expect(possible).toHaveLength(1);expect(player.state.verdict).toBeNull();
    const h=possible[0],out=player.execute(`accuse ${h.who} ${h.where} ${h.what}`).lines.join("\n");
    expect(player.state.verdict).toBe("correct");expect(out).toContain(graph.cast.victim.name);
    expect(out).not.toContain("Vale: I killed Edmund Harlow");
    expect(replayGame(graph,player.state.log)).toEqual(player.state);
    for(const plan of result.phrasePlans)expect(plan.segments.map(s=>s.text).join("")).toBe(plan.text);
    for(const physical of room.objects.filter(o=>!o.virtual))expect([...graph.room.objects,...result.scenery!].find(o=>o.id===physical.id)?.pos).toEqual(physical.pos);
    expect(graph.room.zones).toHaveLength(3);expect(graph.room.objects.filter(o=>o.id.startsWith("REC_")).length).toBeLessThanOrEqual(3);
  });
  it("supports every current generated answer and pressure account, including same-layer corrections",()=>{
    const graph=prepareDynamicCase(7,createHeroCase().room).graph!,bank=generatedLineBank(graph);
    for(const person of graph.cast.suspects)for(let layer=0;layer<=2;layer++) {
      const state=createGameState(graph);state.suspects[person.id].layer=layer;
      for(const statement of getCurrentStatements(graph,person.id,layer)) {
        const sheet=buildFactSheet(graph,state,person.id);
        for(const mode of ["answer","press","broken"] as const)expect(lookupLine(bank,{suspect:person.id,topic:statement.topic,layer,mode},sheet,graph)?.line).toBe(statement.canonical);
      }
      for(const replacement of graph.statements.filter(s=>s.speaker===person.id&&s.replacementFor&&s.layer<=layer)) {
        state.suspects[person.id].topicOverrides[replacement.topic]=replacement.id;
        expect(lookupLine(bank,{suspect:person.id,topic:replacement.topic,layer,mode:"answer"},buildFactSheet(graph,state,person.id),graph)?.line).toBe(replacement.canonical);
      }
    }
  });
  it("rejects bad observed room data and never silently substitutes an authored room",()=>{
    const room=createHeroCase().room;room.objects[0].pos=[NaN,0,0];
    const result=prepareDynamicCase(7,room);expect(result.ok).toBe(false);expect(result.graph).toBeUndefined();
  });
  it("casts sparse living-room furniture as explicit fictional memories with <=3 fallback witnesses",()=>{
    const room=createHeroCase().room;
    const zones=room.zones.slice(0,3);
    const objects=[{id:"sofa",label:"sofa",type:"soft" as const,zone:zones[0].id,pos:[0,45,-150] as [number,number,number]},
      {id:"table",label:"coffee table",type:"heavy" as const,zone:zones[0].id,pos:[50,50,-150] as [number,number,number]},
      {id:"plant",label:"plant",type:"plant" as const,zone:zones[1].id,pos:[-100,50,-120] as [number,number,number]},
      {id:"lamp",label:"floor lamp",type:"light" as const,zone:zones[1].id,pos:[-130,140,-130] as [number,number,number]},
      {id:"door",label:"door",type:"door" as const,zone:zones[2].id,pos:[150,110,30] as [number,number,number]}];
    for(const seed of [7,1041,2026]) {
      const result=prepareDynamicCase(seed,{source:"simulated",zones,objects});expect(result.ok,JSON.stringify(result)).toBe(true);
      const graph=result.graph!;expect(graph.solver!.ok).toBe(true);expect(graph.solver!.minRouteMinutes).toBeGreaterThanOrEqual(60);
      expect(graph.room.objects.filter(o=>o.id.startsWith("REC_")).length).toBeLessThanOrEqual(3);
      expect(graph.room.objects.filter(o=>o.virtual).length).toBeLessThanOrEqual(3);
      expect(graph.evidence.some(e=>e.canonical.startsWith("A fictional memory"))).toBe(true);
      for(const evidence of graph.evidence.filter(e=>!e.latent)) {
        const fact=graph.facts.find(f=>f.id===evidence.proves[0])!,holder=graph.room.objects.find(o=>o.id===evidence.holder)!;
        if(fact.pred==="at"||fact.pred==="in")expect(holder.zone).toBe(fact.args.zone);
      }
    }
    expect(prepareDynamicCase(7,{source:"simulated",zones,objects:objects.slice(0,4)}).ok).toBe(false);
  });
  it("raw scan outputs remain audit-only and survive replay after setup",()=>{
    const graph=prepareDynamicCase(1041,createHeroCase().room).graph!;
    const setup=reduceGame(graph,createGameState(graph),{seq:1,by:"test",type:"SetupCase",origin:[0,0,0],forward:[0,0,-1]});
    const next=reduceGame(graph,setup,{seq:2,by:"test",type:"LlmOutput",key:"room-scan:one",occurrence:0,source:"live",response:{content:'{"culprit":"S1","objects":[]}',model:"vision-test"},latencyMs:42,at:100});
    expect(next.knowledge).toEqual(setup.knowledge);expect(next.events).toEqual(setup.events);expect(next.verdict).toBeNull();
    expect(replayGame(graph,next.log)).toEqual(next);
  });
  it("uses furniture memories without inventing generic sensing props or borrowing a sofa",()=>{
    const zones=createHeroCase().room.zones.slice(0,3);
    const objects=zones.flatMap((zone,i)=>[
      {id:"table"+i,label:"side table "+i,type:"heavy" as const,zone:zone.id,pos:[zone.anchor[0],50,zone.anchor[2]] as [number,number,number]},
      {id:"seat"+i,label:"armchair "+i,type:"soft" as const,zone:zone.id,pos:[zone.anchor[0]+50,45,zone.anchor[2]] as [number,number,number]}]);
    const result=prepareDynamicCase(7,{source:"simulated",zones,objects});
    expect(result.ok,JSON.stringify(result)).toBe(true);
    const graph=result.graph!;
    expect(graph.room.objects.filter(o=>o.virtual)).toHaveLength(0);
    expect(graph.compilerVersion).toBe("roomscript-compiler-3-memory");
    expect(graph.statements.filter(s=>s.topic==="borrowed_item").every(s=>!s.canonical.includes("borrow"))).toBe(true);
    expect(graph.statements.some(s=>s.canonical.startsWith("I touched the armchair"))).toBe(true);
    expect(graph.solver!.ok).toBe(true);expect(graph.solver!.minRouteMinutes).toBeGreaterThanOrEqual(60);
  });
});
