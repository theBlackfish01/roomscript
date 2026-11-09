import {RoomscriptCastController} from "./RoomscriptCastController";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptNewspaper} from "./RoomscriptNewspaper";
import {ghostArt,ghostImage,GHOST_TINT,hasFrame} from "./RoomscriptGhostArt";
import {chalkSpot} from "./Content/ChalkSpots";
import {Hypothesis,GameState,CaseGraph} from "./Engine/core/Types";
import {availableArguments} from "./Engine/game/Closing";
import {frozenTableau} from "./Engine/game/FrozenTableau";
import {scoreCase} from "./Engine/game/Scoring";
import {lineTubes,circleEdges,tinted,flatText} from "./RoomscriptLineArt";
import {uiObject} from "./RoomscriptPanelUI";
import {paperTexture} from "./RoomscriptPaper";
import {itemPicture,itemLabel} from "./RoomscriptItemPictures";
import {glyphButton} from "./RoomscriptGlyphUI";
import {propDrawing} from "./RoomscriptPropArt";
import {RoomscriptRoomMap} from "./RoomscriptRoomMap";
/** The row selects who, where and what. Only the reducer decides the verdict. */
@component export class RoomscriptClosingController extends BaseScriptComponent {
 static current:RoomscriptClosingController|null=null;@input cast:RoomscriptCastController;
 private picked:Hypothesis={who:"",where:"",what:""};private phase="idle";private opened=false;private began=0;private holdUntil=0;private holdSeconds=0;
 private glow:SceneObject;private tableau:SceneObject;private newspaper:RoomscriptNewspaper;private retiredPaper:SceneObject;private ghosts:SceneObject[]=[];private hidden:RenderMeshVisual[]=[];
 private sealedState:GameState;private sealedGraph:CaseGraph;private resultText="";private timeoutPending=false;
 private material=requireAsset("../Materials/RoomscriptCyan.mat") as Material;
 onAwake():void{RoomscriptClosingController.current=this;this.createEvent("OnStartEvent").bind(()=>{this.cast.flow.engine.onCaseChanged.add(()=>this.reset());this.cast.flow.engine.onState.add(s=>{if(s.verdict==="timeout"&&!s.accusation){this.timeoutPending=true;return;}if((s.verdict==="correct"||s.verdict==="wrong")&&!this.sealedState)this.beginEnding(s);});});this.createEvent("UpdateEvent").bind(()=>this.update());}
 open():void{
  const flow=this.cast.flow,state=flow.engine.snapshot();if(flow.diagnostics().busy||RoomscriptAudio.active?.speechBusy()||(state.verdict&&state.verdict!=="timeout"))return;
  this.picked={who:flow.diagnostics().suspect,where:"",what:""};this.opened=true;this.phase="where";flow.controlsBlocked=true;flow.modalRow=true;flow.showRow(true);
  flow.row.choices("Where?",flow.engine.graphRef().room.zones.map(z=>({id:"Where "+z.id,label:z.clueName,choose:()=>this.chooseWhere(z.id),hover:(inside:boolean)=>this.showPlace(inside?z.id:null)})),()=>this.close());
 }
 chooseWhere(id:string):void{
  if(!this.opened||!this.cast.flow.engine.graphRef().room.zones.some(z=>z.id===id))return;this.picked.where=id;this.showPlace(null);this.phase="weapon";
  const graph=this.cast.flow.engine.graphRef();this.cast.flow.row.choices("With what?",graph.weapons.map(id=>({id:"Weapon "+id,label:itemLabel(id),picture:itemPicture(id),choose:()=>this.chooseWeapon(id)})),()=>this.open());
 }
 chooseWeapon(id:string):void{
  if(!this.opened||!this.cast.flow.engine.graphRef().weapons.includes(id))return;this.picked.what=id;this.phase="seal";
  this.cast.flow.row.choices("Seal",[{id:"Break seal",label:"Seal accusation",picture:paperTexture("WaxSeal"),choose:()=>this.accuse()}],()=>this.chooseWhere(this.picked.where));
 }
 private showPlace(id:string|null):void{
  if(this.glow&&!isNull(this.glow)){this.glow.enabled=false;if(id){const spot=chalkSpot(this.cast.flow.engine.graphRef(),id,this.cast.flow.engine.mode());this.glow.getTransform().setLocalPosition(new vec3(...spot.center));this.glow.getTransform().setLocalScale(new vec3(spot.radius,1,spot.radius));this.glow.enabled=true;}return;}
  if(!id)return;this.glow=uiObject(this.cast.room.getSceneObject(),"Accusation place glow");lineTubes(this.glow,"Chalk light",circleEdges(1,48,new vec3(0,1.2,0),"xz"),tinted(this.material,new vec4(1,.85,.55,1)),.035);this.showPlace(id);
 }
 close():void{this.opened=false;this.phase="idle";this.showPlace(null);const f=this.cast.flow;f.modalRow=false;f.controlsBlocked=false;f.row.close();f.showRow(true);}
 accuse():void{
  if(this.phase!=="seal"||!this.picked.who||!this.picked.where||!this.picked.what)return;
  const f=this.cast.flow;if(f.diagnostics().busy||RoomscriptAudio.active?.speechBusy())return;
  // File only deductions already supported by collected facts; there is no separate proof interface.
  if(!f.engine.snapshot().verdict)for(const claim of availableArguments(f.engine.graphRef(),f.engine.snapshot()))f.engine.dispatch({type:"ArgumentClaim",...claim});
  RoomscriptAudio.active?.play("WaxSealPress");f.engine.dispatch({type:"Accuse",...this.picked});
 }
 private beginEnding(state:GameState):void{
  this.timeoutPending=false;this.sealedState=state;this.sealedGraph=this.cast.flow.engine.graphRef();this.opened=true;this.phase="reaction";this.began=getTime();this.showPlace(null);
  const f=this.cast.flow;f.modalRow=false;f.controlsBlocked=true;f.row.show(false);f.questions.show(false);f.engine.investigationEnabled=false;
  const accused=f.actorFor(state.accusation?.who||this.picked.who);accused?.capturePose(state.verdict==="correct"?"broken":"smug",30);
  const score=scoreCase(this.sealedGraph,state);this.resultText=state.verdict+" | "+score.rating+" / 3 | "+state.elapsedMinutes+" min";
  RoomscriptAudio.active?.endingBeat();
 }
 private hideResting(id:string):void{
  let anchor:SceneObject;try{anchor=this.cast.room.objectAnchor(id);}catch{return;}
  const visit=(o:SceneObject)=>{for(const v of o.getComponents("Component.RenderMeshVisual") as RenderMeshVisual[])if(v.enabled){v.enabled=false;this.hidden.push(v);}for(let i=0;i<o.getChildrenCount();i++)visit(o.getChild(i));};visit(anchor);
 }
 private buildFreeze():void{
  const graph=this.sealedGraph,t=frozenTableau(graph,this.sealedState);if(!t){this.showNewspaper();return;}
  this.phase="freeze";this.began=getTime();this.holdUntil=getTime()+this.holdSeconds;this.tableau=uiObject(this.cast.room.getSceneObject(),"RoomscriptFrozenTableau");
  for(const actor of this.cast.actors())actor.getSceneObject().enabled=false;
  const counts=new Map<string,number>();
  for(const figure of t.figures){
   const zone=graph.room.zones.slice().sort((a,b)=>Math.hypot(a.anchor[0]-figure.position[0],a.anchor[2]-figure.position[2])-Math.hypot(b.anchor[0]-figure.position[0],b.anchor[2]-figure.position[2]))[0];
   const zoneId=figure.suspect===graph.envelope.who||figure.suspect===graph.cast.victim.id?t.zone:zone.id,spot=chalkSpot(graph,zoneId,this.cast.flow.engine.mode()),index=counts.get(zoneId)||0;counts.set(zoneId,index+1);
   const victim=figure.suspect===graph.cast.victim.id,culprit=figure.suspect===graph.envelope.who,frame=victim?"staggering":culprit&&hasFrame(figure.suspect,"tableau")?"tableau":"neutral",art=ghostArt(figure.suspect,frame);if(!art)continue;
   const ghost=uiObject(this.tableau,"RoomscriptReconstruction_"+figure.suspect);ghost.createComponent("Component.Canvas");
   const offset=zoneId===t.zone?(victim?32:-32):index*64;
   ghost.getTransform().setLocalPosition(new vec3(spot.center[0]+offset+(spot.radius>40?spot.radius+12:0),0,spot.center[2]));ghostImage(ghost,"Frozen truth",art,victim?GHOST_TINT.victim:culprit?GHOST_TINT.culprit:GHOST_TINT.truth);this.ghosts.push(ghost);
   if(figure.holding){this.hideResting(figure.holding);const object=graph.room.objects.find(o=>o.id===figure.holding);if(object&&frame!=="tableau"){const held=uiObject(ghost,"Held weapon");held.getTransform().setLocalPosition(new vec3(art.hand?.x||0,art.hand?.y||82,14));propDrawing(held,object.id,object.type,true);}}
  }
  for(const item of t.suspended){const object=graph.room.objects.find(o=>o.id===item.object);if(!object)continue;this.hideResting(object.id);const holder=uiObject(this.tableau,"Suspended "+object.id);holder.getTransform().setLocalPosition(new vec3(...item.position));propDrawing(holder,object.id,object.type,false);}
  RoomscriptAudio.active?.reconstructionBeat("freeze");console.log("FROZEN_TABLEAU|"+JSON.stringify({slot:t.slot,zone:t.zone,figures:t.figures.map(f=>f.suspect),suspended:t.suspended.map(s=>s.object)}));
 }
 private showNewspaper():void{
  this.phase="ending";if(this.tableau)this.tableau.enabled=false;this.cast.flow.subtitles.set("NARRATOR","");
  const accused=this.cast.flow.actorFor(this.sealedState.accusation?.who||this.picked.who);
  this.newspaper=new RoomscriptNewspaper(this,this.getSceneObject(),this.cast.flow.actor.camera,this.sealedGraph,this.sealedState,this.material,accused?.portrait()||null,cue=>RoomscriptAudio.active?.play(cue));
  const another=glyphButton(this.newspaper.root,"Another case","Another case?".length+16,6,()=>this.another());another.set(paperTexture("FolderCover"),"Another case?");another.root.getTransform().setLocalPosition(new vec3(0,-21,.5));
 }
 private another():void{
  const root=this.newspaper.root;for(let i=0;i<root.getChildrenCount();i++){const c=root.getChild(i);if(c.name==="Another case")c.enabled=false;}
  if(global.deviceInfoSystem.isEditor()){
   const mapped=glyphButton(root,"Play Harlow in this room",48,7,()=>{if(RoomscriptRoomMap.current){root.enabled=false;void RoomscriptRoomMap.current.start();}});mapped.set(paperTexture("FolderCover"),"Play Harlow in this room");mapped.root.getTransform().setLocalPosition(new vec3(0,-21,.5));
  }
  const again=glyphButton(root,"Replay Harlow","Replay Harlow".length+16,6,()=>{this.cast.flow.engine.configurePreset();});again.set(paperTexture("FolderCover"),"Replay Harlow");again.root.getTransform().setLocalPosition(new vec3(0,-28,.5));
 }
 private update():void{
  if(this.timeoutPending&&!this.cast.flow.diagnostics().busy&&!RoomscriptAudio.active?.speechBusy()&&RoomscriptAudio.active?.speech.diagnostics().queued===0){this.timeoutPending=false;this.close();}
  if(this.phase==="reaction"&&getTime()-this.began>=3&&!RoomscriptAudio.active?.speechBusy()&&RoomscriptAudio.active?.speech.diagnostics().queued===0)this.buildFreeze();
  if(this.phase!=="freeze")return;
  const eye=this.cast.flow.actor.camera.getTransform().getWorldPosition();for(const ghost of this.ghosts){const d=eye.sub(ghost.getTransform().getWorldPosition());d.y=0;if(d.length>1)ghost.getTransform().setWorldRotation(quat.lookAt(d.normalize(),vec3.up()));}
  if(getTime()-this.began>=12&&getTime()>=this.holdUntil)this.showNewspaper();
 }
 private reset():void{
  this.phase="idle";this.opened=false;this.sealedState=null;this.sealedGraph=null;this.resultText="";this.timeoutPending=false;this.showPlace(null);
  if(this.tableau&&!isNull(this.tableau))this.tableau.destroy();this.tableau=null;this.ghosts=[];for(const v of this.hidden)if(!isNull(v))v.enabled=true;this.hidden=[];
  // Keep the just-pinched Replay target alive through SIK hover exit.
   // At most one disabled prior newspaper is retained across case changes.
   if(this.retiredPaper&&!isNull(this.retiredPaper))this.retiredPaper.destroy();this.retiredPaper=null;
   if(this.newspaper&&!isNull(this.newspaper.root)){this.retiredPaper=this.newspaper.root;this.retiredPaper.enabled=false;}this.newspaper=null;this.holdUntil=0;this.holdSeconds=0;
 }
 holdFreeze(seconds=20):void{this.holdUntil=getTime()+Math.min(60,seconds);}holdAtBeat(kind:string,seconds:number):void{if(kind==="freeze")this.holdSeconds=Math.min(60,seconds);}
 diagnostics(){return {phase:this.phase,opened:this.opened,picked:{...this.picked},result:this.resultText};}
 presentationDiagnostics(){return {ghosts:this.phase==="freeze"?this.ghosts.length:0};}
}
