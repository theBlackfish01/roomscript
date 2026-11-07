
import {ConversationFocus} from "./Engine/perf/ConversationFocus";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptSuspectActor} from "./RoomscriptSuspectActor";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";
import {actorPresentationMarks} from "./Content/ActorPresentationMarks";
/** Persistent people and one hysteretic conversation surface. */
@component export class RoomscriptCastController extends BaseScriptComponent {
 @input flow:RoomscriptInterrogationController;@input room:RoomscriptRoomBinding;
 @input qadir:RoomscriptSuspectActor;@input okafor:RoomscriptSuspectActor;@input pike:RoomscriptSuspectActor;
 private policy=new ConversationFocus();private cast:RoomscriptSuspectActor[]=[];private targets:SceneObject[]=[];
 private nearest="";private nextCheck=0;private previewFocusUntil=0;private automatic=false;private checks=0;private reason="";
 onAwake():void{this.createEvent("OnStartEvent").bind(()=>{this.flow.initialize();this.cast=[this.qadir,this.flow.actor,this.okafor,this.pike];this.reset();this.flow.engine.onCaseChanged.add(()=>this.reset());this.flow.onSuspectSelected.add(id=>{this.placeUI(id);if(global.deviceInfoSystem.isEditor()&&!this.automatic)this.previewFocusUntil=getTime()+60;});});this.createEvent("UpdateEvent").bind(()=>this.update());}
 private reset():void{
   this.room.initialize();for(const t of this.targets)if(!isNull(t))t.destroy();this.targets=[];this.policy.reset();this.nearest="";this.previewFocusUntil=0;
   const graph=this.flow.engine.graphRef(),marks=actorPresentationMarks(graph,this.flow.engine.mode());
   for(const actor of this.cast){this.flow.registerActor(actor);actor.getTransform().setWorldPosition(this.room.toWorld(marks[actor.suspect]));actor.getSceneObject().enabled=true;
     const target=global.scene.createSceneObject("Question "+actor.suspect);target.setParent(actor.getSceneObject());const h=actor.heights();target.getTransform().setLocalPosition(new vec3(0,h.top*.5,8));
     const shape=Shape.createBoxShape();shape.size=new vec3(Math.min(64,h.width*.72),h.top*.78,18);const collider=target.createComponent("Physics.ColliderComponent");collider.shape=shape;
     const pinch=target.createComponent(Interactable.getTypeName()) as Interactable;pinch.targetingMode=3;pinch.onTriggerEnd.add(()=>{if(this.flow.controlsBlocked||!this.flow.engine.investigationEnabled)return;this.previewFocusUntil=global.deviceInfoSystem.isEditor()?getTime()+60:0;this.focus(actor.suspect);});this.targets.push(target);
   }
   this.automatic=true;this.flow.selectSuspect("S2");this.automatic=false;
 }
 private placeUI(id:string):void{
   const actor=this.flow.actorFor(id);if(!actor)return;const eye=this.flow.actor.camera.getTransform().getWorldPosition(),p=actor.getTransform().getWorldPosition(),h=actor.heights();
   let toward=eye.sub(p);toward.y=0;toward=toward.length>1?toward.normalize():vec3.forward();const right=vec3.up().cross(toward).normalize(),facing=quat.lookAt(toward,vec3.up());
   if(this.flow.row){const t=this.flow.row.root.getTransform();t.setWorldScale(vec3.one());t.setWorldPosition(p.add(new vec3(0,h.chest,0)).add(right.uniformScale(24)).add(toward.uniformScale(20)));t.setWorldRotation(facing);}
   const caption=this.flow.subtitles.getTransform();caption.setWorldScale(vec3.one());caption.setWorldPosition(p.add(new vec3(0,h.subtitle,0)).add(toward.uniformScale(20)));caption.setWorldRotation(facing);
 }
 private focus(id:string):void{this.nearest=id;this.policy.select(id);this.automatic=true;this.flow.selectSuspect(id);this.automatic=false;this.flow.showRow(true);}
 private update():void{
   if(!this.cast.length||getTime()<this.nextCheck)return;this.nextCheck=getTime()+.05;this.checks++;
   const speaker=RoomscriptAudio.active?.speech.diagnostics().active?.speaker;this.placeUI(speaker&&this.flow.actorFor(speaker)?speaker:this.flow.diagnostics().suspect);
   if(this.flow.modalRow)return;
   this.reason=this.flow.controlsBlocked?"modal":!this.flow.engine.investigationEnabled?"opening":this.flow.diagnostics().busy?"speaking":getTime()<this.previewFocusUntil?"Preview fallback":"scanned";
   if(this.reason!=="scanned"){this.flow.showRow(this.reason==="speaking"||this.reason==="Preview fallback");return;}
   const cam=this.flow.actor.camera.getTransform(),eye=cam.getWorldPosition(),forward=cam.getWorldRotation().multiplyVec3(vec3.back());
   const samples=this.cast.filter(a=>a.getSceneObject().enabled).map(a=>{const d=a.getTransform().getWorldPosition().add(new vec3(0,a.heights().facing,0)).sub(eye);return {id:a.suspect,distanceCm:d.length,dot:d.length>.01?d.normalize().dot(forward):1};});
   const best=this.policy.update(getTime(),samples);if(best&&best!==this.nearest)this.focus(best);else if(!best){this.nearest="";this.flow.showRow(false);}else this.flow.showRow(true);
 }
 clearPreviewFocus():void{this.previewFocusUntil=0;}
 proximityState(){return {nearest:this.nearest,previewFallback:getTime()<this.previewFocusUntil,checks:this.checks,reason:this.reason};}
 actors():RoomscriptSuspectActor[]{return this.cast.slice();}
}