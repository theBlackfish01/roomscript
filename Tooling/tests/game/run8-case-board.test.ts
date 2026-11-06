import {it,expect,describe} from "vitest";
import tape from "../../results/run4-b-hero-v3.json";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {caseBoardLayout,BoardItem,BOARD_LABEL_MAX} from "../../../Assets/Scripts/Engine/perf/CaseBoardLayout";
import {Action,CaseGraph} from "../../../Assets/Scripts/Engine/core/Types";

const log=tape.log as Action[];
function sound(board:ReturnType<typeof caseBoardLayout>):void {
  const items=board.items,ids=new Set(items.map(i=>i.id));expect(ids.size).toBe(items.length);
  const overlap=(a:BoardItem,b:BoardItem)=>Math.abs(a.x-b.x)<(a.w+b.w)/2-1e-6&&Math.abs(a.y-b.y)<(a.h+b.h)/2-1e-6;
  for(let i=0;i<items.length;i++){
    const a=items[i];expect(a.w).toBeGreaterThan(0);expect(a.h).toBeGreaterThan(0);expect(a.label.length).toBeLessThanOrEqual(BOARD_LABEL_MAX);expect(a.label.length).toBeGreaterThan(0);
    expect(Math.abs(a.x)+a.w/2).toBeLessThanOrEqual(board.width/2+1e-6);expect(Math.abs(a.y)+a.h/2).toBeLessThanOrEqual(board.height/2+1e-6);
    for(let j=i+1;j<items.length;j++)expect(overlap(a,items[j]),a.id+" overlaps "+items[j].id).toBe(false);
  }
  for(const s of board.strings){expect(ids.has(s.from)).toBe(true);expect(ids.has(s.to)).toBe(true);expect(s.from).not.toBe(s.to);}
}
it("starts with WHO, WHERE and WITH WHAT rows only, nothing crossed, no strings",()=>{
  const graph=createHeroCase(),board=caseBoardLayout(graph,createGameState(graph));
  expect(board.width).toBe(120);expect(board.height).toBe(80);
  expect(board.items.map(i=>i.kind)).toEqual([...Array(4).fill("suspect"),...Array(5).fill("zone"),...Array(5).fill("weapon")]);
  expect(board.items.some(i=>i.crossed)).toBe(false);expect(board.strings).toEqual([]);
  expect(board.items.filter(i=>i.kind==="weapon").map(i=>i.label)).toEqual(["charger cable","candlestick","letter knife","bottle","marble bookend"]);
  expect(board.items.find(i=>i.id==="who:S2")!.label).toBe("M. Vale");
  const who=board.items.find(i=>i.id==="who:S1")!,where=board.items.find(i=>i.id==="where:Z1")!;expect(who.y).toBeGreaterThan(where.y);
  sound(board);
});
it("after the hero tape: crossed per grid, a photo per collected clue, a stamp, strings from the web, no overlaps",()=>{
  const graph=createHeroCase(),state=replayGame(graph,log),board=caseBoardLayout(graph,state);
  for(const item of board.items){
    const [prefix,id]=item.id.split(":");
    if(prefix==="who")expect(item.crossed).toBe(state.grid.suspects.includes(id));
    if(prefix==="where")expect(item.crossed).toBe(state.grid.zones.includes(id));
    if(prefix==="what")expect(item.crossed).toBe(state.grid.weapons.includes(id));
  }
  expect(board.items.filter(i=>i.kind==="photo").map(i=>i.id.slice(6)).sort()).toEqual(state.knowledge.evidenceIds.slice().sort());
  expect(board.items.find(i=>i.kind==="stamp")!.label).toBe("CASE CLOSED");
  expect(board.strings.length).toBeGreaterThan(0);
  expect(board.strings).toContainEqual({from:"who:S2",to:"photo:E_KETTLE_COLD",kind:"objection"});
  expect(board.strings).toContainEqual({from:"who:S2",to:"what:O1",kind:"proof"});
  sound(board);
  sound(caseBoardLayout(graph,state,{width:90,height:60}));sound(caseBoardLayout(graph,state,{width:60,height:100}));
});
it("is sound at every step and never reads the sealed envelope before the verdict",()=>{
  const graph=createHeroCase(),decoy=JSON.parse(JSON.stringify(graph)) as CaseGraph;decoy.envelope={who:"S3",where:"Z4",what:"O4"};
  let a=createGameState(graph),b=createGameState(decoy);
  for(const action of log.filter(x=>x.type!=="Accuse")){
    a=reduceGame(graph,a,action);b=reduceGame(decoy,b,action);
    const board=caseBoardLayout(graph,a);sound(board);expect(caseBoardLayout(decoy,b)).toEqual(board);
  }
});

import {verdictStampText} from "../../../Assets/Scripts/Engine/perf/CaseBoardLayout";
describe("Run 9 board stamp text",()=>{
  it("only a correct verdict says CASE CLOSED",()=>{
    expect(verdictStampText("correct")).toBe("CASE CLOSED");
    expect(verdictStampText("wrong")).toBe("WRONG CALL");
    expect(verdictStampText("timeout")).toBe("CASE COLD");
  });
});
