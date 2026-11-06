import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {applyPresetEveningRoom,PRESET_EVENING_SUPPORTS,PRESET_EVENING_LAYOUT,PRESET_CONSOLE_TOP,PRESET_EVENING_V3,PRESET_DOOR_LATCH,PRESET_WINDOW_POINT,PRESET_TABLE,PRESET_SOFA,PRESET_CONSOLE,PRESET_CONSOLE_FIXTURES} from "../../../Assets/Scripts/Content/PresetEveningRoom";
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
  it("v2 (historical) places every role on its measured support plane in the shared floor-local frame",()=>{
    const graph=applyPresetEveningRoom(createHeroCase(),{layout:"evening-v2"});expect(graph.room.roomId.endsWith(":evening-v2")).toBe(true);expect(EVENING_ROOM_FLOOR_Y).toBe(-176);
    for(const object of graph.room.objects){const support=PRESET_EVENING_SUPPORTS[object.id],surface=EVENING_ROOM_SCAN.objects.find(o=>o.id===support.surfaceId)!;
      expect(object.pos[1]+EVENING_ROOM_FLOOR_Y).toBeCloseTo((support.surfaceId==="SCAN_1"?PRESET_CONSOLE_TOP[1]:surface.pos[1])-176,6);
      expect(object.pos.every(Number.isFinite)).toBe(true);expect(support.offset[1]).toBe(0);
    }
    for(const id of ["O2","O9","O12","O7","O3","O5"])expect(["SCAN_1","SCAN_6","SCAN_7"]).toContain(PRESET_EVENING_SUPPORTS[id].surfaceId);
  });
  it("v2 uses the measured console top instead of embedding props in its front face",()=>{
    const samples=JSON.parse(readFileSync(resolve("results/run7-console-support-hits.json"),"utf8"));
    const heights=samples.filter((sample:any)=>sample.hit?.normal[1]>.8).map((sample:any)=>sample.hit.position[1]).sort((a:number,b:number)=>a-b);
    expect(heights.length).toBeGreaterThanOrEqual(3);expect(PRESET_CONSOLE_TOP[1]+EVENING_ROOM_FLOOR_Y).toBeCloseTo(heights[Math.floor(heights.length/2)],5);
    const graph=applyPresetEveningRoom(createHeroCase(),{layout:"evening-v2"}),front=EVENING_ROOM_SCAN.objects.find(o=>o.id==="SCAN_1")!;
    for(const id of ["O3","O5","O7","O9","O12"]){const prop=graph.room.objects.find(o=>o.id===id)!;expect(prop.pos[1]-front.pos[1]).toBeGreaterThan(7);expect(prop.pos[2]).toBeLessThan(front.pos[2]-10);}
    const recordPlayer=EVENING_ROOM_SCAN.objects.find(o=>o.label==="record player")!;
    expect(Math.abs(graph.room.objects.find(o=>o.id==="O7")!.pos[0]-recordPlayer.pos[0])).toBeGreaterThan(40);
  });
  it("v3 is the current layout; v2 and v3 differ only in positions and layout identity",()=>{
    expect(PRESET_EVENING_LAYOUT).toBe("evening-v3");
    const base=createHeroCase(),v2=applyPresetEveningRoom(base,{layout:"evening-v2"}),v3=applyPresetEveningRoom(base);
    expect(v3.caseId).toBe(base.caseId+":evening-v3");expect(stripLayout(v3)).toEqual(stripLayout(v2));
    expect(applyPresetEveningRoom(v2)).toEqual(v3);expect(applyPresetEveningRoom(v3,{layout:"evening-v2"})).toEqual(v2);
    expect(verifyCase(v3)).toEqual(verifyCase(base));
    expect(Object.keys(PRESET_EVENING_V3.objects).sort()).toEqual(base.room.objects.map(o=>o.id).sort());
  });
  it("v3 puts the door latch on the real door and the window glass on the real window",()=>{
    const graph=applyPresetEveningRoom(createHeroCase()),at=(id:string)=>graph.room.objects.find(o=>o.id===id)!.pos;
    expect(Math.hypot(...at("O8").map((v,i)=>v-PRESET_DOOR_LATCH[i]))).toBeLessThanOrEqual(15);
    expect(Math.hypot(...at("O10").map((v,i)=>v-PRESET_WINDOW_POINT[i]))).toBeLessThanOrEqual(20);
    expect(at("O8")[0]).toBeGreaterThan(-271);expect(at("O10")[0]).toBeLessThan(205);
    expect(PRESET_DOOR_LATCH).toEqual([-268,106,-395]);expect(PRESET_WINDOW_POINT).toEqual([200,120,-240]);
  });
  it("v3 rests every object on a real surface near its zone, never inside the sofa, table or console",()=>{
    const graph=applyPresetEveningRoom(createHeroCase());
    const anchors:Record<string,number[]>={Z1:[0,-440],Z2:[-25,-162],Z3:[-215,-395],Z4:[11,-314],Z5:[160,-260]};
    for(const zone of graph.room.zones){expect([zone.anchor[0],zone.anchor[2]]).toEqual(anchors[zone.id]);expect(zone.anchor[1]).toBe(0);}
    for(const object of graph.room.objects){
      const [x,y,z]=object.pos,support=PRESET_EVENING_V3.objects[object.id].support,zone=graph.room.zones.find(z=>z.id===object.zone)!;
      expect(object.pos.every(Number.isFinite)).toBe(true);
      expect(Math.hypot(x-zone.anchor[0],z-zone.anchor[2]),object.id+" far from "+zone.clueName).toBeLessThan(210);
      const onTable=Math.hypot(x-PRESET_TABLE.centre[0],z-PRESET_TABLE.centre[1])<PRESET_TABLE.radius;
      const onSofa=x>PRESET_SOFA.x0&&x<PRESET_SOFA.x1&&z>PRESET_SOFA.z0&&z<PRESET_SOFA.z1;
      const onConsole=x>PRESET_CONSOLE.x0&&x<PRESET_CONSOLE.x1&&z>PRESET_CONSOLE.z0&&z<PRESET_CONSOLE.z1;
      if(onTable)expect(y,object.id).toBeCloseTo(PRESET_TABLE.topY,5);
      if(onSofa)expect(y,object.id).toBeCloseTo(PRESET_SOFA.seatY,5);
      if(onConsole){expect(y,object.id).toBeCloseTo(PRESET_CONSOLE.topY,5);
        for(const f of PRESET_CONSOLE_FIXTURES)expect(Math.hypot(x-f.x,z-f.z),object.id+" inside "+f.label).toBeGreaterThan(f.radius);}
      expect({table:onTable,sofa:onSofa,console:onConsole,door:support==="door",window:support==="window"}[support],object.id+" support").toBe(true);
    }
    const byZone=(id:string)=>graph.room.objects.filter(o=>o.zone===id).map(o=>PRESET_EVENING_V3.objects[o.id].support);
    expect(byZone("Z4").every(s=>s==="table")).toBe(true);expect(byZone("Z2").every(s=>s==="sofa")).toBe(true);
    expect(byZone("Z3")).toContain("door");expect(byZone("Z5")).toContain("window");
    for(const a of graph.room.objects)for(const b of graph.room.objects)if(a.id<b.id)expect(Math.hypot(...a.pos.map((v,i)=>v-b.pos[i])),a.id+"/"+b.id).toBeGreaterThan(15);
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
