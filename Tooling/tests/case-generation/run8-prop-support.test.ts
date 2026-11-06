import {describe,it,expect} from "vitest";
import {prepareDynamicCase} from "../../../Assets/Scripts/Content/DynamicCase";
import {EVENING_ROOM_SCAN,EVENING_ROOM_FLOOR_Y} from "../../../Assets/Scripts/Content/EveningRoomScan";
import {LIVE_SCAN_REPLY} from "../../../Assets/Scripts/Content/LiveScanReply";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {roomFromObservations,LocatedObservation} from "../../../Assets/Scripts/Engine/room/ScanAdmission";
import {RoomInput} from "../../../Assets/Scripts/Engine/room/RoomModel";
import {isPropSupport,restVirtualProps,PROP_MIN_SPACING_CM,PROP_MAX_FROM_SUPPORT_CM} from "../../../Assets/Scripts/Engine/room/PropSupport";
import {minimumCostRoute,solvePlayerKnowledge,verifyCase} from "../../../Assets/Scripts/Engine/case/Solver";
import {replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {CaseGraph,RoomScan} from "../../../Assets/Scripts/Engine/core/Types";
import {TerminalPlayer} from "../../scripts/play";

function liveScanRoom():RoomInput {
  const observations:LocatedObservation[]=[];
  for(const view of LIVE_SCAN_REPLY.views)for(const o of view.response.objects){
    const surface=EVENING_ROOM_SCAN.objects.find(s=>s.label===o.label);if(!surface)continue;
    observations.push({label:o.label,type:o.type,confidence:o.confidence,box:o.box,hit:{position:[surface.pos[0],surface.pos[1]+EVENING_ROOM_FLOOR_Y,surface.pos[2]],normal:[0,1,0]}});
  }
  return roomFromObservations(observations,EVENING_ROOM_FLOOR_Y);
}
const horizontal=(a:readonly number[],b:readonly number[])=>Math.hypot(a[0]-b[0],a[2]-b[2]);
/** Every virtual prop is on a same-zone support top (within reach) or on the floor at its zone anchor. */
function grounded(room:RoomScan):void {
  const virtual=room.objects.filter(o=>o.virtual);
  for(const prop of virtual){
    const support=room.objects.filter(o=>o.zone===prop.zone&&isPropSupport(o)).find(s=>Math.abs(prop.pos[1]-s.pos[1])<1&&horizontal(prop.pos,s.pos)<=PROP_MAX_FROM_SUPPORT_CM);
    if(!support){const zone=room.zones.find(z=>z.id===prop.zone)!;expect(prop.pos[1],prop.id+" floats").toBe(0);expect(horizontal(prop.pos,zone.anchor)).toBeLessThanOrEqual(PROP_MAX_FROM_SUPPORT_CM);}
    for(const other of room.objects)if(other!==prop&&other!==support)expect(horizontal(prop.pos,other.pos),prop.id+"/"+other.id).toBeGreaterThanOrEqual(PROP_MIN_SPACING_CM);
  }
}
const strip=(room:RoomScan)=>({...room,objects:room.objects.map(o=>o.virtual?{...o,pos:[]}:o)});
function solve(graph:CaseGraph):void {
  const player=new TerminalPlayer(graph);
  for(const ref of minimumCostRoute(graph).refs){
    const evidence=graph.evidence.find(e=>e.id===ref),statement=graph.statements.find(s=>s.id===ref);
    if(evidence&&!player.state.knowledge.evidenceIds.includes(ref))player.execute("pinch "+evidence.holder);
    else if(statement&&!player.state.knowledge.statementIds.includes(ref))player.execute("chip "+statement.speaker+" "+statement.topic);
  }
  const h=solvePlayerKnowledge(graph,player.state.knowledge).hypotheses;expect(h).toEqual([graph.envelope]);
  player.execute(`accuse ${h[0].who} ${h[0].where} ${h[0].what}`);expect(player.state.verdict).toBe("correct");
  expect(replayGame(graph,player.state.log)).toEqual(player.state);
}
const IDS:Record<number,string>={7:"RS-c651eaaa",1041:"RS-46732d2d",2026:"RS-b6cca84d"};

describe("virtual props rest on detected surfaces",()=>{
  for(const [name,input] of [["recorded scan",()=>EVENING_ROOM_SCAN],["live scan reply",liveScanRoom]] as const)
    for(const seed of [7,1041,2026])it(name+" seed "+seed+": grounded, spaced, same case identity, verdict and replay",()=>{
      const result=prepareDynamicCase(seed,input());expect(result.ok,result.error).toBe(true);
      const graph=result.graph!;grounded(graph.room);
      expect(graph.room.objects.filter(o=>o.virtual).length).toBeGreaterThan(0);
      for(const prop of graph.room.objects.filter(o=>o.virtual)){const hasTop=graph.room.objects.some(o=>o.zone===prop.zone&&isPropSupport(o));expect(prop.pos[1]>20,prop.id).toBe(hasTop);if(name==="recorded scan")expect(hasTop).toBe(true);}
      if(name==="recorded scan")expect(graph.caseId).toBe(IDS[seed]);
      expect(verifyCase(graph).ok).toBe(true);expect(graph.solver!.ok).toBe(true);solve(graph);
      expect(restVirtualProps(graph.room)).toEqual(graph.room);
    });
  it("changes only virtual positions, never zones, ids, types or physical objects",()=>{
    const graph=prepareDynamicCase(7,EVENING_ROOM_SCAN).graph!,room=JSON.parse(JSON.stringify(graph.room)) as RoomScan;
    for(const o of room.objects)if(o.virtual)o.pos=[999,75,999];
    const rested=restVirtualProps(room);expect(strip(rested)).toEqual(strip(room));expect(rested).toEqual(graph.room);
    expect(room.objects.find(o=>o.virtual)!.pos).toEqual([999,75,999]);
  });
  it("falls back to the zone anchor on the floor when a zone has no support, never mid-air",()=>{
    const zones=createHeroCase().room.zones.slice(0,3);
    const objects=[{id:"sofa",label:"sofa",type:"soft" as const,zone:zones[0].id,pos:[0,45,-150] as [number,number,number]},
      {id:"table",label:"coffee table",type:"heavy" as const,zone:zones[0].id,pos:[50,50,-150] as [number,number,number]},
      {id:"plant",label:"plant",type:"plant" as const,zone:zones[1].id,pos:[-100,50,-120] as [number,number,number]},
      {id:"lamp",label:"floor lamp",type:"light" as const,zone:zones[1].id,pos:[-130,140,-130] as [number,number,number]},
      {id:"door",label:"door",type:"door" as const,zone:zones[2].id,pos:[150,110,30] as [number,number,number]}];
    for(const seed of [7,1041,2026]){
      const result=prepareDynamicCase(seed,{source:"simulated",zones,objects});expect(result.ok,result.error).toBe(true);
      const graph=result.graph!;grounded(graph.room);solve(graph);
      const bare=graph.room.objects.filter(o=>o.virtual&&o.zone!==zones[0].id);expect(bare.length).toBeGreaterThan(0);
      for(const o of bare)expect(o.pos[1]).toBe(0);
      for(const o of graph.room.objects.filter(o=>o.virtual&&o.zone===zones[0].id))expect([45,50]).toContain(o.pos[1]);
    }
  });
});
