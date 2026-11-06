import {ObjectType,Vec3} from "../core/Types";
import {RoomInput,RoomObjectInput,normalizeRoom} from "./RoomModel";
import {plausibleType} from "./Plausibility";
export interface LocatedObservation {label:string;type:string;confidence:number;box:number[];hit:{position:number[];normal:number[]}|null;}
const mapping:Record<string,ObjectType>={"media console":"container","record player":"heavy","left speaker":"blunt","right speaker":"blunt","speaker":"blunt","coffee table":"heavy","woven chair":"soft","sofa":"soft","lamp":"light","plant":"plant","door":"door","cable":"cord","mug":"cup","kettle":"kettle","screen":"screen"};
/** Strict observed vocabulary. Model-proposed roles never enter game facts. */
export function roomFromObservations(observations:readonly LocatedObservation[],floorY:number):RoomInput {
  if(!Number.isFinite(floorY))throw new Error("A measured floor is required.");
  const selected=new Map<string,LocatedObservation>();
  for(const row of observations){const label=typeof row.label==="string"?row.label.trim().toLowerCase():"",hit=row.hit;
    if(!mapping[label]||mapping[label]!==row.type||!hit||!Array.isArray(row.box)||row.box.length!==4||row.box.some(n=>!Number.isFinite(n)||n<0||n>1)||row.box[0]>=row.box[2]||row.box[1]>=row.box[3]||!Number.isFinite(row.confidence)||row.confidence<.6||row.confidence>1||hit.position.length!==3||hit.position.some(n=>!Number.isFinite(n)||Math.abs(n)>10000)||hit.normal.length!==3||hit.normal.some(n=>!Number.isFinite(n)))continue;
    const previous=selected.get(label);if(!previous||row.confidence>previous.confidence||(row.type==="heavy"&&hit.normal[1]>.7&&previous.hit!.normal[1]<.3))selected.set(label,{...row,label});
  }
  if(selected.size<5)throw new Error("Look around until five clear furniture surfaces are found.");
  const rows=[...selected.values()].sort((a,b)=>a.hit!.position[2]-b.hit!.position[2]||a.hit!.position[0]-b.hit!.position[0]||(a.label<b.label?-1:1));
  const counts=[Math.ceil(rows.length/3),Math.ceil((rows.length-Math.ceil(rows.length/3))/2)];
  const objects:RoomObjectInput[]=rows.map((o,i)=>({id:"SCAN_"+(i+1),label:o.label,type:plausibleType(o.label,mapping[o.label]),zone:"Z"+(i<counts[0]?1:i<counts[0]+counts[1]?2:3),pos:[o.hit!.position[0],o.hit!.position[1]-floorY,o.hit!.position[2]] as Vec3,origin:"vision",confidence:o.confidence,virtual:false}));
  const zones=["Study","Conservatory","Lounge"].map((name,i)=>{const group=objects.filter(o=>o.zone==="Z"+(i+1));return {id:"Z"+(i+1),label:name.toLowerCase(),clueName:name,anchor:[group.reduce((s,o)=>s+o.pos[0],0)/group.length,0,group.reduce((s,o)=>s+o.pos[2],0)/group.length] as Vec3};});
  return normalizeRoom({source:"vision",zones,objects});
}
