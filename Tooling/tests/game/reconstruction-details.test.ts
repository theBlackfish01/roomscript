import {it,expect} from "vitest";
import {reconstructionDetails} from "../../../Assets/Scripts/Engine/game/ReconstructionDetails";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {Action} from "../../../Assets/Scripts/Engine/core/Types";
import tape from "../../results/run4-b-hero-v3.json";
it("returns no dial, rejected slip or ledger before a final verdict, including timeout",()=>{
  const graph=createHeroCase(),state=createGameState(graph);for(const verdict of [null,"timeout"] as const)for(const kind of ["claims","correction","freeze","ledger"] as const)expect(reconstructionDetails(graph,{...state,verdict},kind)).toBeUndefined();
});
it("distinguishes murder time from discovery and copies only engine claim locations",()=>{
  const graph=createHeroCase(),state=reduceGame(graph,createGameState(graph),{type:"Accuse",...graph.envelope,seq:1,by:"P1"});
  const freeze=reconstructionDetails(graph,state,"freeze")!,resume=reconstructionDetails(graph,state,"resume")!;
  expect(freeze.time).toBe("22:30");expect(resume.time).toBe("22:41");expect(freeze.minuteRadians).toBeCloseTo(Math.PI);
  expect(freeze.hourRadians).toBeCloseTo(Math.PI*2*10.5/12);expect(resume.minuteRadians).toBeCloseTo(Math.PI*2*41/60);
  for(const slip of freeze.slips){const fact=graph.facts.find(f=>f.id===slip.factId)!;expect(fact.truth).toBe(false);expect(fact.args.who).toBe(slip.suspect);expect(slip.label).toBe("SAID: "+graph.room.zones.find(z=>z.id===fact.args.zone)!.clueName);}
});
it("labels only actually filed deductions and does not fabricate support for unfiled proof",()=>{
  const graph=createHeroCase(),empty=reduceGame(graph,createGameState(graph),{type:"Accuse",...graph.envelope,seq:1,by:"P1"});
  expect(reconstructionDetails(graph,empty,"ledger")!.ledger.every(row=>!row.filed&&!row.refs.length)).toBe(true);
  const state=replayGame(graph,tape.log as Action[]),before=JSON.stringify(state),detail=reconstructionDetails(graph,state,"ledger")!;
  expect(detail.ledger).toHaveLength(4);for(const row of detail.ledger){expect(row.filed).toBe(true);expect(row.refs).toEqual(state.arguments.find(a=>a.deduction===row.deduction)!.refs);}
  detail.ledger[0].refs.push("bogus");expect(JSON.stringify(state)).toBe(before);
});
