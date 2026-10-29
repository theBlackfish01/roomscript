import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {RoomscriptSpatialObjectionController} from "./RoomscriptSpatialObjectionController";
import {RoomscriptNotepadUI} from "./RoomscriptNotepadUI";
import {RoomscriptDragInteraction} from "./RoomscriptDragInteraction";
import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
import {worldLines,dottedSegment} from "./RoomscriptWorldLines";
import {clockwiseAngle,refuterMarks,notebookPages,privateRefutation} from "./Engine/game/CluePresentation";
import {Hypothesis,Vec3} from "./Engine/core/Types";

/** Pawn staging and a private refutation sweep. Only engine events may expose a card. */
@component export class RoomscriptClueController extends BaseScriptComponent {
  @input objection:RoomscriptSpatialObjectionController;
  @input notebook:RoomscriptNotepadUI;
  @input tray:SceneObject;
  @input envelope:SceneObject;
  readonly onSelection=new Event<Hypothesis>();
  pawnDropOverride:((who:string,point:vec3)=>boolean)|null=null;
  private pawns=new Map<string,SceneObject>();private pawnHomes=new Map<string,vec3>();private crosses=new Map<string,SceneObject>();
  private gridMarks=new Map<string,RenderMeshVisual>();private ghost:SceneObject;private blade:SceneObject;private panel:SceneObject;private cardText:Text;
  private selectedWho:string|null=null;private selectedZone:string|null=null;private hypothesis:Hypothesis|null=null;
  private origin:vec3;private localOrigin:Vec3;private localForward:Vec3;private startingYaw=0;
  private busy=false;private began=0;private endAngle=0;private visited=0;private seq=0;private refuter:string|null=null;private resultText="";
  private order:{id:string;angle:number;position:vec3}[]=[];private lastVisited:string[]=[];private envelopeScale:vec3;private breathing=0;private breaths=0;
  private ivory:Material;private chalk:Material;private cyan:Material;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private build():void {
    const flow=this.objection.flow,engine=flow.engine,room=this.objection.tells.room;engine.initialize();room.initialize();this.notebook.build();
    const tint=(color:vec4)=>{const material=this.objection.tells.lightMaterial.clone();material.mainPass.baseColor=color;return material;};
    this.ivory=tint(new vec4(1,.94,.84,1));this.chalk=tint(new vec4(.93,.96,1,1));this.cyan=tint(new vec4(.247,.89,1,1));
    const graph=engine.caseGraph(),inverse=room.getTransform().getInvertedWorldTransform(),camera=flow.actor.camera.getTransform();
    const origin=inverse.multiplyPoint(camera.getWorldPosition()),forward=inverse.multiplyDirection(camera.getWorldRotation().multiplyVec3(vec3.back()));
    this.localOrigin=[origin.x,0,origin.z];this.localForward=[forward.x,0,forward.z];this.origin=room.toWorld([origin.x,3,origin.z]);this.startingYaw=Math.atan2(forward.x,-forward.z);
    const marks=refuterMarks(graph);this.order=graph.refutation.order.map(id=>({id,angle:clockwiseAngle(this.localOrigin,this.localForward,marks[id]),position:room.toWorld(marks[id])}));
    graph.cast.suspects.forEach((person,index)=>{
      const pawn=uiObject(this.tray,"RoomscriptPawn_"+person.id);pawn.getTransform().setLocalPosition(new vec3((index-1.5)*12,14,3));pawn.getTransform().setWorldScale(vec3.one());
      new PanelUI(pawn,7,12,1.6,new vec4(1,.94,.84,1),true).text("Pawn name",person.name.split(" ").slice(-1)[0][0],3,"small");
      worldLines(pawn,"Pawn silhouette",[[new vec3(-2,-4,2),new vec3(0,2,2)],[new vec3(0,2,2),new vec3(2,-4,2)],[new vec3(-2,-4,2),new vec3(2,-4,2)]],this.ivory,.65);
      const drag=pawn.createComponent(RoomscriptDragInteraction.getTypeName()) as RoomscriptDragInteraction;const shape=Shape.createBoxShape();shape.size=new vec3(7,12,3);pawn.getComponent("Physics.ColliderComponent").shape=shape;
      this.pawns.set(person.id,pawn);this.pawnHomes.set(person.id,pawn.getTransform().getLocalPosition());
      const cross=worldLines(pawn,"Pawn chalk X",[[new vec3(-2,-2,3),new vec3(2,2,3)],[new vec3(-2,2,3),new vec3(2,-2,3)]],this.chalk,.7).getSceneObject();cross.enabled=false;this.crosses.set(person.id,cross);
      drag.onDragStart.add(()=>{if(!this.busy)flow.subtitles.set("SUGGESTION",person.name+". Drag this pawn into a zone.");});drag.onDragEnd.add(()=>this.dropPawn(person.id));});
    for(const zone of graph.room.zones){const mark=worldLines(room.zoneAnchor(zone.id),"RoomscriptZoneGrid_"+zone.id,[[new vec3(-28,1,-28),new vec3(28,1,-28)],[new vec3(28,1,-28),new vec3(28,1,28)],[new vec3(28,1,28),new vec3(-28,1,28)],[new vec3(-28,1,28),new vec3(-28,1,-28)]],this.cyan.clone(),.8,vec3.up());this.gridMarks.set(zone.id,mark);}
    for(const id of graph.weapons){const mark=worldLines(room.objectAnchor(id),"RoomscriptWeaponGrid_"+id,[[new vec3(-5,4,4),new vec3(5,4,4)],[new vec3(5,4,4),new vec3(0,10,4)],[new vec3(0,10,4),new vec3(-5,4,4)]],this.cyan.clone(),.7);this.gridMarks.set(id,mark);}
    this.ghost=global.scene.createSceneObject("RoomscriptSuggestionGhost");this.ghost.setParent(this.getSceneObject());const outline:[vec3,vec3][]=[];
    const path=[new vec3(-14,0,0),new vec3(-25,90,0),new vec3(-16,125,0),new vec3(-12,160,0),new vec3(12,160,0),new vec3(16,125,0),new vec3(25,90,0),new vec3(14,0,0)];for(let i=0;i<path.length-1;i++)outline.push(...dottedSegment(path[i],path[i+1],8));
    worldLines(this.ghost,"Dotted hypothesis",outline,this.ivory,1.1);this.ghost.enabled=false;
    this.blade=worldLines(this.getSceneObject(),"RoomscriptRefutationBlade",[[new vec3(0,0,0),new vec3(0,0,-380)]],this.cyan,2).getSceneObject();this.blade.enabled=false;
    this.panel=uiObject(this.objection.wallet.getSceneObject().getParent(),"RoomscriptRefutationCard");this.panel.getTransform().setLocalPosition(this.objection.wallet.getTransform().getLocalPosition());const view=new PanelUI(this.panel,54,36,2.2,new vec4(1,.42,.35,1));view.text("Private card title","PRIVATE REFUTATION",4,"small");this.cardText=view.text("Private card","",19);
    view.buttons([{id:"Close refutation",label:"File card"}],()=>{this.panel.enabled=false;flow.chips.show(true);flow.verbs.show(true);this.objection.caseLid.show(true);});this.panel.enabled=false;
    this.envelopeScale=this.envelope.getTransform().getLocalScale();
    this.objection.objectHandler=id=>{if(this.busy)return true;if(!this.selectedWho)return false;if(!graph.weapons.includes(id)){flow.subtitles.set("WREN","Touch one of the five marked possible weapons.");return true;}this.suggest(id);return true;};
    engine.onState.add(()=>{if(!this.busy)this.renderKnowledge();});this.renderKnowledge();
  }
  private dropPawn(id:string):void {
    const pawn=this.pawns.get(id)!,point=pawn.getTransform().getWorldPosition();pawn.getTransform().setLocalPosition(this.pawnHomes.get(id)!);pawn.getTransform().setLocalRotation(quat.quatIdentity());
    if(this.busy||this.objection.flow.engine.snapshot().verdict)return;if(this.pawnDropOverride?.(id,point))return;
    const room=this.objection.tells.room,local=room.getTransform().getInvertedWorldTransform().multiplyPoint(point),zones=this.objection.flow.engine.caseGraph().room.zones;
    const zone=zones.map(z=>({zone:z,distance:Math.hypot(z.anchor[0]-local.x,z.anchor[2]-local.z)})).sort((a,b)=>a.distance-b.distance)[0];if(zone.distance>80)return;
    this.selectedWho=id;this.selectedZone=zone.zone.id;this.objection.close();this.objection.flow.cancel();this.objection.flow.chips.show(false);this.objection.flow.verbs.show(false);this.ghost.enabled=true;this.ghost.getTransform().setWorldPosition(room.toWorld([zone.zone.anchor[0],0,zone.zone.anchor[2]+55]));
    const person=this.objection.flow.engine.caseGraph().cast.suspects.find(s=>s.id===id)!;this.objection.flow.subtitles.set("SUGGESTION",person.name+" in the "+zone.zone.clueName+". Touch a possible weapon.");
  }
  private suggest(weapon:string):void {
    if(!this.selectedWho||!this.selectedZone||this.busy)return;const flow=this.objection.flow;this.hypothesis={who:this.selectedWho,where:this.selectedZone,what:weapon};this.selectedWho=null;this.selectedZone=null;
    this.busy=true;flow.cancel();const state=flow.engine.dispatch({type:"Suggest",...this.hypothesis});this.seq=state.lastSeq;
    if(state.events.some(e=>e.seq===this.seq&&e.type==="rejected")){this.busy=false;return;}
    this.onSelection.invoke({...this.hypothesis});const card=privateRefutation(flow.engine.caseGraph(),state,this.seq,"P1");this.refuter=card?.holder||null;this.resultText=card?.text||"No witness can refute this suggestion. It remains possible.";
    this.endAngle=card?this.order.find(o=>o.id===card.holder)!.angle:Math.PI*2;this.began=getTime();this.visited=0;this.lastVisited=[];this.blade.enabled=true;this.blade.getTransform().setWorldPosition(this.origin);this.objection.tells.audio.play("Ratchet");
    flow.chips.show(false);flow.verbs.show(false);this.objection.caseLid.show(false);
  }
  private renderKnowledge():void {
    const engine=this.objection.flow.engine,state=engine.snapshot();this.notebook.setPages(notebookPages(engine.caseGraph(),state));
    this.crosses.forEach((cross,id)=>cross.enabled=state.grid.suspects.includes(id));
    this.gridMarks.forEach((visual,id)=>{const excluded=state.grid.zones.includes(id)||state.grid.weapons.includes(id);const material=visual.mainMaterial;material.mainPass.baseColor=excluded?new vec4(.035,.12,.14,1):new vec4(.247,.89,1,1);visual.mainMaterial=material;
      if(state.grid.weapons.includes(id))visual.getTransform().setLocalRotation(quat.angleAxis(Math.PI,vec3.up()));});
  }
  private update():void {
    if(this.breathing){const t=Math.min(1,(getTime()-this.breathing)/1.2);this.envelope.getTransform().setLocalScale(this.envelopeScale.uniformScale(1-.12*Math.sin(t*Math.PI)));if(t===1){this.breathing=0;this.objection.flow.chips.show(true);this.objection.flow.verbs.show(true);this.objection.caseLid.show(true);}}
    if(!this.busy)return;const t=Math.min(1,(getTime()-this.began)/2.4),angle=this.endAngle*(1-Math.pow(1-t,2));this.blade.getTransform().setWorldRotation(this.objection.tells.room.getTransform().getWorldRotation().multiply(quat.angleAxis(-(this.startingYaw+angle),vec3.up())));
    let tick:vec3|null=null;while(this.visited<this.order.length&&this.order[this.visited].angle<=angle){const witness=this.order[this.visited++];this.lastVisited.push(witness.id);tick=witness.position;}if(tick)this.objection.tells.audio.playAt("ClockTick",tick);
    if(t===1){this.busy=false;this.blade.enabled=false;this.ghost.enabled=false;this.renderKnowledge();
      if(this.refuter){this.panel.enabled=true;this.cardText.text=wrapText(this.resultText,31);this.objection.tells.audio.playAt("Chime",this.order.find(o=>o.id===this.refuter)!.position);}
      else{this.objection.flow.subtitles.set("WREN",this.resultText);this.objection.flow.chips.show(true);this.objection.flow.verbs.show(true);this.objection.caseLid.show(true);}}
  }
  selected():Hypothesis|null {return this.hypothesis?{...this.hypothesis}:null;}
  diagnostics():{busy:boolean;pending:string|null;refuter:string|null;visited:string[];card:string;breathing:boolean;breaths:number} {return {busy:this.busy,pending:this.selectedWho,refuter:this.refuter,visited:this.lastVisited.slice(),card:this.panel.enabled?this.resultText:"",breathing:!!this.breathing,breaths:this.breaths};}
}
