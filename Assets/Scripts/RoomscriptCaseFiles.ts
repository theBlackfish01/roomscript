import {RoomscriptDragInteraction} from "./RoomscriptDragInteraction";
import {lineTubes,rectEdges,circleEdges,polyline,flatText,tinted,Segment} from "./RoomscriptLineArt";
/** Run 8 opening (WEARER_UX object UI 1): two case files on the crate replace the mode buttons.
 * Lift a folder and pull it open to choose. Presentation only: the opening controller owns phases
 * and the case modes own engine configuration.
 */
export type CaseFileMode="preset"|"dynamic";
const BRASS=new vec4(.91,.69,.29,1),CORAL=new vec4(1,.42,.35,1),IVORY=new vec4(1,.94,.84,1),CYAN=new vec4(.247,.89,1,1);
const W=24,H=16;
interface Folder {mode:CaseFileMode;root:SceneObject;cover:SceneObject;page:Text;home:vec3;homeRotation:quat;openT:number;opening:boolean;title:Text;drag:RoomscriptDragInteraction;}
export class RoomscriptCaseFiles {
  readonly root:SceneObject;private folders:Folder[]=[];private updates:SceneEvent;private busy=false;
  /** Interactable names: the Preset folder keeps the Run 7 LEAF name "RoomscriptPullTab". */
  constructor(private owner:BaseScriptComponent,crate:SceneObject,line:Material,currentMode:CaseFileMode,private onOpen:(mode:CaseFileMode)=>void,private onSound:(cue:string)=>void){
    this.root=global.scene.createSceneObject("RoomscriptCaseFiles");this.root.setParent(crate);this.root.getTransform().setLocalPosition(new vec3(0,6.5,2));
    this.folders.push(this.folder("RoomscriptPullTab","preset",new vec3(-12.5,H/2+.5,0),line,currentMode));
    this.folders.push(this.folder("Cast my room","dynamic",new vec3(12.5,H/2+.5,0),line,currentMode));
    this.updates=owner.createEvent("UpdateEvent");this.updates.bind(()=>this.update());
  }
  private folder(name:string,mode:CaseFileMode,position:vec3,line:Material,current:CaseFileMode):Folder {
    const root=global.scene.createSceneObject(name);root.setParent(this.root);root.getTransform().setLocalPosition(position);
    const tilt=quat.fromEulerAngles(-25*Math.PI/180,0,0);root.getTransform().setLocalRotation(tilt);
    const ink=mode==="preset"?BRASS:IVORY,accent=mode==="preset"?CORAL:CYAN;
    // Back board, tab and inside page lines.
    lineTubes(root,"Folder back",[...rectEdges(W,H,new vec3(0,0,-.4)),...polyline([new vec3(-W/2+1,H/2,-.4),new vec3(-W/2+2,H/2+2,-.4),new vec3(-W/2+8,H/2+2,-.4),new vec3(-W/2+9,H/2,-.4)])],tinted(line,ink),.35);
    const page=flatText(root,"Folder page","",2.2,IVORY,"body",W-4,H-5);page.getSceneObject().getTransform().setLocalPosition(new vec3(0,-1,-.3));page.getSceneObject().enabled=false;
    // Cover hinged on its left edge.
    const cover=global.scene.createSceneObject("Folder cover");cover.setParent(root);cover.getTransform().setLocalPosition(new vec3(-W/2,0,.2));
    const c=(x:number,y:number)=>new vec3(x+W/2,y,0);
    lineTubes(cover,"Cover outline",rectEdges(W,H,c(0,0)),tinted(line,ink),.45);
    const title=flatText(cover,"Cover title",mode==="preset"?"THE HARLOW TRUST":current==="dynamic"?"SAME ROOM. NEW MURDER.":"CAST THIS ROOM",3.4,accent,"title",W-4,4.5);title.getSceneObject().getTransform().setLocalPosition(c(0,3.2).add(new vec3(0,0,.3)));
    const sub=flatText(cover,"Cover subtitle",mode==="preset"?"CASE 1041 · SEALED":"YOUR ROOM · NEW CASE",1.4,ink,"body",W-8,2.2);sub.getSceneObject().getTransform().setLocalPosition(c(0,-.6).add(new vec3(0,0,.3)));
    if(mode==="preset"){
      // Wax seal across the opening edge.
      lineTubes(cover,"Wax seal",[...circleEdges(2.1,20,c(W/2-1.2,-4.2)),...circleEdges(1.3,14,c(W/2-1.2,-4.2))],tinted(line,CORAL),.4);
      lineTubes(cover,"Seal ribbon",[[c(W/2-6,-4.2),c(W/2-3.3,-4.2)]],tinted(line,CORAL),.3);
    }else{
      // Magnifier resting on the blank file.
      lineTubes(cover,"Magnifier",[...circleEdges(2.6,22,c(5,-4.4).add(new vec3(0,0,.8))),[c(6.9,-6.3).add(new vec3(0,0,.8)),c(9.6,-9).add(new vec3(0,0,.8))]],tinted(line,CYAN),.45);
    }
    const drag=root.createComponent(RoomscriptDragInteraction.getTypeName()) as RoomscriptDragInteraction;
    const shape=Shape.createBoxShape();shape.size=new vec3(W+1,H+3,3);const collider=root.getComponent("Physics.ColliderComponent") as ColliderComponent;if(collider)collider.shape=shape;
    const folder:Folder={mode,root,cover,page,home:position,homeRotation:tilt,openT:0,opening:false,title,drag};
    drag.onDragStart.add(()=>{if(!this.busy)this.onSound("FolderLift");});
    // Lift-and-pull opens it; a plain pinch-release is the accessible fallback and opens it too.
    drag.onDragEnd.add(()=>this.open(folder));
    return folder;
  }
  /** Tap/pinch fallback and LEAF entry: open the file for this mode. */
  open(target:Folder|CaseFileMode):void {
    const folder=typeof target==="string"?this.folders.find(f=>f.mode===target)!:target;if(this.busy||folder.opening)return;
    folder.opening=true;folder.openT=0;this.onSound("FolderOpen");
    // The choice takes effect at once; the cover animation plays alongside the reveal.
    this.onOpen(folder.mode);
  }
  private update():void {
    for(const folder of this.folders){if(!folder.opening)continue;folder.openT=Math.min(1,folder.openT+getDeltaTime()/.55);
      const t=1-Math.pow(1-folder.openT,3);folder.cover.getTransform().setLocalRotation(quat.fromEulerAngles(0,-150*t*Math.PI/180,0));
      // Ease the lifted folder back towards the crate as it opens.
      const now=folder.root.getTransform().getLocalPosition();folder.root.getTransform().setLocalPosition(vec3.lerp(now,folder.home.add(new vec3(0,3,4)),.2));folder.root.getTransform().setLocalRotation(folder.homeRotation);
      if(folder.openT>=1){folder.opening=false;folder.page.getSceneObject().enabled=true;}}
  }
  /** Scan progress shows on the open Dynamic file's inside page; the other file steps aside. */
  status(text:string):void {this.busy=true;const dynamic=this.folders.find(f=>f.mode==="dynamic")!;dynamic.page.getSceneObject().enabled=true;dynamic.page.text=text;
    dynamic.cover.getTransform().setLocalRotation(quat.fromEulerAngles(0,-150*Math.PI/180,0));this.folders.find(f=>f.mode==="preset")!.root.enabled=false;}
  ready(text:string):void {this.busy=false;for(const folder of this.folders){folder.root.enabled=true;folder.opening=false;folder.openT=0;folder.cover.getTransform().setLocalRotation(quat.quatIdentity());folder.page.getSceneObject().enabled=false;folder.root.getTransform().setLocalPosition(folder.home);folder.root.getTransform().setLocalRotation(folder.homeRotation);}
    const dynamic=this.folders.find(f=>f.mode==="dynamic")!;dynamic.page.text=text;}
  show(value:boolean):void {this.root.enabled=value;}
  destroy():void {if(this.updates)this.owner.removeEvent(this.updates);if(!isNull(this.root))this.root.destroy();}
  diagnostics():{open:string[];busy:boolean}{return {open:this.folders.filter(f=>f.page.getSceneObject().enabled).map(f=>f.mode),busy:this.busy};}
}
