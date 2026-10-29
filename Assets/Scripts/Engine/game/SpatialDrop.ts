import {Vec3} from "../core/Types";
export interface DropTarget {id:string;position:Vec3;radius:number;}
/** Near drops retain direct manipulation. Far drops align the card and target on a view ray. */
export function spatialDrop(origin:Vec3,card:Vec3,targets:DropTarget[],degrees=4):string|null {
  const distance=(a:Vec3,b:Vec3)=>Math.hypot(...a.map((n,i)=>n-b[i]));
  const near=targets.map(t=>({id:t.id,d:distance(t.position,card),r:t.radius})).filter(t=>t.d<=t.r).sort((a,b)=>a.d-b.d);
  if(near.length)return near[0].id;
  const direction=card.map((n,i)=>n-origin[i]),length=Math.hypot(...direction);if(length<10)return null;
  const hits=targets.map(target=>{const v=target.position.map((n,i)=>n-origin[i]),d=Math.hypot(...v),dot=direction.reduce((s,n,i)=>s+n*v[i],0)/(length*d);return {id:target.id,angle:d>0?Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI:180};}).filter(t=>t.angle<=degrees).sort((a,b)=>a.angle-b.angle);
  if(!hits.length||(hits.length>1&&hits[1].angle-hits[0].angle<.75))return null;
  return hits[0].id;
}
