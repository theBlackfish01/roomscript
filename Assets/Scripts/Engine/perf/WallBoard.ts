/** Pure choice of a wall plane for the 120 x 80 cm case board from World Query hit samples (world cm).
 * Presentation only: never touches case truth. Deterministic for a given hit order. */
export type V3=[number,number,number];
export interface WallHit {position:V3;normal:V3}
export interface WallChoice {center:V3;normal:V3;width:number}
export const WALL_MIN_WIDTH_CM=130,WALL_MIN_DISTANCE_CM=150,WALL_MAX_DISTANCE_CM=400,WALL_BOARD_HEIGHT_CM=140;
const MAX_NORMAL_Y=.2,MAX_ANGLE_DEG=10,MAX_OFFSET_CM=8,MIN_HITS=3;

interface Cluster {nx:number;nz:number;sumX:number;sumZ:number;points:[number,number][];}
const unit=(x:number,z:number):[number,number]=>{const l=Math.hypot(x,z);return [x/l,z/l];};

export function chooseBoardWall(hits:readonly WallHit[],player:V3,floorY=-176):WallChoice|null {
  const cos=Math.cos(MAX_ANGLE_DEG*Math.PI/180),clusters:Cluster[]=[];
  for(const hit of hits){
    const p=hit.position,n=hit.normal;
    if(!p||!n||p.length!==3||n.length!==3||![...p,...n].every(Number.isFinite))continue;
    if(Math.abs(n[1])>=MAX_NORMAL_Y||Math.hypot(n[0],n[2])<1e-6)continue;
    const [nx,nz]=unit(n[0],n[2]);
    const match=clusters.find(c=>{const [cx,cz]=unit(c.nx,c.nz);
      if(cx*nx+cz*nz<cos)return false;
      const offset=(x:number,z:number)=>cx*x+cz*z,mean=c.points.reduce((s,q)=>s+offset(q[0],q[1]),0)/c.points.length;
      return Math.abs(offset(p[0],p[2])-mean)<=MAX_OFFSET_CM;});
    if(match){match.nx+=nx;match.nz+=nz;match.sumX+=p[0];match.sumZ+=p[2];match.points.push([p[0],p[2]]);}
    else clusters.push({nx,nz,sumX:p[0],sumZ:p[2],points:[[p[0],p[2]]]});
  }
  const candidates=clusters.filter(c=>c.points.length>=MIN_HITS).map((c,index)=>{
    let [nx,nz]=unit(c.nx,c.nz);const tx=-nz,tz=nx;
    const along=c.points.map(q=>q[0]*tx+q[1]*tz),lo=Math.min(...along),hi=Math.max(...along),width=hi-lo;
    const d=c.points.reduce((s,q)=>s+q[0]*nx+q[1]*nz,0)/c.points.length;
    // Centroid on the plane, kept far enough from the ends for a 120 cm board where possible.
    const mid=c.points.reduce((s,q)=>s+q[0]*tx+q[1]*tz,0)/c.points.length,half=60;
    const t=width>=2*half?Math.min(hi-half,Math.max(lo+half,mid)):(lo+hi)/2;
    const cx=tx*t+nx*d,cz=tz*t+nz*d;
    const toPlayer:[number,number]=[player[0]-cx,player[2]-cz],distance=Math.hypot(toPlayer[0],toPlayer[1]);
    const facing=nx*toPlayer[0]+nz*toPlayer[1]>0;
    if(!facing){nx=-nx;nz=-nz;}
    return {index,width,distance,facing,center:[cx,floorY+WALL_BOARD_HEIGHT_CM,cz] as V3,normal:[nx,0,nz] as V3};
  }).filter(c=>c.width>=WALL_MIN_WIDTH_CM&&c.distance>=WALL_MIN_DISTANCE_CM&&c.distance<=WALL_MAX_DISTANCE_CM);
  candidates.sort((a,b)=>Number(b.facing)-Number(a.facing)||b.width-a.width||a.distance-b.distance||a.index-b.index);
  const best=candidates[0];
  return best?{center:best.center,normal:best.normal,width:best.width}:null;
}
