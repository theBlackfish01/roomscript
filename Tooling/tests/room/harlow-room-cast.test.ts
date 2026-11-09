import {describe,it,expect} from "vitest";
import {checkHarlowRoomCast,HARLOW_ZONE_SLOTS,HARLOW_ITEM_SLOTS,RoomCastScan} from "../../../Assets/Scripts/Engine/room/HarlowRoomCast";
import {mapHarlowLayout} from "../../../Assets/Scripts/Content/HarlowRoomLayout";
import {createRun10HeroCase} from "../../../Assets/Scripts/Content/Run10HeroCase";
import {actorPresentationMarks,harlowGuestOffsets} from "../../../Assets/Scripts/Content/ActorPresentationMarks";
import {chalkSpot} from "../../../Assets/Scripts/Content/ChalkSpots";
import {verifyCase} from "../../../Assets/Scripts/Engine/case/Solver";
const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
const scan:RoomCastScan={id:"roomcast-1",floorY:-176,hits:[
 ...[[-100,-300],[100,-300],[-100,-100],[100,-100]].map((p,i)=>({id:"F"+i,position:[p[0],-176,p[1]] as [number,number,number],normal:[0,1,0] as [number,number,number],kind:"floor" as const,label:"floor",guestZones:["Z1","Z2","Z3","Z4"]})),
 ...HARLOW_ITEM_SLOTS.map((s,i)=>({id:"T"+i,position:[i*40,-100,-240] as [number,number,number],normal:[0,1,0] as [number,number,number],kind:"surface" as const,label:"table"}))]};
const reply=()=>({zones:HARLOW_ZONE_SLOTS.map((z,i)=>({id:z.id,hitId:"F"+i,line:"Tonight, this corner becomes Harlow's "+z.name+"."})),items:HARLOW_ITEM_SLOTS.map((s,i)=>({id:s.id,hitId:"T"+i}))});
describe("authored Harlow room placement",()=>{
 it("rejects floor noise as a prop top and preserves clearance between authored guests",()=>{
  const blocked=clone(scan);blocked.hits[2].guestZones=[];expect(checkHarlowRoomCast(reply(),blocked,harlowGuestOffsets())).toEqual({ok:false,reason:"unsupported_guest_offset"});
  const low=clone(scan);low.hits[4].position[1]=scan.floorY+15;expect(checkHarlowRoomCast(reply(),low).ok).toBe(false);
  expect(checkHarlowRoomCast(reply(),scan,harlowGuestOffsets()).ok).toBe(true);
  const crowded=clone(scan);crowded.hits[3].position=[-210,-176,-180];
  expect(checkHarlowRoomCast(reply(),crowded,harlowGuestOffsets())).toEqual({ok:false,reason:"guests_too_close"});
 });
 it("accepts a complete reply and preserves every case fact, lie, voice and sealed answer",()=>{
  const checked=checkHarlowRoomCast(reply(),scan);expect(checked.ok).toBe(true);if(!checked.ok)throw Error("fixture");
  const original=createRun10HeroCase(),before=clone(original),mapped=mapHarlowLayout(original,checked.value);
  for(const field of ["facts","evidence","statements","cast","envelope","performances","weapons","requiredDeductions","beats","refutation"] as const)expect(mapped[field]).toEqual(original[field]);
  expect(original).toEqual(before);expect(mapped.envelope).toEqual({who:"S2",where:"Z1",what:"O1"});expect(verifyCase(mapped).ok).toBe(true);
  expect(mapped.room.zones.map(z=>z.clueName)).toEqual(original.room.zones.map(z=>z.clueName));
  for(const item of HARLOW_ITEM_SLOTS)expect(mapped.room.objects.find(o=>o.id===item.id)!.pos).toEqual(checked.value.items[item.id]);
  const old=actorPresentationMarks(original,"preset"),now=actorPresentationMarks(mapped,"preset"),delta=mapped.roomMapping!.zoneOffsets.Z3;
  expect(now.S2).toEqual(old.S2.map((n,i)=>n+delta[i]));
  const chalk=chalkSpot(original,"Z1","preset"),remapped=chalkSpot(mapped,"Z1","preset");expect(remapped.center).toEqual(chalk.center.map((n,i)=>n+mapped.roomMapping!.zoneOffsets.Z1[i]));
  expect(mapped.roomMapping!.zoneOffsets.Z5).toEqual(mapped.roomMapping!.zoneOffsets.Z4);
 });
 it("rejects a missing slot",()=>{const r=reply();r.items.pop();expect(checkHarlowRoomCast(r,scan).ok).toBe(false);});
 it("preserves measured floor heights and authored vertical offsets",()=>{
  const uneven=clone(scan);uneven.hits[0].position[1]+=3;const checked=checkHarlowRoomCast(reply(),uneven);expect(checked.ok).toBe(true);if(!checked.ok)throw Error("fixture");
  expect(checked.value.zones.Z1).toEqual([-100,3,-300]);const mapped=mapHarlowLayout(createRun10HeroCase(),checked.value);expect(mapped.room.zones.find(z=>z.id==="Z1")!.anchor[1]).toBe(3);expect(mapped.roomMapping!.zoneOffsets.Z1[1]).toBe(3);
 });
 it("rejects unknown and duplicated IDs",()=>{const r=reply();r.items[0].id="O99" as any;expect(checkHarlowRoomCast(r,scan).ok).toBe(false);const d=reply();d.zones[1].id=d.zones[0].id;expect(checkHarlowRoomCast(d,scan).ok).toBe(false);});
 it("rejects a casting line naming a weapon or suspect",()=>{for(const name of ["charger cable","knife","Vale","Imran","bookend"]){const r=reply();r.zones[0].line="The Study holds "+name+".";expect(checkHarlowRoomCast(r,scan).ok,name).toBe(false);}});
 it("rejects invented points, crowded anchors and extra truth fields",()=>{const r=reply();r.items[0].hitId="invented";expect(checkHarlowRoomCast(r,scan).ok).toBe(false);const s=clone(scan);s.hits[1].position=[-90,-176,-300];expect(checkHarlowRoomCast(reply(),s).ok).toBe(false);expect(checkHarlowRoomCast({...reply(),envelope:{who:"S1"}},scan).ok).toBe(false);});
 it("rejects long lines, wrong surface types and overlapping item tops",()=>{const r=reply();r.zones[0].line="Study "+"room ".repeat(12);expect(checkHarlowRoomCast(r,scan).ok).toBe(false);const p=reply();p.items[0].hitId="F0";expect(checkHarlowRoomCast(p,scan).ok).toBe(false);const q=reply();q.items[0].hitId=q.items[1].hitId;expect(checkHarlowRoomCast(q,scan).ok).toBe(false);});
});
