import {describe,it,expect} from "vitest";
import {actorPresentationMarks,PRESET_FREE_FLOOR_MARKS,conversationSpot,CONVERSATION_DISTANCE_CM} from "../../../Assets/Scripts/Content/ActorPresentationMarks";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {applyPresetEveningRoom} from "../../../Assets/Scripts/Content/PresetEveningRoom";
import {EVENING_ROOM_SCAN,EVENING_ROOM_FLOOR_Y} from "../../../Assets/Scripts/Content/EveningRoomScan";
import {recordedCrateSurfaceLayout} from "../../../Assets/Scripts/Content/CrateSurfaceLayout";
import {refuterMarks,clockwiseRefuters} from "../../../Assets/Scripts/Engine/game/CluePresentation";
const horizontal=(a:readonly number[],b:readonly number[])=>Math.hypot(a[0]-b[0],a[2]-b[2]);
/** Nov 6 World Query heightmap of the Evening Room (Run 8 survey), floor-local cm. */
const SOFA={x0:-175,x1:125,z0:-200,z1:-125};
const insideBox=(p:readonly number[],box:{x0:number;x1:number;z0:number;z1:number},margin:number)=>p[0]>box.x0-margin&&p[0]<box.x1+margin&&p[2]>box.z0-margin&&p[2]<box.z1+margin;
describe("Preset actor staging stands every suspect on free floor",()=>{
  it("clears the table, sofa, crate footprint, chair and every other actor",()=>{
    const graph=applyPresetEveningRoom(createHeroCase()),marks=actorPresentationMarks(graph,"preset");
    const table=EVENING_ROOM_SCAN.objects.find(o=>o.label==="coffee table")!,chair=EVENING_ROOM_SCAN.objects.find(o=>o.label==="woven chair")!;
    const crate=recordedCrateSurfaceLayout();
    for(const person of graph.cast.suspects){const mark=marks[person.id];
      // 85 cm art-card width; measured table radius ~60 and chair radius ~40.
      expect(horizontal(mark,table.pos)).toBeGreaterThan(42.5+60);
      expect(horizontal(mark,chair.pos)).toBeGreaterThan(42.5+40+10);
      expect(insideBox(mark,SOFA,20)).toBe(false);
      const dx=Math.max(0,Math.abs(mark[0]-crate.rootWorld[0])-34.5/2),dz=Math.max(0,Math.abs(mark[2]-crate.rootWorld[2])-21/2);
      expect(Math.hypot(dx,dz)).toBeGreaterThan(42.5+10);
      expect(mark[1]+EVENING_ROOM_FLOOR_Y).toBe(-176);
      for(const other of graph.cast.suspects.filter(s=>s.id!==person.id))expect(horizontal(mark,marks[other.id])).toBeGreaterThan(85+10);
    }
  });
  it("offers a conversation spot 1.3-1.5 m away on free floor",()=>{
    expect(CONVERSATION_DISTANCE_CM).toBeGreaterThanOrEqual(130);expect(CONVERSATION_DISTANCE_CM).toBeLessThanOrEqual(150);
    const table=EVENING_ROOM_SCAN.objects.find(o=>o.label==="coffee table")!;
    for(const [id,mark] of Object.entries(PRESET_FREE_FLOOR_MARKS)){const spot=conversationSpot(id);
      expect(horizontal(spot,mark)).toBeGreaterThanOrEqual(130);expect(horizontal(spot,mark)).toBeLessThanOrEqual(150);expect(horizontal(spot,table.pos)).toBeGreaterThan(60);expect(insideBox(spot,SOFA,0)).toBe(false);}
  });
  it("does not mutate case truth, original refuter marks or clockwise order",()=>{
    const graph=applyPresetEveningRoom(createHeroCase()),before=JSON.stringify(graph),original=refuterMarks(graph),order=clockwiseRefuters(graph,[0,0,0],[0,0,-1]);
    const marks=actorPresentationMarks(graph,"preset");for(const id of Object.keys(PRESET_FREE_FLOOR_MARKS))expect(marks[id]).toEqual(PRESET_FREE_FLOOR_MARKS[id]);
    for(const id of Object.keys(original).filter(id=>!(id in PRESET_FREE_FLOOR_MARKS)))expect(marks[id]).toEqual(original[id]);
    marks.S2[0]=999;expect(JSON.stringify(graph)).toBe(before);expect(refuterMarks(graph)).toEqual(original);expect(clockwiseRefuters(graph,[0,0,0],[0,0,-1])).toEqual(order);
    expect(PRESET_FREE_FLOOR_MARKS.S2[0]).not.toBe(999);
  });
  it("stages the same free-floor marks on the v2 and v3 Preset layouts",()=>{
    for(const layout of ["evening-v2","evening-v3"] as const){const marks=actorPresentationMarks(applyPresetEveningRoom(createHeroCase(),{layout}),"preset");
      for(const id of Object.keys(PRESET_FREE_FLOOR_MARKS))expect(marks[id]).toEqual(PRESET_FREE_FLOOR_MARKS[id]);}
  });
  it("leaves Dynamic and historical layouts unchanged",()=>{
    const historical=createHeroCase(),current=applyPresetEveningRoom(historical);
    expect(actorPresentationMarks(current,"dynamic")).toEqual(refuterMarks(current));
    expect(actorPresentationMarks(historical,"preset")).toEqual(refuterMarks(historical));
    const older=JSON.parse(JSON.stringify(current));older.room.roomId=older.room.roomId.replace(/:evening-v\d+$/,":evening-v1");
    expect(actorPresentationMarks(older,"preset")).toEqual(refuterMarks(older));
  });
});
