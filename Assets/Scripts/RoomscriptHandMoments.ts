import {RoomscriptWrenHints} from "./RoomscriptWrenHints";
import {HandInputData} from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData";
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";
import {RoomscriptSpatialObjectionController} from "./RoomscriptSpatialObjectionController";
import {dustableObjects,dustingAction} from "./Engine/game/Fingerprints";
import {lineTubes,circleEdges,polyline,tinted,Segment} from "./RoomscriptLineArt";
/** Run 8 hand moments.
 * Wow 9, dusting: hover a hand over a dustable object to brush glowing prints onto it. Run 9 (review bug 3):
 *   dusting only REVEALS the prints; a pinch still collects (the ordinary PinchObject path). Hovering counts only
 *   while the game is idle and no accusation is open, so it never costs time or cancels an answer by accident.
 * Wow 6, UV flashlight: in the blackout beat a violet cone comes from your palm; the drag marks show
 *   only where the cone points (the story beat still decides when they exist).
 * Wow 7, spatial cues: Wren whispers from behind you, and from the wall board when the first photo pins.
 */
const VIOLET=new vec4(.62,.42,1,.9);
export class RoomscriptHandMoments {
  private line:Material;private hands:HandInputData|null=null;private dust=new Map<string,{progress:number;hovering:boolean;prints:SceneObject;done:boolean;revealed:boolean}>();private known=new Set<string>();private nextDustCheck=0;private verdict=false;
  private cone:SceneObject;private pool:SceneObject;private uv:SceneObject|null=null;private whispered=new Set<string>();private readyAt=0;
  constructor(owner:BaseScriptComponent,private engine:RoomscriptEngineBridge,private flow:RoomscriptInterrogationController,private room:RoomscriptRoomBinding,private objection:RoomscriptSpatialObjectionController|null,private isBlackout:()=>boolean,private board:()=>vec3|null,private sound:(cue:string,at?:vec3)=>void){
    this.line=requireAsset("../Materials/RoomscriptCyan.mat") as Material;try{this.hands=HandInputData.getInstance();}catch{this.hands=null;}
    this.cone=lineTubes(global.scene.createSceneObject("RoomscriptUVTorch"),"UV cone",[...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return [new vec3(Math.cos(a)*.5,Math.sin(a)*.5,0),new vec3(Math.cos(a)*22,Math.sin(a)*22,-1)] as Segment;}),...circleEdges(22,28,new vec3(0,0,-1))],tinted(this.line,VIOLET),.35).getSceneObject().getParent();this.cone.enabled=false;
    this.pool=lineTubes(global.scene.createSceneObject("RoomscriptUVPool"),"UV pool",[...circleEdges(30,32,vec3.zero(),"xz"),...circleEdges(18,24,vec3.zero(),"xz")],tinted(this.line,VIOLET),.6).getSceneObject().getParent();this.pool.enabled=false;
    // Object Interactables are created by the objection controller after this starts, and again on each case change.
    const later=()=>{const d=owner.createEvent("DelayedCallbackEvent");d.bind(()=>{this.bindDusting();owner.removeEvent(d);});d.reset(.6);};engine.onCaseChanged.add(later);later(); // each timer is removed after firing (review item 9)
    // Cached engine state: no snapshot() per frame (rule 13).
    const cache=(state:{knowledge:{evidenceIds:string[]};verdict:any})=>{if(this.known.size===0&&state.knowledge.evidenceIds.length>0)RoomscriptWrenHints.current?.later("W3",12,()=>!this.verdict);this.known=new Set(state.knowledge.evidenceIds);this.verdict=!!state.verdict;this.markCollected();};
    engine.initialize();cache(engine.snapshot());engine.onState.add(cache);
    owner.createEvent("LateUpdateEvent").bind(()=>this.update());
  }
  private bindDusting():void {
    this.dust.forEach(d=>{if(!isNull(d.prints))d.prints.destroy();});this.dust.clear();this.readyAt=getTime();this.whispered.clear();
    const graph=this.engine.graphRef();
    for(const id of dustableObjects(graph)){let anchor:SceneObject;try{anchor=this.room.objectAnchor(id);}catch{continue;}
      const prints=global.scene.createSceneObject("RoomscriptPrints_"+id);prints.setParent(anchor);prints.getTransform().setLocalPosition(new vec3(0,6,4));
      // Three glowing whorls: concentric partial loops, like dusted fingerprints.
      [[-2.6,1.2],[0,2.4],[2.6,1]].forEach(([x,y],k)=>{const whorl:Segment[]=[];for(let r=.5;r<=2;r+=.5)whorl.push(...circleEdges(r,14,new vec3(x,y,0),"xy",.4+k,5.6+k));lineTubes(prints,"Print "+k,whorl,tinted(this.line,new vec4(.85,.95,1,.9)),.12);});
      prints.enabled=false;const entry={progress:0,hovering:false,prints,done:false,revealed:false};this.dust.set(id,entry);
      const interaction=anchor.getComponent(Interactable.getTypeName()) as Interactable;if(!interaction)continue;
      interaction.onHoverEnter.add(()=>{if(!entry.done&&!entry.revealed&&!this.verdict){entry.hovering=true;if(this.idle())this.sound("DustBrush",anchor.getTransform().getWorldPosition());}});
      interaction.onHoverExit.add(()=>{entry.hovering=false;});
    }
    this.markCollected();
  }
  /** Once the object's memories are collected (by a pinch), its prints fade. */
  private markCollected():void {const graph=this.engine.graphRef();this.dust.forEach((d,id)=>{if(!d.done&&graph.evidence.filter(e=>e.holder===id).every(e=>this.known.has(e.id))){d.done=true;d.hovering=false;if(!isNull(d.prints))d.prints.enabled=false;}});}
  /** Dusting counts only while nothing is speaking and no accusation or modal owns the controls. */
  private idle():boolean {return !this.flow.controlsBlocked&&!this.flow.diagnostics().busy;}
  private update():void {
    const dt=Math.min(getDeltaTime(),.1);
    // Dusting: about 1.4 s of hovering reveals the prints, which then stay lit until a pinch collects the memory.
    this.dust.forEach((d,id)=>{if(d.done||d.revealed||isNull(d.prints))return;if(d.hovering&&this.idle())d.progress+=dt;else d.progress=Math.max(0,d.progress-dt*.5);
      d.prints.enabled=d.progress>.15;d.prints.getTransform().setLocalScale(vec3.one().uniformScale(.4+.6*Math.min(1,d.progress/1.4)));
      if(d.progress>=1.4&&dustingAction(this.engine.graphRef(),id)){d.revealed=true;d.hovering=false;d.prints.getTransform().setLocalScale(vec3.one());
        this.sound("PrintReveal",d.prints.getTransform().getWorldPosition());console.log("DUSTED|"+id);}});
    // UV flashlight during the blackout beat.
    const blackout=this.isBlackout();this.cone.enabled=blackout;this.pool.enabled=blackout;if(blackout)RoomscriptWrenHints.current?.say("W11");
    // Run 9: standing near prints you have not dusted for a few seconds brings Wren's dusting hint (W12), once.
    if(getTime()>=this.nextDustCheck&&this.engine.investigationEnabled&&!this.verdict){this.nextDustCheck=getTime()+.5;const eye=this.flow.actor.camera.getTransform().getWorldPosition();
      this.dust.forEach((d,id)=>{if(d.done||d.revealed||isNull(d.prints))return;const near=()=>!d.revealed&&!d.done&&d.prints.getParent().getTransform().getWorldPosition().distance(this.flow.actor.camera.getTransform().getWorldPosition())<130;
        if(d.prints.getParent().getTransform().getWorldPosition().distance(eye)<130)RoomscriptWrenHints.current?.later("W12",4,near);});}
    if(blackout){const camera=this.flow.actor.camera.getTransform();let origin=camera.getWorldPosition().add(camera.getWorldRotation().multiplyVec3(new vec3(-14,-26,-18))),dir=camera.getWorldRotation().multiplyVec3(new vec3(0,-.55,-1)).normalize();
      if(this.hands){const left=this.hands.getHand("left");if(left&&left.isTracked()){const palm=left.getPalmCenter();if(palm){origin=palm;dir=camera.getWorldRotation().multiplyVec3(new vec3(0,-.6,-1)).normalize();}}}
      this.cone.getTransform().setWorldPosition(origin);this.cone.getTransform().setWorldRotation(quat.lookAt(dir.uniformScale(-1),vec3.up()));this.cone.getTransform().setWorldScale(new vec3(1,1,60));
      const floorY=this.room.getTransform().getWorldPosition().y,hitT=dir.y<-.05?(floorY-origin.y)/dir.y:300,hit=origin.add(dir.uniformScale(Math.min(400,hitT)));this.pool.getTransform().setWorldPosition(hit.add(new vec3(0,1,0)));
      if(!this.uv||isNull(this.uv))this.uv=this.find(this.engine.roomRoot,"RoomscriptUVMemory");
      if(this.uv&&this.uv.enabled){const p=this.uvCenter();this.uv.enabled=!!p&&p.distance(hit)<70;}
    }
    // Spatial cue: once the case is under way, Wren whispers "Over here." from the wall board's real position.
    if(this.engine.investigationEnabled&&!this.whispered.has("over")&&getTime()-this.readyAt>40&&!this.flow.diagnostics().busy){const at=this.board();if(at){this.whispered.add("over");this.sound("W1",at);}}
    if(!this.whispered.has("board")&&this.known.size>0){const at=this.board();if(at){this.whispered.add("board");this.sound("W13",at);}}
  }
  private uvCenter():vec3|null {if(!this.uv)return null;const visual=this.uv.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;if(!visual)return null;return visual.worldAabbMin().add(visual.worldAabbMax()).uniformScale(.5);}
  private find(root:SceneObject,name:string):SceneObject|null {if(root.name===name)return root;for(let i=0;i<root.getChildrenCount();i++){const f=this.find(root.getChild(i),name);if(f)return f;}return null;}
  diagnostics():{dusted:string[];collected:string[];torch:boolean}{return {dusted:[...this.dust.entries()].filter(([,d])=>d.revealed).map(([id])=>id),collected:[...this.dust.entries()].filter(([,d])=>d.done).map(([id])=>id),torch:this.cone.enabled};}
}
