import {ActionPayload,GameState,Vec3} from "../core/Types";

export interface RoutePoint {position:Vec3;atMs:number;seq:number;}
export interface RouteReplay {points:RoutePoint[];segments:Vec3[][];distanceMeters:number;inspections:Record<string,number>;text:string;}
export function validRoutePosition(position:unknown):position is Vec3 {
  return Array.isArray(position)&&position.length===3&&position.every(v=>typeof v==="number"&&Number.isFinite(v)&&Math.abs(v)<=1000000);
}
/** Caller samples the real tracked pose with an explicit clock, at most once a second. */
export function routeSample(state:GameState,position:Vec3,atMs:number):ActionPayload|undefined {
  if(state.verdict||!state.setupPose||!validRoutePosition(position)||!Number.isFinite(atMs)||atMs<0)return undefined;
  const last=state.events.slice().reverse().find(e=>e.type==="routeSample");
  if(last&&atMs-Number(last.data?.atMs)<1000)return undefined;
  return {type:"PlayerMoved",position:position.slice() as Vec3,atMs};
}
/** Reconstruct only admitted samples. Teleports/gaps break the trail and add no distance. */
export function routeReplay(state:GameState):RouteReplay {
  const points:RoutePoint[]=state.events.filter(e=>e.type==="routeSample").map(e=>({position:(e.data!.position as Vec3).slice() as Vec3,atMs:Number(e.data!.atMs),seq:e.seq}));
  const segments:Vec3[][]=[];let cm=0;
  for(let i=0;i<points.length;i++) {
    const point=points[i],previous=points[i-1];
    const distance=previous?Math.hypot(point.position[0]-previous.position[0],point.position[2]-previous.position[2]):0;
    const delta=previous?point.atMs-previous.atMs:0;
    if(!previous||delta>5000||distance/delta*1000>250)segments.push([]);
    else cm+=distance;
    segments[segments.length-1].push(point.position.slice() as Vec3);
  }
  const inspections:Record<string,number>={};
  const rejected=new Set(state.events.filter(e=>e.type==="rejected").map(e=>e.seq));
  for(const action of state.log)if(action.type==="PinchObject"&&!rejected.has(action.seq))inspections[action.object]=(inspections[action.object]||0)+1;
  const distanceMeters=Math.round(cm)/100;
  return {points,segments,distanceMeters,inspections,text:"You walked "+Math.round(distanceMeters)+" m."};
}
