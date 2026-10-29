import {describe,expect,it} from "vitest";
import {fuzzPlayers,fuzzPlayersAsync,assertCurrentAccounts} from "../../scripts/fuzz-players";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";

describe("random player properties",()=>{
  it("runs 1000 deterministic fair players through real reducer actions",async()=>{
    const report=await fuzzPlayersAsync();
    expect(Object.values(report.terminations).reduce((a,b)=>a+b,0)).toBe(1000);
    expect(report.terminations.correct).toBeGreaterThan(0);
    expect(report.terminations.timeout).toBeGreaterThan(0);
    expect(report.actions).toBeGreaterThan(10000);
    expect(report.minRouteMinutes).toBeLessThanOrEqual(report.clockMinutes*0.6);
    expect(Object.keys(report.actionTypes).length).toBeGreaterThanOrEqual(10);
    expect(report.highestLayer).toBeGreaterThanOrEqual(2);
    console.info("1000-player proof",report);
  },180000);
  it("yields without changing the deterministic player report",async()=>expect(await fuzzPlayersAsync(createHeroCase(),30,42)).toEqual(fuzzPlayers(createHeroCase(),30,42)));
  it("repeats named random substreams exactly",()=>expect(fuzzPlayers(createHeroCase(),12,42)).toEqual(fuzzPlayers(createHeroCase(),12,42)));
  it("detects inherited topic contradictions instead of checking each rung alone",()=>{
    const g=createHeroCase();const s=g.cast.suspects[0].id;
    g.facts.push({id:"FUZZ_A",pred:"at",args:{who:s,zone:"Z1"},truth:false,slot:0},{id:"FUZZ_B",pred:"at",args:{who:s,zone:"Z2"},truth:false,slot:0});
    const template=g.statements.find(c=>c.speaker===s)!;
    g.statements.push({...template,id:"FUZZ_C0",topic:"inherited",layer:0,asserts:"FUZZ_A",replacementFor:undefined},{...template,id:"FUZZ_C1",topic:"new-topic",layer:1,asserts:"FUZZ_B",replacementFor:undefined});
    const state=createGameState(g);state.suspects[s].layer=1;
    expect(()=>assertCurrentAccounts(g,state)).toThrow("Contradictory current account");
  });
});
