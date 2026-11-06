import {describe,it,expect} from "vitest";
import {isPlausibleWeapon,plausibleRoom,plausibleType} from "../../../Assets/Scripts/Engine/room/Plausibility";
import {roomFromObservations,LocatedObservation} from "../../../Assets/Scripts/Engine/room/ScanAdmission";
import {isWeapon} from "../../../Assets/Scripts/Engine/room/Affordances";
import {RoomInput} from "../../../Assets/Scripts/Engine/room/RoomModel";
import {getRawRoomFixture,ROOM_FIXTURE_NAMES} from "../../../Assets/Scripts/Engine/room/RoomFixtures";
import {EVENING_ROOM_SCAN,EVENING_ROOM_FLOOR_Y} from "../../../Assets/Scripts/Content/EveningRoomScan";
import {LIVE_SCAN_REPLY} from "../../../Assets/Scripts/Content/LiveScanReply";
import {prepareDynamicCase} from "../../../Assets/Scripts/Content/DynamicCase";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {minimumCostRoute,solvePlayerKnowledge,verifyCase} from "../../../Assets/Scripts/Engine/case/Solver";
import {replayGame} from "../../../Assets/Scripts/Engine/game/Reducer";
import {TerminalPlayer} from "../../scripts/play";

const IMPLAUSIBLE=/speaker|record player|table|console|sofa|chair|couch|bed|cabinet|shelf/;
describe("casting plausibility",()=>{
  it("keeps plausible weapons and demotes furniture to witnesses or hiding places",()=>{
    for(const [label,type] of [["charger cable","cord"],["brass candlestick","blunt"],["desk lamp","blunt"],["marble bookend","heavy"],["vase","heavy"],["letter opener","sharp"],["kitchen knife","sharp"],["medicine bottle","poison"],["award","blunt"]] as const)
      {expect(plausibleType(label,type)).toBe(type);expect(isPlausibleWeapon(label,type)).toBe(true);}
    expect(plausibleType("left speaker","blunt")).toBe("screen");expect(plausibleType("right speaker","blunt")).toBe("screen");
    expect(plausibleType("record player","heavy")).toBe("screen");expect(plausibleType("coffee table","heavy")).toBe("container");
    expect(plausibleType("side table 0","heavy")).toBe("container");expect(plausibleType("armchair","heavy")).toBe("soft");
    expect(plausibleType("speaker","soft")).toBe("soft");expect(plausibleType("lamp","light")).toBe("light");
    expect(isPlausibleWeapon("speaker","blunt")).toBe(false);expect(isPlausibleWeapon("cable","light")).toBe(false);
  });
  it("changes no authored fixture role, only implausible scan roles",()=>{
    for(const name of ROOM_FIXTURE_NAMES){const raw=getRawRoomFixture(name);expect(plausibleRoom(raw).objects.map(o=>o.type)).toEqual(raw.objects.map(o=>o.type));}
    const hero=createHeroCase().room;for(const o of hero.objects.filter(isWeapon))expect(isPlausibleWeapon(o.label,o.type)).toBe(true);
    const scan=plausibleRoom(EVENING_ROOM_SCAN),before=JSON.stringify(EVENING_ROOM_SCAN);
    expect(JSON.stringify(EVENING_ROOM_SCAN)).toBe(before);
    expect(scan.objects.filter(o=>isWeapon(o))).toEqual([]);
    expect(scan.objects.map(o=>[o.id,o.pos])).toEqual(EVENING_ROOM_SCAN.objects.map(o=>[o.id,o.pos]));
  });
});

/** The recorded live reply has boxes, not hits; locate each label at the recorded scan surface for this offline test. */
function liveScanRoom():RoomInput {
  const observations:LocatedObservation[]=[];
  for(const view of LIVE_SCAN_REPLY.views)for(const o of view.response.objects){
    const surface=EVENING_ROOM_SCAN.objects.find(s=>s.label===o.label);if(!surface)continue;
    observations.push({label:o.label,type:o.type,confidence:o.confidence,box:o.box,hit:{position:[surface.pos[0],surface.pos[1]+EVENING_ROOM_FLOOR_Y,surface.pos[2]],normal:[0,1,0]}});
  }
  // The model proposed "weapon" for speakers and the record player; that role is never read.
  expect(LIVE_SCAN_REPLY.views.some((v:any)=>v.response.objects.some((o:any)=>/speaker/.test(o.label)&&o.role==="weapon"))).toBe(true);
  return roomFromObservations(observations,EVENING_ROOM_FLOOR_Y);
}
describe("generated cases never arm the furniture",()=>{
  it("scan admission casts the live reply's speakers as witnesses, never weapons",()=>{
    const room=liveScanRoom();expect(room.objects.length).toBeGreaterThanOrEqual(5);
    for(const o of room.objects){if(/speaker|record player/.test(o.label))expect(o.type).toBe("screen");expect(isWeapon(o)).toBe(false);}
  });
  for(const [name,input] of [["recorded scan",()=>EVENING_ROOM_SCAN],["live scan reply",liveScanRoom]] as const)
    for(const seed of [7,1041,2026])it(name+" seed "+seed+" compiles to a verified, solvable case with plausible weapons and an exact replay",()=>{
      const result=prepareDynamicCase(seed,input());expect(result.ok,JSON.stringify(result.error)).toBe(true);
      const graph=result.graph!;expect(verifyCase(graph).ok).toBe(true);expect(graph.solver!.ok).toBe(true);
      for(const id of graph.weapons){const o=graph.room.objects.find(x=>x.id===id)!;expect(isPlausibleWeapon(o.label,o.type),o.label).toBe(true);expect(o.label).not.toMatch(IMPLAUSIBLE);}
      expect(graph.weapons).toContain(graph.envelope.what);
      const player=new TerminalPlayer(graph);
      for(const ref of minimumCostRoute(graph).refs){
        const evidence=graph.evidence.find(e=>e.id===ref),statement=graph.statements.find(s=>s.id===ref);
        if(evidence&&!player.state.knowledge.evidenceIds.includes(ref))player.execute("pinch "+evidence.holder);
        else if(statement&&!player.state.knowledge.statementIds.includes(ref))player.execute("chip "+statement.speaker+" "+statement.topic);
      }
      const h=solvePlayerKnowledge(graph,player.state.knowledge).hypotheses;expect(h).toEqual([graph.envelope]);
      player.execute(`accuse ${h[0].who} ${h[0].where} ${h[0].what}`);expect(player.state.verdict).toBe("correct");
      expect(replayGame(graph,player.state.log)).toEqual(player.state);
      expect(prepareDynamicCase(seed,input()).graph).toEqual(graph);
    });
});
