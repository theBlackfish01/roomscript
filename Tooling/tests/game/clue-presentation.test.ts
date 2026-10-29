import {describe,it,expect} from "vitest";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {createGameState} from "../../../Assets/Scripts/Engine/game/GameState";
import {reduceGame,replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {clockwiseAngle,clockwiseRefuters,refuterMarks,notebookPages,privateRefutation} from "../../../Assets/Scripts/Engine/game/CluePresentation";
describe("Clue presentation boundaries",()=>{
  it("orders every refuter clockwise from setup facing and keeps ties stable",()=>{const graph=createHeroCase(),origin:[number,number,number]=[0,0,0],forward:[number,number,number]=[0,0,-1],marks=refuterMarks(graph),order=clockwiseRefuters(graph,origin,forward);
    expect(new Set(order).size).toBe(graph.refutation.order.length);const angles=order.map(id=>clockwiseAngle(origin,forward,marks[id]));expect(angles).toEqual(angles.slice().sort((a,b)=>a-b));expect(clockwiseRefuters(graph,origin,[0,0,1])).not.toEqual(order);expect(marks.S2).toEqual([180,0,-195]);});
  it("shows no secret exclusions or tell labels before observation",()=>{const graph=createHeroCase(),state=createGameState(graph),pages=notebookPages(graph,state);expect(pages.grid.every(page=>!page.includes("X "))).toBe(true);expect(pages.statements).toEqual([]);
    const asked=reduceGame(graph,state,{seq:1,by:"P1",type:"Ask",suspect:"S2",topic:"where@22:30"});expect(notebookPages(graph,asked).statements[0]).toContain("TELL NOTED");expect(notebookPages(graph,asked).grid.every(page=>!page.includes("X "))).toBe(true);});
  it("reveals only the engine's observed private card to its recipient and replays setup order",()=>{const graph=createHeroCase();graph.refutation.order=clockwiseRefuters(graph,[0,0,0],[0,0,-1]);const state=reduceGame(graph,createGameState(graph),{seq:1,by:"P1",type:"Suggest",who:"S1",where:"Z1",what:"O1"});
    expect(state.elapsedMinutes).toBe(15);expect(privateRefutation(graph,state,1,"P1")?.holder).toBe("O8");expect(privateRefutation(graph,state,1,"P2")).toBeNull();expect(privateRefutation(graph,state,2,"P1")).toBeNull();expect(replayGame(graph,state.log)).toEqual(state);
    state.knowledge.factIds=[];expect(privateRefutation(graph,state,1,"P1")).toBeNull();});
  it("does not manufacture a refutation for the surviving hypothesis",()=>{const graph=createHeroCase(),state=reduceGame(graph,createGameState(graph),{seq:1,by:"P1",type:"Suggest",...graph.envelope});expect(privateRefutation(graph,state,1,"P1")).toBeNull();expect(state.events.some(e=>e.type==="breathesIn")).toBe(true);});
  it("crosses off a suspect only after the observed facts establish an incompatible murder location",()=>{const graph=createHeroCase(),state=reduceGame(graph,createGameState(graph),{seq:1,by:"P1",type:"Suggest",who:"S1",where:"Z1",what:"O1"});expect(notebookPages(graph,state).grid[0]).toContain("? Imran");const located=reduceGame(graph,state,{seq:2,by:"P1",type:"PinchObject",object:"O6"});expect(notebookPages(graph,located).grid[0]).toContain("X Imran");});
});
