import {RoomscriptPropMesh} from "./RoomscriptPropMesh";
import {lineTubes,boxEdges,rectEdges,circleEdges,tinted,Segment} from "./RoomscriptLineArt";
/** Run 8 (WEARER_UX object UI 8): the case crate as an engraved-light line drawing.
 * Keeps the authored crate parts, hinge and colliders; only their flat-coloured boxes are hidden.
 */
const BRASS=new vec4(.91,.69,.29,1),IVORY=new vec4(1,.94,.84,.55),CORAL=new vec4(1,.42,.35,1);
export function engraveCrate(crate:SceneObject,line:Material):SceneObject[] {
  const made:SceneObject[]=[];const brass=tinted(line,BRASS),ivory=tinted(line,IVORY);
  const hide=(object:SceneObject)=>{if(object.getComponent(RoomscriptPropMesh.getTypeName())){const visual=object.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;if(visual)visual.enabled=false;}for(let i=0;i<object.getChildrenCount();i++)hide(object.getChild(i));};
  hide(crate);
  const v=(x:number,y:number,z:number)=>new vec3(x,y,z);
  // Body: outer edges, plank seams on all four walls, brass corner straps and a keyhole plate.
  const body:Segment[]=[...boxEdges(46,12,28,v(0,-.5,0))];
  const planks:Segment[]=[];for(const y of [-2.4,1.6]){planks.push([v(-23,y,14.1),v(23,y,14.1)],[v(-23,y,-14.1),v(23,y,-14.1)],[v(-23.1,y,-14),v(-23.1,y,14)],[v(23.1,y,-14),v(23.1,y,14)]);}
  const straps:Segment[]=[];for(const x of [-18,18])straps.push([v(x-1.4,-6.5,14.3),v(x-1.4,5.5,14.3)],[v(x+1.4,-6.5,14.3),v(x+1.4,5.5,14.3)]);
  const lock:Segment[]=[...circleEdges(1.6,16,v(0,2.6,14.4)),[v(0,2,14.4),v(0,.4,14.4)]];
  made.push(lineTubes(crate,"Engraved crate body",[...body,...straps,...lock],brass,.55).getSceneObject());
  made.push(lineTubes(crate,"Engraved crate planks",planks,ivory,.3).getSceneObject());
  // Lid rides the authored hinge so the opening animation still works.
  const lid=findChild(crate,"CrateLid");
  if(lid){made.push(lineTubes(lid,"Engraved lid",[...rectEdges(46,28,v(0,1.1,0),"xz"),...rectEdges(40,22,v(0,1.2,0),"xz")],brass,.5).getSceneObject());
    made.push(lineTubes(lid,"Engraved lid seal",circleEdges(2.6,20,v(0,1.3,9),"xz"),tinted(line,CORAL),.45).getSceneObject());}
  return made;
}
function findChild(root:SceneObject,name:string):SceneObject|null {if(root.name===name)return root;for(let i=0;i<root.getChildrenCount();i++){const found=findChild(root.getChild(i),name);if(found)return found;}return null;}
