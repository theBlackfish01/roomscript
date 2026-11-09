import {Vec3} from "../core/Types";

export const HARLOW_ZONE_SLOTS=[{id:"Z1",name:"Study"},{id:"Z2",name:"Lounge"},{id:"Z3",name:"Hall"},{id:"Z4",name:"Kitchen"}] as const;
export const HARLOW_ITEM_SLOTS=[{id:"O11",name:"kettle"},{id:"O12",name:"recorder"},{id:"O1",name:"charger cable"},{id:"O13",name:"letter"},{id:"O14",name:"debt note"},{id:"O15",name:"certificate"}] as const;
export interface RoomCastHit {id:string;position:Vec3;normal:Vec3;kind:"floor"|"surface";label:string;guestZones?:string[];}
export interface RoomCastScan {id:string;floorY:number;hits:RoomCastHit[];}
export interface CheckedRoomCast {scanId:string;floorY:number;zones:Record<string,Vec3>;items:Record<string,Vec3>;lines:{zone:string;text:string}[];hitIds:string[];}
export type RoomCastCheck={ok:true;value:CheckedRoomCast}|{ok:false;reason:string};
const point=(p:unknown):p is Vec3=>Array.isArray(p)&&p.length===3&&p.every(n=>typeof n==="number"&&Number.isFinite(n)&&Math.abs(n)<10000);
const keys=(o:any,allowed:string[])=>o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===allowed.length&&Object.keys(o).every(k=>allowed.includes(k));
const banned=/\b(?:imran|qadir|marguerite|vale|ada|okafor|jonah|pike|suspect|killer|weapon|cable|charger|cord|rope|knife|dagger|candlestick|medicine|poison|bookend|S[1-4]|O[1-5])\b/i;
/** Placement is an untrusted proposal. References select measured points; model coordinates are never accepted. */
export function checkHarlowRoomCast(reply:unknown,scan:RoomCastScan,guestOffsets:Record<string,Vec3[]>={}):RoomCastCheck {
 const bad=(reason:string):RoomCastCheck=>({ok:false,reason});
 if(!scan||typeof scan.id!=="string"||!Number.isFinite(scan.floorY)||!Array.isArray(scan.hits)||scan.hits.length>300)return bad("invalid_scan");
 const hits=new Map<string,RoomCastHit>();
 for(const hit of scan.hits){if(!hit||typeof hit.id!=="string"||hits.has(hit.id)||!point(hit.position)||!point(hit.normal)||hit.normal[1]<.8||!["floor","surface"].includes(hit.kind))return bad("invalid_hit");hits.set(hit.id,hit);}
 if(!keys(reply,["zones","items"]))return bad("unexpected_fields");const r=reply as any;
 if(!Array.isArray(r.zones)||r.zones.length!==4||!Array.isArray(r.items)||r.items.length!==6)return bad("missing_or_duplicate_slot");
 const value:CheckedRoomCast={scanId:scan.id,floorY:scan.floorY,zones:{},items:{},lines:[],hitIds:[]};
 for(const row of r.zones){
  if(!keys(row,["id","hitId","line"]))return bad("invalid_zone_row");
  const slot=HARLOW_ZONE_SLOTS.find(z=>z.id===row.id);if(!slot)return bad("unknown_zone");if(value.zones[row.id])return bad("duplicate_zone");
  const hit=hits.get(row.hitId);if(!hit||hit.kind!=="floor"||Math.abs(hit.position[1]-scan.floorY)>8)return bad("unmeasured_zone_point");
  if(guestOffsets[row.id]?.length&&!hit.guestZones?.includes(row.id))return bad("unsupported_guest_offset");
  if(typeof row.line!=="string"||!row.line.trim()||row.line.length>140||row.line.trim().split(/\s+/).length>12||/[\r\n<>]/.test(row.line)||banned.test(row.line)||!new RegExp("\\b"+slot.name+"\\b","i").test(row.line))return bad("unsafe_casting_line");
  const p:Vec3=[hit.position[0],hit.position[1]-scan.floorY,hit.position[2]];
  if(Object.values(value.zones).some(q=>Math.hypot(p[0]-q[0],p[2]-q[2])<100))return bad("zones_too_close");
  value.zones[row.id]=p;value.lines.push({zone:row.id,text:row.line.trim()});value.hitIds.push(hit.id);
 }
 const guests:Vec3[]=[];
 for(const zone of Object.keys(guestOffsets))for(const offset of guestOffsets[zone]){
  const anchor=value.zones[zone];if(!anchor)return bad("unknown_guest_zone");
  const p:Vec3=[anchor[0]+offset[0],anchor[1]+offset[1],anchor[2]+offset[2]];
  if(guests.some(q=>Math.hypot(p[0]-q[0],p[2]-q[2])<90))return bad("guests_too_close");guests.push(p);
 }
 for(const row of r.items){
  if(!keys(row,["id","hitId"]))return bad("invalid_item_row");
  if(!HARLOW_ITEM_SLOTS.some(s=>s.id===row.id))return bad("unknown_item");if(value.items[row.id])return bad("duplicate_item");
  const hit=hits.get(row.hitId);if(!hit||hit.kind!=="surface"||hit.position[1]<scan.floorY+25||hit.position[1]>scan.floorY+180)return bad("unmeasured_surface_point");
  const p:Vec3=[hit.position[0],hit.position[1]-scan.floorY,hit.position[2]];
  if(Object.values(value.items).some(q=>Math.hypot(p[0]-q[0],p[2]-q[2])<25))return bad("items_too_close");
  value.items[row.id]=p;value.hitIds.push(hit.id);
 }
 value.lines.sort((a,b)=>a.zone.localeCompare(b.zone));return {ok:true,value};
}
