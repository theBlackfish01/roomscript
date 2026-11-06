import {RoomObject,RoomScan,Vec3} from "../core/Types";
import {compareIds} from "./Affordances";

/** Virtual (substituted) props rest on real detected tops, never mid-air. Floor-local cm: object.pos of a
 * physical object is its measured surface hit; y is the surface height. Positions only; zones never change. */
export const PROP_MIN_SPACING_CM=15;
export const PROP_MAX_FROM_SUPPORT_CM=60;
const SURFACE_WORDS=["table","desk","console","shelf","shelves","counter","dresser","cabinet","sideboard","bench","stool","sofa","couch","chair","armchair","bed","ottoman","nightstand","crate","trunk","chest"];
const NOT_SURFACE_WORDS=["speaker","speakers","door","window","curtain","curtains","mirror","wall","screen","monitor","tv","television","lamp","plant","clock","rug"];
const words=(label:string)=>" "+label.toLowerCase().replace(/[^a-z0-9]+/g," ").trim()+" ";
const has=(label:string,list:readonly string[])=>{const w=words(label);return list.some(item=>w.includes(" "+item+" "));};

/** A physical object a small prop can stand on. Containers before seating, then id order. */
export function isPropSupport(object:RoomObject):boolean {
  if(object.virtual||has(object.label,NOT_SURFACE_WORDS))return false;
  return object.type==="container"||object.type==="soft"||has(object.label,SURFACE_WORDS);
}
/** Candidate offsets along x first (furniture usually runs along walls), all within the support radius. */
const OFFSETS:[number,number][]=(()=>{
  const out:[number,number][]=[];
  for(const dz of [0,-20,20,-40,40])for(const dx of [0,20,-20,40,-40])if(Math.hypot(dx,dz)<=PROP_MAX_FROM_SUPPORT_CM)out.push([dx,dz]);
  return out;
})();
const horizontal=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

/** Fresh room with every virtual object resting on a support top in its own zone (round-robin, deterministic),
 * at least PROP_MIN_SPACING_CM from every other object; a zone without supports uses its anchor on the floor. */
export function restVirtualProps(room:RoomScan):RoomScan {
  const copy=JSON.parse(JSON.stringify(room)) as RoomScan;
  const placed:Vec3[]=copy.objects.filter(o=>!o.virtual).map(o=>o.pos);
  const rank=(o:RoomObject)=>o.type==="container"?0:has(o.label,SURFACE_WORDS)&&o.type!=="soft"?1:2;
  for(const zone of copy.zones.slice().sort((a,b)=>compareIds(a.id,b.id))){
    const supports=copy.objects.filter(o=>o.zone===zone.id&&isPropSupport(o)).sort((a,b)=>rank(a)-rank(b)||compareIds(a.id,b.id));
    const props=copy.objects.filter(o=>o.zone===zone.id&&o.virtual).sort((a,b)=>compareIds(a.id,b.id));
    props.forEach((prop,i)=>{
      const bases:{pos:Vec3;self?:RoomObject}[]=supports.length?supports.map((_,k)=>supports[(i+k)%supports.length]).map(s=>({pos:s.pos,self:s})):[{pos:[zone.anchor[0],0,zone.anchor[2]]}];
      for(const base of bases)for(const [dx,dz] of OFFSETS){
        const pos:Vec3=[base.pos[0]+dx,base.pos[1],base.pos[2]+dz];
        if(placed.every(p=>(base.self&&p===base.self.pos)||horizontal(p,pos)>=PROP_MIN_SPACING_CM)){prop.pos=pos;placed.push(pos);return;}
      }
      throw new Error("No free support position for "+prop.id);
    });
  }
  return copy;
}
