
import {RoomscriptCastController} from "./RoomscriptCastController";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {paperQuad,INK} from "./RoomscriptPaper";
import {flatText} from "./RoomscriptLineArt";
import {worldLines} from "./RoomscriptWorldLines";
import {hideLeafOverlays} from "./RoomscriptFilm";
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import {RUN10_VOICE_MANIFEST} from "./Content/Run10VoiceManifest";
import {PRESET_TABLE} from "./Content/PresetEveningRoom";
import {ghostArt} from "./RoomscriptGhostArt";
import {pendingRoomCast} from "./RoomscriptRoomCastSession";
/** One physical case file. Guests and atmosphere are present from the first frame. */
@component export class RoomscriptOpeningController extends BaseScriptComponent {
 @input cast:RoomscriptCastController;
 @input filmMode:boolean=false;
 static current:RoomscriptOpeningController|null=null;
 private phase="boot";private fixtures:SceneObject[]=[];private cover:SceneObject;private inside:SceneObject;private hint:SceneObject;private trace:string[]=[];private chalk:SceneObject[]=[];private generation=0;private introSuppressed=false;
 onAwake():void{RoomscriptOpeningController.current=this;this.createEvent("OnStartEvent").bind(()=>{this.build();this.cast.flow.engine.onCaseChanged.add(()=>this.build());});}
 private build():void{
   const generation=++this.generation;for(const o of this.fixtures)if(!isNull(o))o.destroy();this.fixtures=[];this.hint=null;this.chalk=[];this.trace=[];this.phase="file";this.introSuppressed=false;
   const flow=this.cast.flow,room=this.cast.room;flow.initialize();room.initialize();flow.engine.investigationEnabled=false;flow.controlsBlocked=false;flow.showRow(false);flow.subtitles.getSceneObject().enabled=true;
   for(const actor of this.cast.actors())actor.getSceneObject().enabled=true;
   const root=global.scene.createSceneObject("RoomscriptCaseFile");root.setParent(room.getSceneObject());root.createComponent("Component.Canvas");
   root.getTransform().setLocalPosition(new vec3(PRESET_TABLE.centre[0],PRESET_TABLE.topY+.6,PRESET_TABLE.centre[1]+34));root.getTransform().setLocalRotation(quat.fromEulerAngles(-Math.PI/2,0,0));this.fixtures.push(root);
   this.inside=paperQuad(root,"Case file inside","PhotoPaper",28,21,vec3.zero()).object;
   const portrait=ghostArt("V","standing");if(portrait)paperQuad(this.inside,"Harlow photograph",portrait.texture,6.5,13,new vec3(-7,0,.1));
   const title=flatText(this.inside,"Case time","EDMUND HARLOW\n22:30",2.6,INK.black,"title",13,8);title.getSceneObject().getTransform().setLocalPosition(new vec3(5,0,.2));this.inside.enabled=false;
   this.cover=paperQuad(root,"Open case file","FolderCover",28,21,new vec3(0,0,.3)).object;
   flatText(this.cover,"Case title","THE HARLOW TRUST",2.8,INK.oxblood,"title",25,5).getSceneObject().getTransform().setLocalPosition(new vec3(0,3,.2));
   flatText(this.cover,"Case invitation","OPEN CASE",2.2,INK.navy,"body",22,4).getSceneObject().getTransform().setLocalPosition(new vec3(0,-4,.2));
   const collider=this.cover.createComponent("Physics.ColliderComponent"),shape=Shape.createBoxShape();shape.size=new vec3(28,21,3);collider.shape=shape;
   const tap=this.cover.createComponent(Interactable.getTypeName()) as Interactable;tap.targetingMode=3;tap.onTriggerEnd.add(()=>this.finish());
   const material=(requireAsset("../Materials/RoomscriptCyan.mat") as Material).clone();material.mainPass.baseColor=new vec4(1,.84,.04,1);
   const door=room.objectAnchor("O8"),tape=global.scene.createSceneObject("RoomscriptDoorTape");tape.setParent(door);tape.createComponent("Component.Canvas");this.fixtures.push(tape);
   const doorPoint=door.getTransform().getWorldPosition(),toward=new vec3(-doorPoint.x,0,-300-doorPoint.z);tape.getTransform().setWorldRotation(quat.lookAt(toward.normalize(),vec3.up()));
   for(const [y,angle] of [[-2,.04],[-24,-.11]]){const strip=paperQuad(tape,"Crime scene tape","PhotoPaper",104,6.4,new vec3(0,y,3),new vec4(1,.84,.04,1)).object;strip.getTransform().setLocalRotation(quat.fromEulerAngles(0,0,angle));flatText(strip,"Tape print","CRIME SCENE · DO NOT CROSS",2.8,INK.black,"title",100,5).getSceneObject().getTransform().setLocalPosition(new vec3(0,0,.3));}
   const body=global.scene.createSceneObject("RoomscriptChalkBody");body.setParent(room.getSceneObject());const bodyDelta=flow.engine.graphRef().roomMapping?.zoneOffsets.Z1||[0,0,0];body.getTransform().setLocalPosition(new vec3(22+bodyDelta[0],bodyDelta[1],-405+bodyDelta[2]));body.getTransform().setLocalRotation(quat.fromEulerAngles(0,Math.PI/2,0));body.getTransform().setLocalScale(vec3.one().uniformScale(.62));this.fixtures.push(body);
   const path=[[-35,-20],[-20,-10],[-15,15],[-25,25],[-23,40],[-10,45],[0,40],[2,25],[15,15],[20,-10],[35,-20],[25,-28],[8,-15],[8,-55],[20,-78],[12,-84],[-2,-62],[-8,-40],[-16,-62],[-28,-80],[-35,-74],[-20,-52],[-20,-15],[-35,-20]];
   path.slice(1).forEach((p,i)=>this.chalk.push(worldLines(body,"Opening chalk "+i,[[new vec3(path[i][0],2,path[i][1]),new vec3(p[0],2,p[1])]],material,1.2,vec3.up()).getSceneObject()));
   if(flow.engine.graphRef().roomMapping)root.enabled=false;this.hidePreviewGeometry();this.buildHint();
   if(pendingRoomCast()){this.introSuppressed=true;this.cover.enabled=false;this.inside.enabled=false;if(this.hint)this.hint.enabled=false;}
   const begin=this.createEvent("DelayedCallbackEvent");begin.bind(()=>{this.removeEvent(begin);if(generation!==this.generation)return;RoomscriptAudio.active.openingBeat("placed");void this.introduction(generation);});begin.reset(.3);
 }
 private async introduction(generation:number):Promise<void>{for(const id of ["V10_OPEN","N10_OPEN_1","N10_OPEN_2"]){if(generation!==this.generation||this.introSuppressed)return;const line=RUN10_VOICE_MANIFEST.find(l=>l.id===id)!;this.trace.push(id);await RoomscriptAudio.active.narrate(line.speaker,line.text);}}
 /** Only isolated LEAF fixtures suppress the introduction; a physical pinch never does. */
 finish(suppressIntroduction=false):void{if(suppressIntroduction&&global.deviceInfoSystem.isEditor())this.introSuppressed=true;if(this.phase==="boot"||this.phase==="ready")return;this.phase="ready";this.cover.enabled=false;this.inside.enabled=true;if(this.hint)this.hint.enabled=false;const flow=this.cast.flow;flow.engine.investigationEnabled=true;flow.engine.configurePose();flow.restoreControls();RoomscriptAudio.active?.openingBeat("ready");this.trace.push("open");}
 private buildHint():void{if(!global.deviceInfoSystem.isEditor()||this.filmMode)return;this.hint=global.scene.createSceneObject("RoomscriptControlsHint");this.hint.setParent(this.cast.flow.actor.camera);this.hint.getTransform().setLocalPosition(new vec3(0,22,-105));this.fixtures.push(this.hint);flatText(this.hint,"Preview controls","click = pinch · right-drag = look · WASD = walk",1.5,new vec4(1,.94,.84,.6),"body",80,2.4);}
 private hidePreviewGeometry():void{if(!global.deviceInfoSystem.isEditor())return;const visit=(o:SceneObject)=>{if(["RoomscriptProbeLab","PreviewRoom","InterrogationMark"].includes(o.name)||o.name.startsWith("Standin"))o.enabled=false;for(let i=0;i<o.getChildrenCount();i++)visit(o.getChild(i));};for(let i=0;i<global.scene.getRootObjectsCount();i++)visit(global.scene.getRootObject(i));}
 setFilmMode(active:boolean):void{this.filmMode=active;if(active){hideLeafOverlays();if(this.hint)this.hint.enabled=false;}this.hidePreviewGeometry();}
 controlsHintVisible():boolean{return !!this.hint&&!isNull(this.hint)&&this.hint.enabled;}
 startMappedCase():void{this.introSuppressed=false;this.finish();void this.introduction(this.generation);}
 diagnostics(){return {phase:this.phase,trace:this.trace.slice(),chalk:this.chalk.length};}
}
