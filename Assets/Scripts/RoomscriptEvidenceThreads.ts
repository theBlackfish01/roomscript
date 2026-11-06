import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";
import {evidenceWeb,convergence,WebNode,WebThread} from "./Engine/game/EvidenceWeb";
import {chalkSpot} from "./Content/ChalkSpots";
import {lineTubes,polyline,tinted,Segment} from "./RoomscriptLineArt";
import {GameState} from "./Engine/core/Types";
/** Run 8 wow 4: the evidence web strung across the real room. Every thread is an evidenceWeb() thread
 * (engine events only). After the verdict, convergence() threads light up and pulse to the culprit,
 * ending on the wall board. Nothing here reads the envelope before the engine reveals it. */
const RED=new vec4(1,.42,.35,.75),GLOW=new vec4(1,.84,.04,1);
export class RoomscriptEvidenceThreads {
  private root:SceneObject;private key="";private line:Material;private grow:{object:SceneObject;began:number}[]=[];private pulses:{object:SceneObject;path:vec3[];began:number}[]=[];private converged=false;
  constructor(owner:BaseScriptComponent,private engine:RoomscriptEngineBridge,private flow:RoomscriptInterrogationController,private room:RoomscriptRoomBinding,private board:()=>vec3|null,private sound:(cue:string,at:vec3)=>void){
    this.line=requireAsset("../Materials/RoomscriptCyan.mat") as Material;
    engine.onState.add(state=>this.refresh(state));engine.onCaseChanged.add(()=>{this.key="";this.converged=false;this.refresh(engine.snapshot());});
    owner.createEvent("UpdateEvent").bind(()=>this.update());
  }
  private point(node:WebNode):vec3|null {
    try{switch(node.kind){
      case "suspect":{const actor=this.flow.actorFor(node.id);return actor&&actor.getSceneObject().enabled?actor.getTransform().getWorldPosition().add(new vec3(0,118,0)):null;}
      case "object":return this.room.objectAnchor(node.id).getTransform().getWorldPosition().add(new vec3(0,6,0));
      case "zone":{const spot=chalkSpot(this.engine.graphRef(),node.id,this.engine.mode());return this.room.toWorld([spot.center[0],8,spot.center[2]]);}
      default:return null;}}catch{return null;}
  }
  private sag(a:vec3,b:vec3,segments=12):vec3[] {const dip=Math.min(40,a.distance(b)*.12);return Array.from({length:segments+1},(_,i)=>{const t=i/segments;return vec3.lerp(a,b,t).add(new vec3(0,-dip*4*t*(1-t),0));});}
  private refresh(state:GameState):void {
    const graph=this.engine.graphRef(),threads=evidenceWeb(graph,state),final=state.verdict?convergence(graph,state):null;
    const key=JSON.stringify(threads.map(t=>t.id))+(final?"|"+final.culprit:"");if(key===this.key)return;const previous=this.key;this.key=key;
    if(this.root&&!isNull(this.root))this.root.destroy();this.root=global.scene.createSceneObject("RoomscriptEvidenceThreads");
    const finalIds=new Set(final?final.threads.map(t=>t.id):[]),fresh=threads.filter(t=>!previous.includes(t.id));
    for(const thread of threads){const a=this.point(thread.from),b=this.point(thread.to);if(!a||!b||a.distance(b)<5)continue;
      const lit=finalIds.has(thread.id),object=lineTubes(this.root,"Thread "+thread.id,polyline(this.sag(a,b)),tinted(this.line,lit?GLOW:RED),lit?.55:.32).getSceneObject();
      if(fresh.includes(thread)&&!final){this.grow.push({object,began:getTime()});this.sound("RedString",vec3.lerp(a,b,.5));}}
    if(final&&!this.converged){this.converged=true;const culprit=this.point({kind:"suspect",id:final.culprit});
      for(const thread of final.threads){const a=this.point(thread.from),b=this.point(thread.to);if(a&&b)this.pulses.push({object:this.dot(),path:this.sag(a,b),began:getTime()+Math.random()*0});}
      const boardAt=this.board();if(culprit&&boardAt){lineTubes(this.root,"Thread to board",polyline(this.sag(culprit,boardAt,16)),tinted(this.line,GLOW),.55);this.sound("RedString",boardAt);}}
  }
  private dot():SceneObject {const o=lineTubes(this.root,"Pulse",[[new vec3(-1.2,0,0),new vec3(1.2,0,0)],[new vec3(0,-1.2,0),new vec3(0,1.2,0)],[new vec3(0,0,-1.2),new vec3(0,0,1.2)]],tinted(this.line,new vec4(1,1,1,1)),.9).getSceneObject();return o;}
  private update():void {
    for(let i=this.grow.length-1;i>=0;i--){const g=this.grow[i];if(isNull(g.object)){this.grow.splice(i,1);continue;}const t=Math.min(1,(getTime()-g.began)/.8);g.object.getTransform().setLocalScale(vec3.one());(g.object.getComponent("Component.RenderMeshVisual") as RenderMeshVisual).enabled=t>.05;if(t>=1)this.grow.splice(i,1);}
    for(const p of this.pulses){if(isNull(p.object))continue;const t=((getTime()-p.began)/1.6)%1,f=t*(p.path.length-1),i=Math.floor(f),k=f-i,pos=vec3.lerp(p.path[i],p.path[Math.min(p.path.length-1,i+1)],k);p.object.getTransform().setWorldPosition(pos);}
  }
  diagnostics():{threads:number;converged:boolean}{return {threads:this.root&&!isNull(this.root)?this.root.getChildrenCount():0,converged:this.converged};}
}
