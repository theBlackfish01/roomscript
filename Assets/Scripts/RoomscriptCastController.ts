import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptSuspectActor} from "./RoomscriptSuspectActor";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";
import {PanelUI,uiObject} from "./RoomscriptPanelUI";
import {actorPresentationMarks} from "./Content/ActorPresentationMarks";

/** Registers four persistent identities. Selecting one changes presentation, never engine truth. */
@component export class RoomscriptCastController extends BaseScriptComponent {
  @input @hint("Question and voice routing") flow:RoomscriptInterrogationController;
  @input @hint("Shared case floor frame") room:RoomscriptRoomBinding;
  @input @hint("Qadir actor") qadir:RoomscriptSuspectActor;
  @input @hint("Okafor actor") okafor:RoomscriptSuspectActor;
  @input @hint("Pike actor") pike:RoomscriptSuspectActor;
  private proximityChecks=0;private proximityReason="startup";private automaticSelection=false;private accusationTargets:SceneObject[]=[];private accusationSelect:((id:string)=>void)|null=null;
  private cast:RoomscriptSuspectActor[]=[];private cards:SceneObject[]=[];private nearest="";private nextCheck=0;private previewFocusUntil=0;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.proximity());}
  private build():void {
    this.flow.initialize();this.room.initialize();this.cast=[this.qadir,this.flow.actor,this.okafor,this.pike];
    this.resetForCase();this.flow.engine.onCaseChanged.add(()=>this.resetForCase());this.flow.onSuspectSelected.add(id=>{this.placeUI(id);if(global.deviceInfoSystem.isEditor()&&!this.automaticSelection)this.previewFocusUntil=getTime()+60;});
  }
  private resetForCase():void {
    this.room.initialize();this.cards.forEach(o=>{if(!isNull(o))o.destroy();});this.cards=[];this.accusationTargets.forEach(o=>{if(!isNull(o))o.destroy();});this.accusationTargets=[];this.accusationSelect=null;this.nearest="";this.previewFocusUntil=0;
    const graph=this.flow.engine.graphRef(),marks=actorPresentationMarks(graph,this.flow.engine.mode());
    const used:vec3[]=[];
    for(const actor of this.cast){this.flow.registerActor(actor);let mark=this.room.toWorld(marks[actor.suspect]);while(used.some(p=>p.distance(mark)<65))mark=mark.add(new vec3(70,0,0));used.push(mark);actor.getTransform().setWorldPosition(mark);actor.getSceneObject().enabled=true;
      const person=graph.cast.suspects.find(p=>p.id===actor.suspect)!,card=uiObject(actor.getSceneObject(),"RoomscriptSelect_"+actor.suspect);card.getTransform().setLocalPosition(new vec3(0,182,8));
      const target=global.scene.createSceneObject("RoomscriptAccuse_"+actor.suspect);target.setParent(actor.getSceneObject());target.getTransform().setLocalPosition(new vec3(0,85,8));
      const shape=Shape.createBoxShape();shape.size=new vec3(64,130,18);const collider=target.createComponent("Physics.ColliderComponent");collider.shape=shape;
      const interaction=target.createComponent(Interactable.getTypeName()) as Interactable;interaction.targetingMode=3;
      interaction.onTriggerEnd.add(()=>{if(this.accusationSelect)this.accusationSelect(actor.suspect);});target.enabled=false;this.accusationTargets.push(target);
      this.cards.push(card);const ui=new PanelUI(card,46,12,1.8,new vec4(1,.94,.84,1),false,true);ui.buttons([{id:"Question "+actor.suspect,label:person.name.split(" ").slice(-1)[0]}],()=>{if(this.accusationSelect){this.accusationSelect(actor.suspect);return;}this.previewFocusUntil=getTime()+60;this.focus(actor.suspect);},8);
    }
    this.automaticSelection=true;this.flow.selectSuspect(graph.cast.suspects.find(s=>s.id==="S2")?.id||graph.cast.suspects[0].id);this.automaticSelection=false;this.placeUI(graph.cast.suspects.find(s=>s.id==="S2")?.id||graph.cast.suspects[0].id);
  }
  /** SIK indirect ray + pinch changes the candidate only; Closing owns the seal. */
  setAccusationTargeting(select:((id:string)=>void)|null):void {this.accusationSelect=select;this.accusationTargets.forEach(o=>o.enabled=!!select);this.cards.forEach(o=>o.enabled=!select);}
  accusationTargeting():boolean {return !!this.accusationSelect;}
  private placeUI(id:string):void {const actor=this.flow.actorFor(id);if(!actor)return;for(const panel of [this.flow.chips,this.flow.verbs,this.flow.subtitles])panel.getTransform().setWorldScale(vec3.one());const p=actor.getTransform().getWorldPosition();this.flow.chips.getTransform().setWorldPosition(p.add(new vec3(25,95,12)));this.flow.verbs.getTransform().setWorldPosition(p.add(new vec3(25,95,12)));this.flow.subtitles.getTransform().setWorldPosition(p.add(new vec3(0,115,16)));}
  private focus(id:string):void {this.nearest=id;this.automaticSelection=true;this.flow.selectSuspect(id);this.automaticSelection=false;this.placeUI(id);this.flow.chips.show(true);this.flow.verbs.show(false);}
  private proximity():void {
    if(!this.cast.length||getTime()<this.nextCheck)return;this.nextCheck=getTime()+.2;this.proximityChecks++;
    const camera=this.flow.actor.camera.getTransform(),eye=camera.getWorldPosition(),forward=camera.getWorldRotation().multiplyVec3(vec3.back());
    for(const ui of [this.flow.chips,this.flow.verbs,this.flow.subtitles])ui.getTransform().setWorldRotation(camera.getWorldRotation());
    this.proximityReason=this.flow.controlsBlocked?"modal":this.accusationSelect?"accusation":!this.flow.engine.investigationEnabled?"opening":this.flow.diagnostics().busy?"speaking":getTime()<this.previewFocusUntil?"Preview fallback":"scanned";
    if(this.proximityReason!=="scanned")return;
    let best="",distance=150;for(const actor of this.cast){if(!actor.getSceneObject().enabled)continue;const delta=actor.getTransform().getWorldPosition().add(new vec3(0,130,0)).sub(eye),d=delta.length;if(d<distance&&delta.normalize().dot(forward)>.55){best=actor.suspect;distance=d;}}
    if(best&&best!==this.nearest)this.focus(best);else if(!best){this.nearest="";this.flow.chips.show(false);this.flow.verbs.show(false);}
  }
  proximityState():{nearest:string;previewFallback:boolean;checks:number;reason:string}{return {nearest:this.nearest,previewFallback:getTime()<this.previewFocusUntil,checks:this.proximityChecks,reason:this.proximityReason};}
  actors():RoomscriptSuspectActor[] {return this.cast.slice();}
}
