import {placeReadingPanel} from "./RoomscriptReadingPanel";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {RoomscriptSpatialObjectionController} from "./RoomscriptSpatialObjectionController";
import {RoomscriptNotepadUI} from "./RoomscriptNotepadUI";
import {RoomscriptDragInteraction} from "./RoomscriptDragInteraction";
import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
import {worldLines,dottedSegment} from "./RoomscriptWorldLines";
import {clockwiseAngle,refuterMarks,notebookPages,privateRefutation} from "./Engine/game/CluePresentation";
import {Hypothesis,Vec3} from "./Engine/core/Types";
import {spatialDrop} from "./Engine/game/SpatialDrop";

/** Pawn staging and a private refutation sweep. Only engine events may expose a card. */
@component export class RoomscriptClueController extends BaseScriptComponent {
  @input objection:RoomscriptSpatialObjectionController;
  @input notebook:RoomscriptNotepadUI;
  @input tray:SceneObject;
  @input envelope:SceneObject;
  readonly onSelection=new Event<Hypothesis>();
  pawnDropOverride:((who:string,point:vec3)=>boolean)|null=null;
  private pawns=new Map<string,SceneObject>();private pawnHomes=new Map<string,vec3>();private crosses=new Map<string,SceneObject>();
  private suspectMarks=new Map<string,SceneObject>();private gridMarks=new Map<string,RenderMeshVisual>();private ghost:SceneObject;private blade:SceneObject;private panel:SceneObject;private cardText:Text;
  private selectedWho:string|null=null;private selectedZone:string|null=null;private hypothesis:Hypothesis|null=null;
  private origin:vec3;private localOrigin:Vec3;private localForward:Vec3;private startingYaw=0;
  private nextDetail=0;private excludedSuspects=new Set<string>();private busy=false;private began=0;private endAngle=0;private visited=0;private seq=0;private refuter:string|null=null;private resultText="";
  private order:{id:string;angle:number;position:vec3}[]=[];private lastVisited:string[]=[];private envelopeScale:vec3;private breathing=0;private breaths=0;
  private ivory:Material;private chalk:Material;private cyan:Material;
  private generated:SceneObject[]=[];
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private build():void {
    if(this.ivory)return;
    const flow=this.objection.flow,engine=flow.engine,room=this.objection.tells.room;engine.initialize();room.initialize();this.notebook.build();
    const tint=(color:vec4)=>{const material=this.objection.tells.lightMaterial.clone();material.mainPass.baseColor=color;return material;};
    this.ivory=tint(new vec4(1,.94,.84,1));this.chalk=tint(new vec4(.93,.96,1,1));this.cyan=tint(new vec4(.247,.89,1,1));
    this.envelopeScale=this.envelope.getTransform().getLocalScale();
    engine.onState.add(()=>{if(!this.busy)this.renderKnowledge();});
    engine.onCaseChanged.add(()=>this.resetForCase());this.resetForCase();
  }
  resetForCase():void {
    if(!this.ivory)return;const flow=this.objection.flow,engine=flow.engine,room=this.objection.tells.room;room.initialize();
    this.busy=false;this.breathing=0;this.breaths=0;this.selectedWho=null;this.selectedZone=null;this.hypothesis=null;this.refuter=null;this.resultText="";this.lastVisited=[];this.order=[];this.visited=0;this.seq=0;
    this.notebook.show(false);this.envelope.getTransform().setLocalScale(this.envelopeScale);this.envelope.enabled=true;
    for(const object of this.generated)if(!isNull(object))object.destroy();this.generated=[];
    this.pawns.clear();this.pawnHomes.clear();this.crosses.clear();this.gridMarks.clear();this.suspectMarks.clear();this.excludedSuspects.clear();this.nextDetail=0;
    const graph=engine.graphRef(),inverse=room.getTransform().getInvertedWorldTransform(),camera=flow.actor.camera.getTransform();
    const origin=inverse.multiplyPoint(camera.getWorldPosition()),forward=inverse.multiplyDirection(camera.getWorldRotation().multiplyVec3(vec3.back()));
    this.localOrigin=[origin.x,0,origin.z];this.localForward=[forward.x,0,forward.z];this.origin=room.toWorld([origin.x,3,origin.z]);this.startingYaw=Math.atan2(forward.x,-forward.z);
    const marks=refuterMarks(graph);
    for(const person of graph.cast.suspects){const actor=flow.actorFor(person.id)?.getSceneObject();const parent=actor||room.getSceneObject();
      const mark=worldLines(parent,"RoomscriptSuspectGrid_"+person.id,[[new vec3(-18,3,-18),new vec3(18,3,18)],[new vec3(-18,3,18),new vec3(18,3,-18)]],this.chalk.clone(),2,vec3.up()).getSceneObject();
      if(!actor)mark.getTransform().setLocalPosition(new vec3(marks[person.id][0],0,marks[person.id][2]));mark.enabled=false;this.suspectMarks.set(person.id,mark);this.generated.push(mark);
    }
    this.order=graph.refutation.order.map(id=>({id,angle:clockwiseAngle(this.localOrigin,this.localForward,marks[id]),position:room.toWorld(marks[id])}));
    graph.cast.suspects.forEach((person,index)=>{
      const pawn=uiObject(this.tray,"RoomscriptPawn_"+person.id);pawn.getTransform().setLocalPosition(new vec3((index-1.5)*12,14,3));pawn.getTransform().setWorldScale(vec3.one());
      this.generated.push(pawn);
      new PanelUI(pawn,7,12,1.6,new vec4(1,.94,.84,1),true).text("Pawn name",person.name.split(" ").slice(-1)[0][0],3,"small");
      worldLines(pawn,"Pawn silhouette",[[new vec3(-2,-4,2),new vec3(0,2,2)],[new vec3(0,2,2),new vec3(2,-4,2)],[new vec3(-2,-4,2),new vec3(2,-4,2)]],this.ivory,.65);
      const drag=pawn.createComponent(RoomscriptDragInteraction.getTypeName()) as RoomscriptDragInteraction;const shape=Shape.createBoxShape();shape.size=new vec3(7,12,3);pawn.getComponent("Physics.ColliderComponent").shape=shape;
      this.pawns.set(person.id,pawn);this.pawnHomes.set(person.id,pawn.getTransform().getLocalPosition());
      const cross=worldLines(pawn,"Pawn chalk X",[[new vec3(-2,-2,3),new vec3(2,2,3)],[new vec3(-2,2,3),new vec3(2,-2,3)]],this.chalk,.7).getSceneObject();cross.enabled=false;this.crosses.set(person.id,cross);
      drag.onDragStart.add(()=>{if(!this.busy)flow.subtitles.set("SUGGESTION",person.name+". Drag this pawn into a zone.");});drag.onDragEnd.add(()=>this.dropPawn(person.id));});
    for(const zone of graph.room.zones){const mark=worldLines(room.zoneAnchor(zone.id),"RoomscriptZoneGrid_"+zone.id,[[new vec3(-28,1,-28),new vec3(28,1,-28)],[new vec3(28,1,-28),new vec3(28,1,28)],[new vec3(28,1,28),new vec3(-28,1,28)],[new vec3(-28,1,28),new vec3(-28,1,-28)]],this.cyan.clone(),.8,vec3.up());this.gridMarks.set(zone.id,mark);this.generated.push(mark.getSceneObject());}
    for(const id of graph.weapons){const mark=worldLines(room.objectAnchor(id),"RoomscriptWeaponGrid_"+id,[[new vec3(-5,4,4),new vec3(5,4,4)],[new vec3(5,4,4),new vec3(0,10,4)],[new vec3(0,10,4),new vec3(-5,4,4)]],this.cyan.clone(),.7);this.gridMarks.set(id,mark);this.generated.push(mark.getSceneObject());}
    this.ghost=global.scene.createSceneObject("RoomscriptSuggestionGhost");this.ghost.setParent(this.getSceneObject());const outline:[vec3,vec3][]=[];
    const path=[new vec3(-14,0,0),new vec3(-25,90,0),new vec3(-16,125,0),new vec3(-12,160,0),new vec3(12,160,0),new vec3(16,125,0),new vec3(25,90,0),new vec3(14,0,0)];for(let i=0;i<path.length-1;i++)outline.push(...dottedSegment(path[i],path[i+1],8));
    worldLines(this.ghost,"Dotted hypothesis",outline,this.ivory,1.1);this.ghost.enabled=false;
    this.blade=worldLines(this.getSceneObject(),"RoomscriptRefutationBlade",[[new vec3(0,0,0),new vec3(0,0,-380)]],this.cyan,2).getSceneObject();this.blade.enabled=false;
    this.panel=uiObject(this.objection.wallet.getSceneObject().getParent(),"RoomscriptRefutationCard");this.panel.getTransform().setLocalPosition(this.objection.wallet.getTransform().getLocalPosition());const view=new PanelUI(this.panel,54,36,2.2,new vec4(1,.42,.35,1));view.text("Private card title","PRIVATE REFUTATION",4,"small");this.cardText=view.text("Private card","",19);
    view.buttons([{id:"Close refutation",label:"File card"}],()=>{this.panel.enabled=false;flow.restoreControls();this.objection.caseLid.show(true);});this.panel.enabled=false;
    this.generated.push(this.ghost,this.blade,this.panel);
    this.objection.objectHandler=id=>{if(this.busy)return true;if(!this.selectedWho)return false;if(!engine.graphRef().weapons.includes(id)){flow.subtitles.set("WREN","Touch a marked possible weapon.");return true;}this.suggest(id);return true;};
    this.renderKnowledge();
  }
  syncSetupPose():void {const state=this.objection.flow.engine.snapshot(),room=this.objection.tells.room,pose=state.setupPose;if(pose){this.localOrigin=pose.origin;this.localForward=pose.forward;}this.origin=room.toWorld([this.localOrigin[0],3,this.localOrigin[2]]);const direction=room.getTransform().getWorldTransform().multiplyDirection(new vec3(this.localForward[0],0,this.localForward[2]));this.startingYaw=Math.atan2(direction.x,-direction.z);const marks=refuterMarks(this.objection.flow.engine.graphRef());this.order=state.refuterOrder.map(id=>({id,angle:clockwiseAngle(this.localOrigin,this.localForward,marks[id]),position:room.toWorld(marks[id])}));}
  private dropPawn(id:string):void {
    const pawn=this.pawns.get(id)!,point=pawn.getTransform().getWorldPosition();pawn.getTransform().setLocalPosition(this.pawnHomes.get(id)!);pawn.getTransform().setLocalRotation(quat.quatIdentity());
    if(this.busy||this.objection.flow.engine.snapshot().verdict)return;if(this.pawnDropOverride?.(id,point))return;
    const room=this.objection.tells.room,local=room.getTransform().getInvertedWorldTransform().multiplyPoint(point),zones=this.objection.flow.engine.graphRef().room.zones;
    const origin=room.getTransform().getInvertedWorldTransform().multiplyPoint(this.objection.flow.actor.camera.getTransform().getWorldPosition());const hit=spatialDrop([origin.x,origin.y,origin.z],[local.x,local.y,local.z],zones.map(z=>({id:z.id,position:z.anchor,radius:80})),6);if(!hit)return;const zone={zone:zones.find(z=>z.id===hit)!};
    this.selectedWho=id;this.selectedZone=zone.zone.id;this.objection.close();this.objection.flow.cancel();this.objection.flow.controlsBlocked=true;this.objection.flow.chips.show(false);this.objection.flow.verbs.show(false);this.ghost.enabled=true;this.ghost.getTransform().setWorldPosition(room.toWorld([zone.zone.anchor[0],0,zone.zone.anchor[2]+55]));
    const person=this.objection.flow.engine.graphRef().cast.suspects.find(s=>s.id===id)!;this.objection.flow.subtitles.set("SUGGESTION",person.name+" in the "+zone.zone.clueName+". Touch a possible weapon.");
  }
  private suggest(weapon:string):void {
    if(!this.selectedWho||!this.selectedZone||this.busy)return;const flow=this.objection.flow;this.hypothesis={who:this.selectedWho,where:this.selectedZone,what:weapon};this.selectedWho=null;this.selectedZone=null;
    this.syncSetupPose();this.busy=true;flow.cancel();const state=flow.engine.dispatch({type:"Suggest",...this.hypothesis});this.seq=state.lastSeq;
    if(state.events.some(e=>e.seq===this.seq&&e.type==="rejected")){this.busy=false;return;}
    this.onSelection.invoke({...this.hypothesis});const card=privateRefutation(flow.engine.graphRef(),state,this.seq,"P1");this.refuter=card?.holder||null;this.resultText=card?.text||"No witness can refute this suggestion. It remains possible.";
    this.endAngle=card?this.order.find(o=>o.id===card.holder)!.angle:Math.PI*2;this.began=getTime();this.visited=0;this.lastVisited=[];this.blade.enabled=true;this.blade.getTransform().setWorldPosition(this.origin);this.objection.tells.audio.play("Ratchet");
    flow.controlsBlocked=true;flow.chips.show(false);flow.verbs.show(false);this.objection.caseLid.show(false);
  }
  private renderKnowledge():void {
    const engine=this.objection.flow.engine,state=engine.snapshot();this.notebook.setPages(notebookPages(engine.graphRef(),state));
    this.excludedSuspects=new Set(state.grid.suspects);this.crosses.forEach((cross,id)=>cross.enabled=this.excludedSuspects.has(id));this.suspectMarks.forEach((mark,id)=>mark.enabled=this.excludedSuspects.has(id));
    this.gridMarks.forEach((visual,id)=>{const excluded=state.grid.zones.includes(id)||state.grid.weapons.includes(id);const material=visual.mainMaterial;material.mainPass.baseColor=excluded?new vec4(.14,.10,.03,1):new vec4(.91,.69,.29,1);visual.mainMaterial=material;
      if(state.grid.weapons.includes(id))visual.getTransform().setLocalRotation(quat.angleAxis(Math.PI,vec3.up()));});
  }
  private updateDetail():void {
    if(!this.ivory)return;const flow=this.objection.flow,camera=flow.actor.camera.getTransform(),eye=camera.getWorldPosition(),forward=camera.getWorldRotation().multiplyVec3(vec3.back());
    const face=flow.actor.getTransform().getWorldPosition().add(new vec3(0,130,0)).sub(eye),facing=face.length>.1&&face.normalize().dot(forward)>.5;
    const conversation=flow.diagnostics().busy||(facing&&(face.length<180||flow.chips.getSceneObject().enabled||flow.verbs.getSceneObject().enabled));
    const board=this.selectedWho!==null||this.busy,explore=flow.engine.investigationEnabled&&!flow.controlsBlocked&&!conversation;
    this.gridMarks.forEach((visual,id)=>{const delta=visual.getTransform().getWorldPosition().sub(eye),inView=delta.length>.1&&delta.normalize().dot(forward)>.65;
      visual.enabled=board||(explore&&inView&&(visual.getSceneObject().name.startsWith("RoomscriptZoneGrid_")?forward.y<-.25:delta.length<180));});
    this.crosses.forEach((mark,id)=>mark.enabled=this.excludedSuspects.has(id)&&(board||explore));
    this.suspectMarks.forEach((mark,id)=>mark.enabled=this.excludedSuspects.has(id)&&(board||(explore&&forward.y<-.25)));
  }
  private update():void {
    if(getTime()>=this.nextDetail){this.nextDetail=getTime()+.2;this.updateDetail();}
    if(this.breathing){const t=Math.min(1,(getTime()-this.breathing)/1.2);this.envelope.getTransform().setLocalScale(this.envelopeScale.uniformScale(1-.12*Math.sin(t*Math.PI)));if(t===1){this.breathing=0;this.objection.flow.restoreControls();this.objection.caseLid.show(true);}}
    if(!this.busy)return;const t=Math.min(1,(getTime()-this.began)/2.4),angle=this.endAngle*t;this.blade.getTransform().setWorldRotation(this.objection.tells.room.getTransform().getWorldRotation().multiply(quat.angleAxis(-(this.startingYaw+angle),vec3.up())));
    let tick:vec3|null=null;while(this.visited<this.order.length&&this.order[this.visited].angle<=angle){const witness=this.order[this.visited++];this.lastVisited.push(witness.id);tick=witness.position;}if(tick)this.objection.tells.audio.playAt("ClockTick",tick);
    if(t===1){this.busy=false;this.blade.enabled=false;this.ghost.enabled=false;this.renderKnowledge();
      if(this.refuter){this.placeRefutationCard();this.panel.enabled=true;this.cardText.text=wrapText(this.resultText,31);this.objection.tells.audio.playAt("Chime",this.order.find(o=>o.id===this.refuter)!.position);}
      else{this.objection.flow.subtitles.set("WREN",this.resultText);this.objection.flow.restoreControls();this.objection.caseLid.show(true);}}
  }
  private placeRefutationCard():void {const flow=this.objection.flow,faces=flow.engine.graphRef().cast.suspects.map(s=>flow.actorFor(s.id)).filter(a=>!!a).map(a=>a.getTransform().getWorldPosition().add(new vec3(0,145,0)));placeReadingPanel(this.panel,flow.actor.camera,54,36,this.objection.tells.room.getTransform().getWorldPosition().y,faces);}
  showPawns(value:boolean):void {this.pawns.forEach(pawn=>{if(!isNull(pawn))pawn.enabled=value;});}
  selected():Hypothesis|null {return this.hypothesis?{...this.hypothesis}:null;}
  diagnostics():{busy:boolean;pending:string|null;refuter:string|null;visited:string[];card:string;breathing:boolean;breaths:number} {return {busy:this.busy,pending:this.selectedWho,refuter:this.refuter,visited:this.lastVisited.slice(),card:this.panel.enabled?this.resultText:"",breathing:!!this.breathing,breaths:this.breaths};}
}
