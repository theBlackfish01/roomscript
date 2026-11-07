
import {caughtReplay,CaughtReplay} from "./Engine/game/CaughtReplay";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";
import {ghostArt,ghostImage,GHOST_TINT} from "./RoomscriptGhostArt";
import {chalkSpot} from "./Content/ChalkSpots";
import {RoomscriptAudio} from "./RoomscriptAudio";
/** A caught lie earns one five-second ghost, after the next account has finished. */
export class RoomscriptObjectReplay {
 private pending:CaughtReplay[]=[];private active:SceneObject=null;private until=0;private readyAt=0;private holdUntil=0;private seen=-1;
 constructor(owner:BaseScriptComponent,private engine:RoomscriptEngineBridge,private flow:RoomscriptInterrogationController,private room:RoomscriptRoomBinding,private sound:(cue:string,at:vec3)=>void){
   engine.onState.add(state=>{if(state.verdict){this.stop();this.pending=[];return;}if(state.lastSeq===this.seen)return;this.seen=state.lastSeq;const replay=caughtReplay(engine.graphRef(),state);if(replay){this.pending.push(replay);this.readyAt=getTime()+.25;}});
   engine.onCaseChanged.add(()=>{this.stop();this.pending=[];this.seen=-1;});owner.createEvent("UpdateEvent").bind(()=>this.update());
 }
 private stop():void{if(this.active&&!isNull(this.active))this.active.destroy();this.active=null;}
 private update():void{
   if(this.active){const eye=this.flow.actor.camera.getTransform().getWorldPosition(),d=eye.sub(this.active.getTransform().getWorldPosition());d.y=0;if(d.length>1)this.active.getTransform().setWorldRotation(quat.lookAt(d.normalize(),vec3.up()));if(getTime()>Math.max(this.until,this.holdUntil))this.stop();return;}
   if(!this.pending.length||getTime()<this.readyAt||this.flow.diagnostics().busy||RoomscriptAudio.active?.speechBusy())return;
   const replay=this.pending.shift()!,graph=this.engine.graphRef(),spot=chalkSpot(graph,replay.zone,this.engine.mode()),art=ghostArt(replay.actor,"neutral");if(!art)return;
   const root=global.scene.createSceneObject("RoomscriptCaughtGhost_"+replay.actor);root.setParent(this.room.getSceneObject());root.createComponent("Component.Canvas");
   root.getTransform().setLocalPosition(new vec3(spot.center[0]+(spot.radius>40?spot.radius+12:0),0,spot.center[2]));ghostImage(root,"Truth ghost",art,GHOST_TINT.replay);this.active=root;this.until=getTime()+replay.durationSeconds;
   this.sound("GhostWhoosh",root.getTransform().getWorldPosition());console.log("CAUGHT_REPLAY|"+JSON.stringify(replay));
 }
 holdFor(seconds:number):void{this.holdUntil=getTime()+seconds;}
 diagnostics(){return {active:this.active?.name||null,queued:this.pending.length};}
}