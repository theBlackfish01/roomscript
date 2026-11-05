import {CaseGraph,RoomObject} from "../Engine/core/Types";
/** Select by engine object type. Object IDs differ between cases; O4 is poison in HARLOW-1041. */
export function presetCableObject(graph:CaseGraph):RoomObject|undefined {return graph.room.objects.find(object=>object.type==="cord");}
/** Authored fictional rope role on its existing case support; never a vision-detected cable. Units: cm. */
export interface CableMeshData {vertices:number[];indices:number[];}
type Point=[number,number,number];
/** Planar specialization of CLAD's tube sweep (Apache-2.0); positive Y stays above the support plane. */
function appendTube(mesh:CableMeshData,points:Point[],radius:number,radial=8):void {
  const start=mesh.vertices.length/12,R=radial+1,tangents:Point[]=[];
  for(let i=0;i<points.length;i++){
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],length=Math.hypot(b[0]-a[0],b[2]-a[2]);
    if(length<.0001)throw Error("Degenerate cable tangent");const tx=(b[0]-a[0])/length,tz=(b[2]-a[2])/length;tangents.push([tx,0,tz]);
    for(let j=0;j<R;j++){const angle=j/radial*Math.PI*2,nx=tz*Math.cos(angle),ny=Math.sin(angle),nz=-tx*Math.cos(angle),p=points[i];
      mesh.vertices.push(p[0]+radius*nx,p[1]+radius*ny,p[2]+radius*nz,nx,ny,nz,j/radial,i/(points.length-1),1,1,1,1);}
  }
  for(let i=0;i<points.length-1;i++)for(let j=0;j<radial;j++){const a=start+i*R+j,b=a+R;mesh.indices.push(a,a+1,b+1,a,b+1,b);}
  for(const end of [0,points.length-1]){const center=mesh.vertices.length/12,p=points[end],t=tangents[end],sign=end===0?-1:1;
    mesh.vertices.push(...p,t[0]*sign,0,t[2]*sign,.5,.5,1,1,1,1);
    for(let j=0;j<radial;j++){const a=start+end*R+j;mesh.indices.push(...(end===0?[center,a+1,a]:[center,a,a+1]));}}
}
export function authoredCableGeometry():{cord:CableMeshData;connectors:CableMeshData;label:string}{
  const cord:CableMeshData={vertices:[],indices:[]},connectors:CableMeshData={vertices:[],indices:[]};
  const path:Point[]=[[1,.75,-8],[3,.75,-8],[6,.75,-7]];
  for(let i=0;i<=64;i++){const fraction=i/64,angle=-Math.PI/2+fraction*Math.PI*3.2,radius=6-3*fraction;path.push([9+Math.cos(angle)*radius,.75,Math.sin(angle)*radius]);}
  path.push([8,.75,6.5],[14,.75,8],[18,.75,8]);appendTube(cord,path,.35);
  appendTube(connectors,[[1,.75,-8],[3,.75,-8]],.65);appendTube(connectors,[[16,.75,8],[18,.75,8]],.65);
  return {cord,connectors,label:"Authored cable - fictional rope role on its case support"};
}
