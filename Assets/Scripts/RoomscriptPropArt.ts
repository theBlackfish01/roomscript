import {lineTubes,circleEdges,rectEdges,polyline,boxEdges,tinted,Segment} from "./RoomscriptLineArt";
import {propModel} from "./RoomscriptPropModels";
const boxEdgesAt=(w:number,h:number,d:number,c:vec3)=>boxEdges(w,h,d,c);
/** Run 8 (WEARER_UX object UI 8): props in the actors' glowing line style, never flat primitives.
 * GLB props get the engraved rim-light material; props with no model get procedural line drawings.
 * Presentation only: positions come from the room binding, which follows the engine's graph.
 */
export const PROP_BRASS=new vec4(.91,.69,.29,1),PROP_IVORY=new vec4(1,.94,.84,1),PROP_CYAN=new vec4(.247,.89,1,1),PROP_CORAL=new vec4(1,.42,.35,1);
let engraved:Material|null=null,line:Material|null=null;
function engravedBase():Material {if(!engraved)engraved=requireAsset("../Materials/Run8/RoomscriptEngravedLight.mat") as Material;return engraved;}
function lineBase():Material {if(!line)line=requireAsset("../Materials/RoomscriptCyan.mat") as Material;return line;}
/** Replace every mesh material under a GLB instance with the engraved rim light. */
export function engraveModel(root:SceneObject,color:vec4,shape=new vec4(.55,2.6,.12,1.15)):number {
  const material=engravedBase().clone();material.mainPass.lineColor=color;material.mainPass.shape=shape;let count=0;
  const visit=(o:SceneObject)=>{const visuals=o.getComponents("Component.RenderMeshVisual") as RenderMeshVisual[];for(const v of visuals){v.clearMaterials();v.addMaterial(material);count++;}for(let i=0;i<o.getChildrenCount();i++)visit(o.getChild(i));};
  visit(root);return count;
}
/** Lathe drawing: rings at each profile point plus meridians. profile = [radius, height] from the base up. */
export function latheSegments(profile:[number,number][],meridians=8):Segment[] {
  const out:Segment[]=[];for(const [r,y] of profile)if(r>.2)out.push(...circleEdges(r,24,new vec3(0,y,0),"xz"));
  for(let m=0;m<meridians;m++){const a=m*Math.PI*2/meridians,c=Math.cos(a),s=Math.sin(a);out.push(...polyline(profile.map(([r,y])=>new vec3(r*c,y,r*s))));}
  return out;
}
const v=(x:number,y:number,z:number)=>new vec3(x,y,z);
/** Procedural engraved drawings for kinds that have no model. Returns null when the real fixture should carry no drawing. */
export function propDrawing(parent:SceneObject,id:string,kind:string,isWeapon:boolean):SceneObject|null {
  {const model=propModel(parent,id,kind);if(model)return model;} // Run 9: textured mesh when the kind has one
  const color=isWeapon?PROP_CORAL:kind==="kettle"||kind==="cup"?PROP_CYAN:PROP_BRASS,material=tinted(lineBase(),color);let segments:Segment[]=[];
  switch(kind){
    case "kettle":segments=[...latheSegments([[7,0],[8.5,3],[8.5,8],[7,11.5],[3.5,13.5],[1.5,14.5]],6),
      ...polyline([v(8,9,0),v(13,13,0),v(15,15.5,0)]),...polyline([v(-7.5,4,0),v(-11,6,0),v(-11,11,0),v(-6,12.5,0)])];break; // spout and handle
    case "poison":segments=[...latheSegments([[3.2,0],[3.2,9],[1.4,11],[1.4,13],[1.8,13.2],[1.8,15]],6),...rectEdges(4.4,3.4,v(0,4.6,3.25))];break; // bottle and label
    case "light":segments=[...latheSegments([[6,0],[6,1.2],[1,2],[1,20]],4),...latheSegments([[3,0],[9,8]].map(([r,y])=>[r,y+20] as [number,number]),8)];break; // desk lamp
    case "cup":segments=[...latheSegments([[3.4,0],[4.1,8.6],[4.3,9.2]],8),...polyline([v(4.1,7.4,0),v(6.6,7,0),v(7.2,4.6,0),v(6.4,2.6,0),v(3.8,2.4,0)]),...polyline([v(2.2,9.2,1),v(1.2,7.6,1.6),v(2.6,6.2,1.9)])];break; // mug with handle and chip
    case "blunt":segments=[...latheSegments([[4.6,0],[4.6,1],[1.4,3],[1,13.5],[1.8,14.5],[2.4,15.6],[1.1,16.2]],6),...latheSegments([[.8,16.2],[.8,22]],4),...polyline([v(0,22,0),v(.6,23.6,0),v(0,25.4,0),v(-.6,23.6,0),v(0,22,0)])];break; // candlestick
    case "sharp":segments=[...polyline([v(-9,.4,0),v(4,.4,-.9),v(9,.4,0),v(4,.4,.9),v(-9,.4,0)]),...rectEdges(6,1.8,v(-12,.6,0),"xz"),...polyline([v(-9,.6,-1.3),v(-9,.6,1.3)])];break; // letter knife lying flat
    case "heavy":segments=[...boxEdgesAt(10,2.2,7,v(0,1.1,0)),...boxEdgesAt(3,12,7,v(-3.5,8.2,0)),...circleEdges(2,14,v(-3.5,9,3.55))];break; // marble bookend
    case "clock":segments=[...boxEdgesAt(16,18,7,v(0,9,0)),...circleEdges(5.8,28,v(0,10,3.6)),...polyline([v(0,10,3.7),v(0,14.2,3.7)]),...polyline([v(0,10,3.7),v(2.9,11.1,3.7)])];break; // mantel clock at 22:30-ish
    case "screen":segments=[...boxEdgesAt(7,2.6,12,v(0,1.3,0)),...[0,1,2,3].map(i=>[v(-2.5,2.7,-4+i*1.2),v(2.5,2.7,-4+i*1.2)] as Segment),...circleEdges(.9,10,v(-1.6,2.7,3),"xz"),...circleEdges(.9,10,v(1.6,2.7,3),"xz")];break; // dictation recorder
    case "door":segments=[...rectEdges(5,12,v(0,0,0)),...polyline([v(0,0,.8),v(9,0,.8)]),...circleEdges(1.2,12,v(0,0,.8))];break; // latch plate and lever
    case "mirror":segments=[...rectEdges(60,80,v(0,0,0)),...polyline([v(0,-40,0),v(0,40,0)]),...polyline([v(-30,0,0),v(30,0,0)])];break; // window frame on the glass
    case "soft":segments=[...rectEdges(46,30,v(0,1,0),"xz"),...polyline([v(-20,1.5,-10),v(-5,1.5,-2),v(12,1.5,-12)])];break; // folded cover on the seat
    case "cord":segments=[...polyline(Array.from({length:13},(_,i)=>{const t=i/12;return v(-18+36*t,-4*Math.sin(Math.PI*t),0);})), // drawn taut between two hands
      ...circleEdges(2.4,12,v(-19.5,0,0),"xy"),...circleEdges(2.4,12,v(19.5,0,0),"xy"),...boxEdgesAt(2.2,1.6,3,v(23,0,0)),[v(24.5,.4,-.6),v(26.5,.4,-.6)],[v(24.5,.4,.6),v(26.5,.4,.6)]];break; // wraps and plug
    default:return null;
  }
  const drawing=lineTubes(parent,"RoomscriptPropVisual_"+id,segments,material,kind==="mirror"?.6:.35).getSceneObject();
  // Wall fixtures (door latch, window glass) face into the room: towards the room centre over the coffee table.
  if(kind==="door"||kind==="mirror"){const p=parent.getTransform().getWorldPosition(),toward=new vec3(-p.x,0,-300-p.z);if(toward.length>1)drawing.getTransform().setWorldRotation(quat.lookAt(toward.normalize(),vec3.up()));}
  return drawing;
}
