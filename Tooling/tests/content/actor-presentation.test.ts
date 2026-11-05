import {describe,it,expect} from "vitest";
import {actorPresentationMarks} from "../../../Assets/Scripts/Content/ActorPresentationMarks";
import {createHeroCase} from "../../../Assets/Scripts/Content/HeroCaseHarlow1041";
import {applyPresetEveningRoom} from "../../../Assets/Scripts/Content/PresetEveningRoom";
import {EVENING_ROOM_SCAN,EVENING_ROOM_FLOOR_Y} from "../../../Assets/Scripts/Content/EveningRoomScan";
import {recordedCrateSurfaceLayout} from "../../../Assets/Scripts/Content/CrateSurfaceLayout";
import {refuterMarks,clockwiseRefuters} from "../../../Assets/Scripts/Engine/game/CluePresentation";
const horizontal=(a:readonly number[],b:readonly number[])=>Math.hypot(a[0]-b[0],a[2]-b[2]);
describe("Preset actor staging clears the recorded crate",()=>{
  it("clears the table, crate footprint, chair and every other actor",()=>{
    const graph=applyPresetEveningRoom(createHeroCase()),marks=actorPresentationMarks(graph,"preset"),vale=marks.S2;
    const table=EVENING_ROOM_SCAN.objects.find(o=>o.label==="coffee table")!,chair=EVENING_ROOM_SCAN.objects.find(o=>o.label==="woven chair")!;
    // 85cm art-card width, conservative circular table radius50 and chair radius40.
    expect(horizontal(vale,table.pos)).toBeGreaterThan(42.5+50+10);
    expect(horizontal(vale,chair.pos)).toBeGreaterThan(42.5+40+10);
    for(const person of graph.cast.suspects.filter(s=>s.id!=="S2"))expect(horizontal(vale,marks[person.id])).toBeGreaterThan(85+10);
    const crate=recordedCrateSurfaceLayout(),dx=Math.max(0,Math.abs(vale[0]-crate.rootWorld[0])-34.5/2),dz=Math.max(0,Math.abs(vale[2]-crate.rootWorld[2])-21/2);
    expect(Math.hypot(dx,dz)).toBeGreaterThan(42.5+10);
    expect(vale[1]+EVENING_ROOM_FLOOR_Y).toBe(-176);
  });
  it("clears the initial camera-to-crate sightline with a full actor half-width margin",()=>{
    const graph=applyPresetEveningRoom(createHeroCase()),vale=actorPresentationMarks(graph,"preset").S2,crate=recordedCrateSurfaceLayout().rootWorld;
    const t=Math.max(0,Math.min(1,(vale[0]*crate[0]+vale[2]*crate[2])/(crate[0]**2+crate[2]**2)));
    expect(Math.hypot(vale[0]-t*crate[0],vale[2]-t*crate[2])).toBeGreaterThan(42.5+Math.hypot(34.5,21)/2);
  });
  it("does not mutate case truth, original refuter marks, clockwise order, or other actors",()=>{
    const graph=applyPresetEveningRoom(createHeroCase()),before=JSON.stringify(graph),original=refuterMarks(graph),order=clockwiseRefuters(graph,[0,0,0],[0,0,-1]);
    const marks=actorPresentationMarks(graph,"preset");expect(marks.S2).not.toEqual(original.S2);
    for(const id of Object.keys(original).filter(id=>id!=="S2"))expect(marks[id]).toEqual(original[id]);
    marks.S2[0]=999;expect(JSON.stringify(graph)).toBe(before);expect(refuterMarks(graph)).toEqual(original);expect(clockwiseRefuters(graph,[0,0,0],[0,0,-1])).toEqual(order);
  });
  it("leaves Dynamic and historical layouts unchanged",()=>{
    const historical=createHeroCase(),current=applyPresetEveningRoom(historical);
    expect(actorPresentationMarks(current,"dynamic")).toEqual(refuterMarks(current));
    expect(actorPresentationMarks(historical,"preset")).toEqual(refuterMarks(historical));
    const older=JSON.parse(JSON.stringify(current));older.room.roomId=older.room.roomId.replace(":evening-v2",":evening-v1");
    expect(actorPresentationMarks(older,"preset")).toEqual(refuterMarks(older));
  });
});
