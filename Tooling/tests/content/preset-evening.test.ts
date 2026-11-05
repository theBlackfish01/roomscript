import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {applyPresetEveningRoom,PRESET_EVENING_SUPPORTS,PRESET_EVENING_LAYOUT,PRESET_CONSOLE_TOP} from "../../../Assets/Scripts/Content/PresetEveningRoom";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {EVENING_ROOM_SCAN,EVENING_ROOM_FLOOR_Y} from "../../../Assets/Scripts/Content/EveningRoomScan";
import {verifyCase} from "../../../Assets/Scripts/Engine/case/Solver";
import {clockwiseRefuters,refuterMarks} from "../../../Assets/Scripts/Engine/game/CluePresentation";
import {replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {isHarlowPreset} from "../../../Assets/Scripts/Engine/game/NarrativeAudio";
import {Action,CaseGraph} from "../../../Assets/Scripts/Engine/core/Types";
import tape from "../../results/run4-b-hero-v3.json";

const stripLayout=(graph:CaseGraph)=>({...graph,caseId:"",room:{...graph.room,roomId:"",zones:graph.room.zones.map(z=>({...z,anchor:[]})),objects:graph.room.objects.map(o=>({...o,pos:[]}))}});
describe("recorded Evening Room Preset placement",()=>{
  it("changes only explicit layout identity and shared positions, never narrative truth",()=>{
    const base=createHeroCase(),snapshot=JSON.stringify(base),placed=applyPresetEveningRoom(base);
    expect(JSON.stringify(base)).toBe(snapshot);expect(stripLayout(placed)).toEqual(stripLayout(base));
    expect(placed.caseId).toBe(base.caseId+":"+PRESET_EVENING_LAYOUT);expect(placed.pitchHash).toBe(base.pitchHash);
    expect(isHarlowPreset(placed)).toBe(true);expect(applyPresetEveningRoom(placed)).toEqual(placed);
    expect(verifyCase(placed)).toEqual(verifyCase(base));
  });
  it("places every role on its measured support plane in the shared floor-local frame",()=>{
    const graph=applyPresetEveningRoom(createHeroCase());expect(EVENING_ROOM_FLOOR_Y).toBe(-176);
    for(const object of graph.room.objects){const support=PRESET_EVENING_SUPPORTS[object.id],surface=EVENING_ROOM_SCAN.objects.find(o=>o.id===support.surfaceId)!;
      expect(object.pos[1]+EVENING_ROOM_FLOOR_Y).toBeCloseTo((support.surfaceId==="SCAN_1"?PRESET_CONSOLE_TOP[1]:surface.pos[1])-176,6);
      expect(object.pos.every(Number.isFinite)).toBe(true);expect(support.offset[1]).toBe(0);
    }
    for(const id of ["O2","O9","O12","O7","O3","O5"])expect(["SCAN_1","SCAN_6","SCAN_7"]).toContain(PRESET_EVENING_SUPPORTS[id].surfaceId);
  });
  it("uses the measured console top instead of embedding props in its front face",()=>{
    const samples=JSON.parse(readFileSync(resolve("results/run7-console-support-hits.json"),"utf8"));
    const heights=samples.filter((sample:any)=>sample.hit?.normal[1]>.8).map((sample:any)=>sample.hit.position[1]).sort((a:number,b:number)=>a-b);
    expect(heights.length).toBeGreaterThanOrEqual(3);expect(PRESET_CONSOLE_TOP[1]+EVENING_ROOM_FLOOR_Y).toBeCloseTo(heights[Math.floor(heights.length/2)],5);
    const graph=applyPresetEveningRoom(createHeroCase()),front=EVENING_ROOM_SCAN.objects.find(o=>o.id==="SCAN_1")!;
    for(const id of ["O3","O5","O7","O9","O12"]){const prop=graph.room.objects.find(o=>o.id===id)!;expect(prop.pos[1]-front.pos[1]).toBeGreaterThan(7);expect(prop.pos[2]).toBeLessThan(front.pos[2]-10);}
    const recordPlayer=EVENING_ROOM_SCAN.objects.find(o=>o.label==="record player")!;
    expect(Math.abs(graph.room.objects.find(o=>o.id==="O7")!.pos[0]-recordPlayer.pos[0])).toBeGreaterThan(40);
  });
  it("uses bottom-origin GLBs with centimeter conversion exactly once",()=>{
    for(const name of ["BrassCandlestick","ChippedMug","DictationRecorder","EvidenceClock","LetterKnife","MarbleBookend"]){
      const bytes=readFileSync(resolve("../Assets/Art/Props",name+".glb")),doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
      const positions=doc.accessors.filter((a:any)=>a.type==="VEC3");expect(Math.min(...positions.map((a:any)=>a.min[1]))).toBeCloseTo(0,5);
      expect(readFileSync(resolve("../Assets/Art/Props",name+".glb.meta"),"utf8")).toContain("ConvertMetersToCentimeters: true");
    }
  });
  it("keeps all actor floor marks distinct and computes clockwise order from those exact marks",()=>{
    const graph=applyPresetEveningRoom(createHeroCase()),marks=refuterMarks(graph),actors=graph.cast.suspects.map(s=>marks[s.id]);
    for(let i=0;i<actors.length;i++){expect(actors[i][1]).toBe(0);for(let j=i+1;j<actors.length;j++)expect(Math.hypot(actors[i][0]-actors[j][0],actors[i][2]-actors[j][2])).toBeGreaterThan(85);}
    const action:Action={type:"SetupCase",origin:[0,0,0],forward:[0,0,-1],seq:1,by:"P1"};
    const state=replayGame(graph,[action]);expect(state.refuterOrder).toEqual(clockwiseRefuters(graph,action.origin,action.forward));
    expect(new Set(state.refuterOrder).size).toBe(graph.refutation.order.length);
  });
  it("replays historical nonspatial hero actions to the same truth and verdict with an explicit new layout identity",()=>{
    const base=createHeroCase(),graph=applyPresetEveningRoom(base),oldState=replayGame(base,tape.log as Action[]),state=replayGame(graph,tape.log as Action[]);
    expect(state.verdict).toBe("correct");expect({...state,caseId:oldState.caseId}).toEqual(oldState);
    expect(replayGame(graph,state.log)).toEqual(state);
  });
  it("replays newly captured SetupCase and action logs exactly on the new layout",()=>{
    const graph=applyPresetEveningRoom(createHeroCase()),actions:Action[]=[{type:"SetupCase",origin:[0,0,0],forward:[0,0,-1],seq:1,by:"P1"},...(tape.log as Action[]).map(a=>({...a,seq:a.seq+1}))];
    const state=replayGame(graph,actions);expect(state.verdict).toBe("correct");expect(replayGame(graph,state.log)).toEqual(state);
    expect(state.setupPose).not.toBeNull();expect(state.caseId.endsWith(":"+PRESET_EVENING_LAYOUT)).toBe(true);
  });
});
