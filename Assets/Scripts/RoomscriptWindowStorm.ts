import {ghostArt,ghostImage} from "./RoomscriptGhostArt";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {lineTubes,rectEdges,polyline,tinted,Segment} from "./RoomscriptLineArt";
import {iconImage} from "./RoomscriptGlyphUI";
/** Run 8 wow 1: rain and lightning on the real window, spatial thunder from the window, and a lightning
 * flash that briefly reveals the victim's ghost in the glass. Pure atmosphere: it reads no case truth.
 * Preset: the surveyed Evening Room window (right wall). Dynamic: the window-type object if one was cast.
 */
export const PRESET_WINDOW={center:new vec3(201,-62,-238),normal:new vec3(-1,0,0),width:170,height:150};
export class RoomscriptWindowStorm {
  private root:SceneObject;private streaks:{object:SceneObject;speed:number;x:number;y:number}[]=[];private frame:SceneObject;private bolt:SceneObject;private ghost:SceneObject;
  private next=0;private flashAt=-1;private width=0;private height=0;private blackout=false;private rain:SceneObject;private rainUntil=0;private scratch=new vec3(0,0,0);
  constructor(owner:BaseScriptComponent,private engine:RoomscriptEngineBridge,private audio:RoomscriptAudio){
    engine.onCaseChanged.add(()=>this.build());owner.createEvent("UpdateEvent").bind(()=>this.update());this.build();
  }
  /** The blackout story beat asks for more frequent lightning (the virtual world goes dark). */
  setBlackout(value:boolean):void {this.blackout=value;if(value)this.next=Math.min(this.next,getTime()+.8);}
  private build():void {
    if(this.root&&!isNull(this.root))this.root.destroy();this.streaks=[];
    let center:vec3,normal:vec3,width:number,height:number;
    if(this.engine.mode()==="preset"){({center,normal,width,height}=PRESET_WINDOW);}else{
      const graph=this.engine.graphRef(),window=graph.room.objects.find(o=>o.type==="mirror"||/window/i.test(o.label));if(!window){this.root=null;return;}
      center=this.engine.roomRoot.getTransform().getWorldTransform().multiplyPoint(new vec3(window.pos[0],window.pos[1],window.pos[2]));normal=new vec3(-center.x,0,-center.z).normalize();width=110;height=110;}
    this.width=width;this.height=height;const line=requireAsset("../Materials/RoomscriptCyan.mat") as Material;
    // Run 9 (review item 10): the storm lives in the room root's frame. Preset values are root-local; dynamic ones are world.
    this.root=global.scene.createSceneObject("RoomscriptWindowStorm");this.root.setParent(this.engine.roomRoot);this.root.createComponent("Component.Canvas");
    if(this.engine.mode()==="preset"){this.root.getTransform().setLocalPosition(center);this.root.getTransform().setLocalRotation(quat.lookAt(normal,vec3.up()));}
    else{this.root.getTransform().setWorldPosition(center);this.root.getTransform().setWorldRotation(quat.lookAt(normal,vec3.up()));}
    const rain=tinted(line,new vec4(.55,.75,1,.55));this.rain=global.scene.createSceneObject("Rain");this.rain.setParent(this.root);this.rain.enabled=false;
    for(let i=0;i<46;i++){const x=((i*37)%100)/100*width-width/2,y=((i*61)%100)/100*height-height/2,len=6+(i%5)*3;
      const streak=lineTubes(this.rain,"Rain "+i,[[new vec3(0,0,1),new vec3(-len*.12,-len,1)]],rain,.22).getSceneObject();streak.getTransform().setLocalPosition(new vec3(x,y,0));this.streaks.push({object:streak,speed:260+(i%7)*35,x,y});}
    this.frame=lineTubes(this.root,"Lightning frame",rectEdges(width,height),tinted(line,new vec4(.85,.9,1,1)),.6).getSceneObject();this.frame.enabled=false;
    const zig:Segment[]=polyline([new vec3(10,height/2,2),new vec3(-6,height*.22,2),new vec3(8,height*.05,2),new vec3(-12,-height*.2,2),new vec3(2,-height*.34,2)]);
    this.bolt=lineTubes(this.root,"Lightning bolt",zig,tinted(line,new vec4(1,1,1,1)),1.1).getSceneObject();this.bolt.enabled=false;
    this.ghost=global.scene.createSceneObject("Lightning ghost");this.ghost.setParent(this.root);this.ghost.createComponent("Component.Canvas");this.ghost.getTransform().setLocalPosition(new vec3(-width*.22,-height*.12,3));
    {const art=ghostArt("V","standing");if(art){this.ghost.getTransform().setLocalPosition(new vec3(-width*.22,-height*.45,3));this.ghost.getTransform().setLocalScale(vec3.one().uniformScale(.62));ghostImage(this.ghost,"Victim ghost",art,new vec4(.72,.9,1,.6));}}this.ghost.enabled=false;
    this.next=getTime()+6;this.flashAt=-1;
  }
  /** Optional poll for the blackout story beat (set by the main script). */
  isBlackout:(()=>boolean)|null=null;
  private update():void {
    if(!this.root||isNull(this.root))return;{const b=!!this.isBlackout?.();if(b!==this.blackout)this.setBlackout(b);}const dt=Math.min(getDeltaTime(),.1);
    // Run 9 (review item 8): rain only falls around a lightning beat and in the blackout, with one reused vector.
    const now=getTime(),raining=this.blackout||now<this.rainUntil||now<this.holdUntil;if(this.rain.enabled!==raining)this.rain.enabled=raining;
    if(raining)for(const s of this.streaks){s.y-=s.speed*dt;s.x-=s.speed*dt*.12;if(s.y<-this.height/2){s.y+=this.height;s.x=((s.x+this.width/2+this.width*.37)%this.width)-this.width/2;}this.scratch.x=s.x;this.scratch.y=s.y;s.object.getTransform().setLocalPosition(this.scratch);}
    // Outside the blackout a storm beat comes every 45-75 s (native audio can stall a frame, so keep it rare).
    if(now>=this.next){this.flashAt=now;this.rainUntil=now+10;this.next=now+(this.blackout?3+Math.abs(Math.sin(now))*3:45+Math.abs(Math.sin(now*1.3))*30);
      const at=this.root.getTransform().getWorldPosition();this.audio.playAt("LightningCrack",at);this.thunderAt=now+.9;}
    if(this.thunderAt>0&&now>=this.thunderAt){this.thunderAt=-1;this.audio.playAt(this.blackout?"ThunderNear":"ThunderFar",this.root.getTransform().getWorldPosition());}
    const t=this.flashAt>=0?(now<this.holdUntil?.1:now-this.flashAt):99,lit=t<.12||(t>.22&&t<.3);this.frame.enabled=lit;this.bolt.enabled=t<.18;this.ghost.enabled=t>.05&&t<.32;
  }
  private thunderAt=-1;private holdUntil=0;
  /** Director/film capture only: fire a flash now and keep it lit for a few seconds. */
  flashNow(holdSeconds=0):void {this.next=getTime();this.holdUntil=getTime()+holdSeconds;}
  diagnostics():{active:boolean;streaks:number}{return {active:!!this.root&&!isNull(this.root),streaks:this.streaks.length};}
}
