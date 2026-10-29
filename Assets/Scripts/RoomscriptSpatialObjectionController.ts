import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
import {RoomscriptDragInteraction} from "./RoomscriptDragInteraction";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptTellVisual} from "./RoomscriptTellVisual";
import {RoomscriptEvidenceWalletUI} from "./RoomscriptEvidenceWalletUI";
import {RoomscriptCaseLidUI} from "./RoomscriptCaseLidUI";
import {objectDropEvidence,provenMark,walletEntries} from "./Engine/game/SpatialObjection";

/** Spatial presentation of engine judgements. The drop contains observed IDs only. */
@component export class RoomscriptSpatialObjectionController extends BaseScriptComponent {
  @input flow:RoomscriptInterrogationController;
  @input tells:RoomscriptTellVisual;
  @input wallet:RoomscriptEvidenceWalletUI;
  @input caseLid:RoomscriptCaseLidUI;
  // Native VFX instantiation is pending the requested VirtualScene exception.
  private shatterAsset:VFXAsset|null=null;
  @input @hint("Diagnostic slow motion; production 1") timelineScale:number=1;
  @input @hint("Diagnostic particle preview; production false") shatterPreview:boolean=false;
  private slip:SceneObject;private slipText:Text;private memory:SceneObject;private memoryText:Text;private stamp:SceneObject;
  private hint:Text;private drag:RoomscriptDragInteraction;private particles:VFXComponent;
  private selected:string|null=null;private opened=false;private phase="idle";private began=0;private correct=false;
  private home:vec3;private destination:vec3|null=null;private dropped:vec3;private ribbon:SceneObject;private pathMeshes:RenderMeshVisual[]=[];
  private oldMark:vec3;private claim="";private develops=0;private phaseHistory:string[]=[];
  private memories:{id:string;canonical:string}[]=[];private memoryIndex=0;
  private controls:SceneObject;private burstAt=0;
  objectHandler:((id:string)=>boolean)|null=null;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private build():void {
    this.flow.initialize();this.tells.room.initialize();this.wallet.build();
    const root=this.getSceneObject();
    this.slip=uiObject(root,"RoomscriptStatementSlip");this.slip.getTransform().setLocalPosition(new vec3(-20,0,0));
    const slipView=new PanelUI(this.slip,32,17,1.35,new vec4(.247,.89,1,1),true);slipView.text("Slip title","STATEMENT",3,"small");this.slipText=slipView.text("Slip claim","",10);
    this.drag=this.slip.createComponent(RoomscriptDragInteraction.getTypeName()) as RoomscriptDragInteraction;
    this.drag.onDragEnd.add(()=>this.drop());this.home=this.slip.getTransform().getLocalPosition();
    this.memory=uiObject(root,"RoomscriptMemoryCard");this.memory.getTransform().setLocalPosition(new vec3(20,0,0));
    const card=new PanelUI(this.memory,32,32,1.25,new vec4(1,.42,.35,1));card.text("Memory title","OBJECTS REMEMBER",3,"small");this.memoryText=card.text("Memory text","",16);
    card.buttons([{id:"Previous memory",label:"Previous"},{id:"Next memory",label:"Next"}],id=>{if(!this.memories.length)return;this.memoryIndex=(this.memoryIndex+(id==="Next memory"?1:this.memories.length-1))%this.memories.length;this.memoryText.text=wrapText(this.memories[this.memoryIndex].canonical,26);});
    card.buttons([{id:"Close memory",label:"Close"}],()=>this.close());
    const controls=uiObject(root,"ObjectionControls");this.controls=controls;controls.getTransform().setLocalPosition(new vec3(0,-23,0));
    const ui=new PanelUI(controls,60,11,1.25,new vec4(.93,.96,1,1));this.hint=ui.text("Drop instructions","Drag the statement onto an object or memory.",4,"small");
    ui.buttons([{id:"Objection wallet",label:"Choose memory"},{id:"Cancel objection",label:"Cancel"}],id=>{if(id==="Cancel objection")this.close();else{this.wallet.show(true);this.getSceneObject().enabled=false;}});
    this.stamp=uiObject(root,"RoomscriptObjectionStamp");this.stamp.getTransform().setLocalPosition(new vec3(0,7,8));new PanelUI(this.stamp,64,12,2,new vec4(1,.42,.35,1)).text("Objection word","OBJECTION",7,"title");this.stamp.enabled=false;
    const particleRoot=global.scene.createSceneObject("RoomscriptClaimShatter");this.particles=particleRoot.createComponent("Component.VFXComponent") as VFXComponent;
    this.particles.asset=this.shatterAsset;this.particles.emitting=false;this.particles.clear();
    if(this.shatterPreview){particleRoot.getTransform().setWorldPosition(new vec3(0,0,-100));this.particles.worldBoundsCenter=new vec3(0,0,-100);this.particles.cullingBoundsSize=new vec3(200,200,200);this.particles.enabled=true;this.particles.emitting=true;this.particles.restart();const check=this.createEvent("DelayedCallbackEvent");check.bind(()=>console.log("SHATTER_DEBUG|"+JSON.stringify({asset:this.particles.asset.name,type:this.particles.asset.getTypeName(),time:this.particles.time(),enabled:this.particles.enabled,paused:this.particles.paused,emitting:this.particles.emitting})));check.reset(1);}
    this.ribbon=global.scene.createSceneObject("RoomscriptObjectionPaths");this.ribbon.enabled=false;
    this.flow.onObjectRequested.add(()=>this.open());
    this.wallet.onSelect.add(id=>{this.wallet.show(false);this.selected=id;this.open(id);});
    this.wallet.onClose.add(()=>{if(this.opened)this.close();});
    const graph=this.flow.engine.caseGraph();
    graph.room.objects.forEach(object=>{const anchor=this.tells.room.objectAnchor(object.id),shape=Shape.createBoxShape();shape.size=new vec3(16,16,16);
      const collider=anchor.createComponent("Physics.ColliderComponent");collider.shape=shape;
      const interaction=anchor.createComponent(Interactable.getTypeName()) as Interactable;interaction.targetingMode=3;interaction.onTriggerEnd.add(()=>{if(this.objectHandler?.(object.id))return;if(!this.opened)this.inspect(object.id);});});
    this.flow.engine.onState.add(()=>this.refreshWallet());this.refreshWallet();this.getSceneObject().enabled=this.shatterPreview;
  }
  private refreshWallet():void {this.wallet.setEntries(walletEntries(this.flow.engine.caseGraph(),this.flow.engine.snapshot()));}
  inspect(object:string):void {
    if(this.phase!=="idle")return;this.flow.cancel();const state=this.flow.engine.dispatch({type:"PinchObject",object});
    const entries=this.flow.engine.caseGraph().evidence.filter(e=>e.holder===object&&state.knowledge.evidenceIds.includes(e.id));
    this.getSceneObject().enabled=true;this.controls.enabled=true;this.opened=true;this.slip.enabled=false;this.memory.enabled=true;this.selected=entries.length===1?entries[0].id:null;
    this.memories=entries;this.memoryIndex=0;this.memory.getTransform().setLocalPosition(new vec3(0,0,0));this.memoryText.text=wrapText(entries[0]?.canonical||"No memory has surfaced yet.",26);this.hint.text=entries.length+" memories filed in your evidence wallet.";
    this.develops=getTime();this.memory.getTransform().setLocalScale(vec3.one().uniformScale(.03));this.modal(true);
    this.tells.audio.playAt("Chime",this.tells.room.objectAnchor(object).getTransform().getWorldPosition());
  }
  open(evidence?:string):void {
    if(this.phase!=="idle")return;const state=this.flow.engine.snapshot(),claim=this.flow.engine.caseGraph().statements.find(s=>s.id===state.activeStatement);
    if(!claim||claim.speaker!==this.flow.diagnostics().suspect){this.flow.subtitles.set("WREN","Ask a question before challenging an account.");return;}
    const entry=walletEntries(this.flow.engine.caseGraph(),state).find(e=>e.id===evidence);
    this.flow.cancel();this.claim=claim.id;this.opened=true;this.selected=entry?entry.id:null;
    this.getSceneObject().enabled=true;this.controls.enabled=true;this.slip.enabled=true;this.slip.getTransform().setLocalPosition(this.home);this.slipText.text=wrapText(claim.canonical,30);
    this.memory.enabled=!!this.selected;this.memory.getTransform().setLocalPosition(new vec3(20,0,0));this.memories=[];if(entry)this.memoryText.text=wrapText(entry.text,26);
    this.hint.text="Drag the statement onto an object or memory.";this.modal(true);
  }
  close():void {if(this.phase!=="idle")return;this.opened=false;this.getSceneObject().enabled=false;this.modal(false);}
  private modal(active:boolean):void {this.flow.chips.show(!active);this.flow.verbs.show(!active);this.caseLid.show(!active);}
  private drop():void {
    if(!this.opened||this.phase!=="idle"||!this.slip.enabled)return;const point=this.slip.getTransform().getWorldPosition(),graph=this.flow.engine.caseGraph(),state=this.flow.engine.snapshot();let evidence:string[]=[];
    if(this.selected&&point.distance(this.memory.getTransform().getWorldPosition())<22)evidence=[this.selected];
    else {const object=graph.room.objects.map(o=>({id:o.id,distance:point.distance(this.tells.room.objectAnchor(o.id).getTransform().getWorldPosition())})).sort((a,b)=>a.distance-b.distance)[0];
      if(object.distance<24)evidence=objectDropEvidence(graph,state,object.id);}
    if(!evidence.length){this.hint.text="Inspect the object, or choose a specific collected memory.";this.slip.getTransform().setLocalPosition(this.home);return;}
    this.flow.cancel();this.flow.actor.setFrozen(true);this.oldMark=this.flow.actor.getTransform().getWorldPosition();
    const result=this.flow.engine.dispatch({type:"Object",suspect:this.flow.diagnostics().suspect,statement:this.claim,evidence});
    this.correct=result.events.some(e=>e.seq===result.lastSeq&&e.type==="objectionCorrect");
    if(result.events.some(e=>e.seq===result.lastSeq&&e.type==="rejected")){this.flow.actor.setFrozen(false);this.close();return;}
    const mark=this.correct?provenMark(graph,result.activeStatement!):null;this.destination=mark?this.tells.room.toWorld(mark):null;
    this.dropped=point;this.began=getTime();this.phaseHistory=[];this.setPhase(this.correct?"silence":"bounce");this.tells.audio.silence(this.correct);
  }
  private setPhase(value:string):void {this.phase=value;this.phaseHistory.push(value);}
  private path(start:vec3,end:vec3,color:vec4):void {
    const root=global.scene.createSceneObject("ObjectionPath");root.setParent(this.ribbon);const mesh=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2}]);mesh.topology=MeshTopology.Triangles;mesh.indexType=MeshIndexType.UInt16;
    const side=end.sub(start).cross(vec3.up()).normalize().uniformScale(1.1),points=[start.sub(side),start.add(side),end.add(side),end.sub(side)],vertices:number[]=[];
    points.forEach((p,i)=>vertices.push(p.x,p.y,p.z,0,1,0,i<2?0:1,i===0||i===3?0:1));mesh.appendVerticesInterleaved(vertices);mesh.appendIndices([0,1,2,0,2,3]);
    const visual=root.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;visual.mesh=mesh.getMesh();visual.mainMaterial=this.tells.lightMaterial.clone();visual.mainMaterial.mainPass.baseColor=color;mesh.updateMesh();this.pathMeshes.push(visual);
  }
  private update():void {
    if(this.develops){const t=Math.min(1,(getTime()-this.develops)/.65);this.memory.getTransform().setLocalScale(vec3.one().uniformScale(Math.max(.03,t)));if(t===1)this.develops=0;}
    if(this.phase==="idle")return;const t=(getTime()-this.began)/this.timelineScale;
    if(this.phase==="bounce") {this.slip.getTransform().setWorldPosition(vec3.lerp(this.dropped,this.getTransform().getWorldTransform().multiplyPoint(this.home),Math.min(1,t/1.2)).add(new vec3(0,Math.sin(Math.min(1,t/1.2)*Math.PI)*8,0)));
      this.hint.text="That memory does not contradict this statement.";if(t>=1.2){this.flow.actor.setFrozen(false);this.setPhase("idle");}return;}
    if(t>=.25&&this.phase==="silence") {this.setPhase("slam");this.stamp.enabled=true;this.memory.enabled=false;this.controls.enabled=false;this.tells.audio.silence(false);this.tells.audio.play("Objection");
      this.pathMeshes.forEach(v=>v.getSceneObject().destroy());this.pathMeshes=[];this.ribbon.enabled=true;
      const graph=this.flow.engine.caseGraph(),source=graph.statements.find(s=>s.id===this.claim),object=source?.about&&graph.room.objects.find(o=>o.id===source.about);
      const claimed=object?this.tells.room.toWorld([object.pos[0],0,object.pos[2]]):this.oldMark.add(new vec3(-40,0,-30));
      const origin=this.oldMark.add(new vec3(0,2,0));if(claimed.distance(origin)>1)for(let i=0;i<12;i++)this.path(vec3.lerp(origin,claimed,i/12),vec3.lerp(origin,claimed,(i+.65)/12),new vec4(.247,.89,1,1));if(this.destination&&this.destination.distance(origin)>1)this.path(origin,this.destination.add(new vec3(0,2,0)),new vec4(1,.42,.35,1));}
    if(t>=.25&&t<1.2)this.pathMeshes.slice(0,12).forEach((visual,i)=>visual.getTransform().setLocalPosition(new vec3(Math.max(0,t-.45)*(i%2?12:-12),Math.max(0,t-.45)*18,0)));
    if(this.phase==="slam")this.stamp.getTransform().setLocalScale(vec3.one().uniformScale(1+Math.max(0,.5-t)*3));
    if(t>=.65&&this.phase==="slam") {this.setPhase("shatter");this.slip.enabled=false;if(this.particles.asset){const point=this.dropped.add(new vec3(0,0,8));this.particles.getTransform().setWorldPosition(point);this.particles.worldBoundsCenter=point;this.particles.cullingBoundsSize=new vec3(180,180,180);this.particles.paused=false;this.particles.restart();this.particles.emitting=true;this.burstAt=getTime();}}
    if(this.burstAt&&getTime()-this.burstAt>=.09&&this.particles.emitting){this.particles.emitting=false;console.log("SHATTER|"+JSON.stringify({asset:this.particles.asset.name,time:this.particles.time(),position:this.particles.getTransform().getWorldPosition().toString()}));}
    if(this.timelineScale>1&&this.phase==="shatter"&&getTime()-this.burstAt>=.2)this.particles.paused=true;
    if(t>=1.2&&this.phase==="shatter") {this.setPhase("walk");this.particles.paused=false;this.flow.actor.setFrozen(false);this.stamp.enabled=false;if(this.destination)this.tells.relocateMark(this.destination);}
    if(t>=2.8&&this.phase==="walk") {this.ribbon.enabled=false;this.setPhase("idle");this.close();const state=this.flow.engine.snapshot(),topic=this.flow.engine.caseGraph().statements.find(s=>s.id===state.activeStatement)?.topic||"unclear";void this.flow.perform("Explain the evidence.","chip",topic);}
  }
  diagnostics():{phase:string;correct:boolean;history:string[];opened:boolean;selected:string|null} {return {phase:this.phase,correct:this.correct,history:this.phaseHistory.slice(),opened:this.opened,selected:this.selected};}
}
