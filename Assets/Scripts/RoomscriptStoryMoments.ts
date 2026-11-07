import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {storyMomentPlans,flightFraction} from "./Engine/game/StoryMomentPlan";
import {caseExitPosition} from "./Engine/game/RoomPresentation";
/** Pike tries the taped door. This changes staging only, never testimony. */
export class RoomscriptStoryMoments {
 private seen=new Set<string>();private flight:SceneObject=null;private from:vec3;private to:vec3;private began=0;private pending=false;
 constructor(owner:BaseScriptComponent,private engine:RoomscriptEngineBridge,private flow:RoomscriptInterrogationController,private audio:RoomscriptAudio){
  engine.onCaseChanged.add(()=>{this.restore();this.seen.clear();this.pending=false;});
  engine.onState.add(state=>{if(state.verdict){this.restore();this.pending=false;return;}for(const p of storyMomentPlans(engine.graphRef(),state)){if(p.kind!=="flight"||this.seen.has(p.id))continue;this.seen.add(p.id);this.pending=true;}});
  owner.createEvent("UpdateEvent").bind(()=>this.update());
 }
 private restore():void{if(this.flight&&!isNull(this.flight))this.flight.getTransform().setWorldPosition(this.from);this.flight=null;}
 private update():void{
  if(this.flight){this.flight.getTransform().setWorldPosition(vec3.lerp(this.from,this.to,flightFraction(getTime()-this.began)));if(getTime()-this.began>=5)this.restore();return;}
  if(!this.pending||this.audio.speechBusy()||this.flow.controlsBlocked||this.flow.diagnostics().busy)return;
  const actor=this.flow.actorFor("S4");if(!actor)return;this.pending=false;this.flight=actor.getSceneObject();this.from=actor.getTransform().getWorldPosition();const p=caseExitPosition(this.engine.graphRef());this.to=this.engine.roomRoot.getTransform().getWorldTransform().multiplyPoint(new vec3(...p));this.to.y=this.from.y;this.began=getTime();
 }
 diagnostics(){return {flight:!!this.flight,pending:this.pending};}
}
