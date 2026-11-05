import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
import {RoomscriptDragInteraction} from "./RoomscriptDragInteraction";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptTellVisual} from "./RoomscriptTellVisual";
import {RoomscriptEvidenceWalletUI} from "./RoomscriptEvidenceWalletUI";
import {RoomscriptCaseLidUI} from "./RoomscriptCaseLidUI";
import {objectDropEvidence,provenMark,walletEntries} from "./Engine/game/SpatialObjection";
import {spatialDrop} from "./Engine/game/SpatialDrop";
import {worldLines} from "./RoomscriptWorldLines";

/** Spatial presentation of engine judgements. The drop contains observed IDs only. */
@component export class RoomscriptSpatialObjectionController extends BaseScriptComponent {
  @input flow:RoomscriptInterrogationController;
  @input tells:RoomscriptTellVisual;
  @input wallet:RoomscriptEvidenceWalletUI;
  @input caseLid:RoomscriptCaseLidUI;
  @input @hint("Existing RoomscriptShatter scene object; disabled until a correct objection") shatterObject:SceneObject;
  @input @hint("Diagnostic slow motion; production 1") timelineScale:number=1;
  @input @hint("Diagnostic particle preview; production false") shatterPreview:boolean=false;
  private cyan:Material;private coral:Material;private stateCache:import("./Engine/core/Types").GameState;private slip:SceneObject;private slipText:Text;private memory:SceneObject;private memoryText:Text;private stamp:SceneObject;
  private hint:Text;private drag:RoomscriptDragInteraction;private particles:VFXComponent;
  private selected:string|null=null;private opened=false;private phase="idle";private began=0;private correct=false;
  private home:vec3;private destination:vec3|null=null;private dropped:vec3;private ribbon:SceneObject;private pathMeshes:RenderMeshVisual[]=[];
  private oldMark:vec3;private claim="";private develops=0;private phaseHistory:string[]=[];
  private memories:{id:string;canonical:string}[]=[];private memoryIndex=0;
  private controls:SceneObject;private burstAt=0;private burstCount=0;private jitterFrame=0;private evidencePoint:vec3;
  private shards:{object:SceneObject;start:vec3;velocity:vec3;spin:number}[]=[];
  private targets:{collider:ColliderComponent;interaction:Interactable}[]=[];
  private photo:SceneObject;private photoLabel:Text;private photoSymbols=new Map<string,SceneObject>();
  private pullObject:string|null=null;private pullOrigin:vec3;private pullDelta:vec3;private pullingLift=false;private pullCommitted=false;
  private suppressTapObject="";private suppressTapUntil=0;private pullCount=0;private liftCount=0;
  objectHandler:((id:string)=>boolean)|null=null;
  /** LEAF-only inspection hold; empty in production. */
  captureAt="";
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private build():void {
    if(this.slip)return;
    this.flow.initialize();this.tells.room.initialize();this.wallet.build();this.stateCache=this.flow.engine.snapshot();this.flow.engine.onState.add(state=>this.stateCache=state);this.cyan=this.tells.lightMaterial.clone();this.cyan.mainPass.baseColor=new vec4(.247,.89,1,1);this.coral=this.tells.lightMaterial.clone();this.coral.mainPass.baseColor=new vec4(1,.42,.35,1);
    const root=this.getSceneObject();
    this.slip=uiObject(root,"RoomscriptStatementSlip");this.slip.getTransform().setLocalPosition(new vec3(-20,0,0));
    const slipView=new PanelUI(this.slip,32,17,1.35,new vec4(.247,.89,1,1),true);slipView.text("Slip title","STATEMENT",3,"small");this.slipText=slipView.text("Slip claim","",10);
    this.drag=this.slip.createComponent(RoomscriptDragInteraction.getTypeName()) as RoomscriptDragInteraction;
    this.drag.onDragUpdate.add(point=>{const id=this.dropTarget(point);this.hint.text=id?"Release on "+(id==="selected"?"selected memory":this.flow.engine.graphRef().room.objects.find(o=>o.id===id)!.label):"Align the slip with a marker, then release.";});this.drag.onDragEnd.add(()=>this.drop());this.home=this.slip.getTransform().getLocalPosition();
    this.memory=uiObject(root,"RoomscriptMemoryCard");this.memory.getTransform().setLocalPosition(new vec3(20,0,0));
    const card=new PanelUI(this.memory,32,32,1.25,new vec4(1,.42,.35,1));card.text("Memory title","OBJECTS REMEMBER",3,"small");this.memoryText=card.text("Memory text","",16);
    card.buttons([{id:"Previous memory",label:"Previous"},{id:"Next memory",label:"Next"}],id=>{if(!this.memories.length)return;this.memoryIndex=(this.memoryIndex+(id==="Next memory"?1:this.memories.length-1))%this.memories.length;this.memoryText.text=wrapText(this.memories[this.memoryIndex].canonical,26);});
    card.buttons([{id:"Close memory",label:"Close"}],()=>this.close());
    const controls=uiObject(root,"ObjectionControls");this.controls=controls;controls.getTransform().setLocalPosition(new vec3(0,-23,0));
    const ui=new PanelUI(controls,60,11,1.25,new vec4(.93,.96,1,1));this.hint=ui.text("Drop instructions","Drag the statement onto an object or memory.",4,"small");
    ui.buttons([{id:"Objection wallet",label:"Choose memory"},{id:"Cancel objection",label:"Cancel"}],id=>{if(id==="Cancel objection")this.close();else{this.wallet.show(true);this.getSceneObject().enabled=false;}});
    this.stamp=uiObject(root,"RoomscriptObjectionStamp");this.stamp.getTransform().setLocalPosition(new vec3(0,7,8));new PanelUI(this.stamp,64,12,2,new vec4(1,.82,.15,1),true,true).text("Objection word","OBJECTION",7,"title");this.stamp.enabled=false;
    this.particles=this.shatterObject.getComponent("Component.VFXComponent") as VFXComponent;
    this.particles.emitting=false;this.particles.clear();this.shatterObject.enabled=false;
    if(!this.particles.asset)this.buildShards();
    this.ribbon=global.scene.createSceneObject("RoomscriptObjectionPaths");this.ribbon.enabled=false;
    this.buildPullPhoto();
    this.flow.onObjectRequested.add(()=>this.open());
    this.wallet.onSelect.add(id=>{this.wallet.show(false);this.selected=id;this.open(id);});
    this.wallet.onClose.add(()=>{if(this.opened)this.close();});
    this.flow.engine.onState.add(()=>this.refreshWallet());this.flow.engine.onCaseChanged.add(()=>this.resetForCase());this.resetForCase();
  }
  resetForCase():void {
    if(!this.slip)return;this.tells.room.initialize();this.flow.cancel();this.stateCache=this.flow.engine.snapshot();
    this.phase="idle";this.opened=false;this.selected=null;this.claim="";this.memories=[];this.memoryIndex=0;this.destination=null;this.correct=false;this.develops=0;this.burstAt=0;this.burstCount=0;this.phaseHistory=[];this.captureAt="";
    this.pullObject=null;this.pullCommitted=false;this.pullCount=0;this.liftCount=0;this.suppressTapObject="";this.suppressTapUntil=0;this.photo.enabled=false;
    this.wallet.show(false);this.stamp.enabled=false;this.memory.enabled=false;this.slip.enabled=false;this.controls.enabled=true;this.ribbon.enabled=false;
    this.slip.getTransform().setLocalPosition(this.home);this.memory.getTransform().setLocalScale(vec3.one());
    this.pathMeshes.forEach(v=>{if(!isNull(v))v.getSceneObject().destroy();});this.pathMeshes=[];
    this.particles.paused=false;this.particles.emitting=false;this.particles.clear();this.shatterObject.enabled=false;this.tells.audio.silence(false);
    for(const target of this.targets){if(!isNull(target.interaction))target.interaction.destroy();if(!isNull(target.collider))target.collider.destroy();}this.targets=[];
    const graph=this.flow.engine.graphRef();
    for(const person of graph.cast.suspects)this.flow.actorFor(person.id)?.setFrozen(false);
    graph.room.objects.forEach(object=>{const anchor=this.tells.room.objectAnchor(object.id),shape=Shape.createBoxShape();shape.size=new vec3(16,16,16);
      const collider=anchor.createComponent("Physics.ColliderComponent");collider.shape=shape;
      const interaction=anchor.createComponent(Interactable.getTypeName()) as Interactable;interaction.targetingMode=3;
      interaction.onTriggerEnd.add(()=>{if(this.pullObject===object.id||(this.suppressTapObject===object.id&&getTime()<this.suppressTapUntil))return;if(this.objectHandler?.(object.id))return;if(!this.opened)this.inspect(object.id);});
      interaction.onDragStart.add(()=>this.beginPull(object.id,object.label,object.type));
      interaction.onDragUpdate.add(event=>this.movePull(object.id,event.dragVector));
      interaction.onDragEnd.add(()=>this.endPull(object.id));
      interaction.onTriggerCanceled.add(()=>{if(this.pullObject===object.id)this.cancelPull();});
      this.targets.push({collider,interaction});
    });
    this.refreshWallet();this.modal(false);this.getSceneObject().enabled=this.shatterPreview;
  }
  private refreshWallet():void {this.wallet.setEntries(walletEntries(this.flow.engine.graphRef(),this.stateCache));}
  inspect(object:string,collected=false):void {
    if(this.phase!=="idle"||!this.flow.engine.graphRef().room.objects.some(o=>o.id===object))return;this.flow.cancel();const state=collected?this.stateCache:this.flow.engine.dispatch({type:"PinchObject",object});
    const entries=this.flow.engine.graphRef().evidence.filter(e=>e.holder===object&&state.knowledge.evidenceIds.includes(e.id));
    this.getSceneObject().enabled=true;this.controls.enabled=true;this.opened=true;this.slip.enabled=false;this.memory.enabled=true;this.selected=entries.length===1?entries[0].id:null;
    this.memories=entries;this.memoryIndex=0;this.memory.getTransform().setLocalPosition(new vec3(0,0,0));this.memoryText.text=wrapText(entries[0]?.canonical||"No memory has surfaced yet.",26);this.hint.text=entries.length+" memories filed in your evidence wallet.";
    this.develops=getTime();this.memory.getTransform().setLocalScale(vec3.one().uniformScale(.03));this.modal(true);
    this.tells.audio.playAt("Chime",this.tells.room.objectAnchor(object).getTransform().getWorldPosition());
  }
  open(evidence?:string):void {
    if(this.phase!=="idle")return;const state=this.stateCache,claim=this.flow.engine.graphRef().statements.find(s=>s.id===state.activeStatement);
    if(!claim||claim.speaker!==this.flow.diagnostics().suspect){this.flow.subtitles.set("WREN","Ask a question before challenging an account.");return;}
    const entry=walletEntries(this.flow.engine.graphRef(),state).find(e=>e.id===evidence);
    this.flow.cancel();this.claim=claim.id;this.opened=true;this.selected=entry?entry.id:null;
    this.getSceneObject().enabled=true;this.controls.enabled=true;this.slip.enabled=true;this.slip.getTransform().setLocalPosition(this.home);this.slipText.text=wrapText(claim.canonical,30);
    this.memory.enabled=!!this.selected;this.memory.getTransform().setLocalPosition(new vec3(20,0,0));this.memories=[];if(entry)this.memoryText.text=wrapText(entry.text,26);
    this.hint.text="Drag the statement onto an object or memory.";this.modal(true);
  }
  close():void {if(this.phase!=="idle")return;this.opened=false;this.getSceneObject().enabled=false;this.modal(false);}
  private modal(active:boolean):void {if(active){this.flow.chips.show(false);this.flow.verbs.show(false);}else this.flow.restoreControls();this.caseLid.show(!active);}
  /** SIK supplies the same drag events in Preview and on glasses. The real anchor never moves. */
  private buildPullPhoto():void {
    this.photo=uiObject(this.getSceneObject(),"RoomscriptPulledMemory");const paper=this.tells.lightMaterial.clone();paper.mainPass.baseColor=new vec4(1,.94,.84,1);
    const border:[vec3,vec3][]=[[new vec3(-15,-12,0),new vec3(15,-12,0)],[new vec3(15,-12,0),new vec3(15,12,0)],[new vec3(15,12,0),new vec3(-15,12,0)],[new vec3(-15,12,0),new vec3(-15,-12,0)],[new vec3(-13,-5,0),new vec3(13,-5,0)]];
    worldLines(this.photo,"Photograph border",border,paper,.7);
    const symbols:{kind:string;lines:[vec3,vec3][]}[]=[
      {kind:"memory",lines:[[new vec3(-8,-1,.4),new vec3(-3,6,.4)],[new vec3(-3,6,.4),new vec3(2,0,.4)],[new vec3(2,0,.4),new vec3(6,4,.4)],[new vec3(6,4,.4),new vec3(10,-1,.4)]]},
      {kind:"cup",lines:[[new vec3(-5,7,.4),new vec3(-4,-2,.4)],[new vec3(-4,-2,.4),new vec3(4,-2,.4)],[new vec3(4,-2,.4),new vec3(5,7,.4)],[new vec3(5,7,.4),new vec3(-5,7,.4)],[new vec3(5,5,.4),new vec3(9,4,.4)],[new vec3(9,4,.4),new vec3(9,0,.4)],[new vec3(9,0,.4),new vec3(5,-1,.4)]]},
      {kind:"cord",lines:[[new vec3(-10,5,.4),new vec3(-4,5,.4)],[new vec3(-4,5,.4),new vec3(-4,-1,.4)],[new vec3(-4,-1,.4),new vec3(4,-1,.4)],[new vec3(4,-1,.4),new vec3(4,7,.4)],[new vec3(4,7,.4),new vec3(10,7,.4)]]}
    ];
    for(const symbol of symbols)this.photoSymbols.set(symbol.kind,worldLines(this.photo,"Memory symbol "+symbol.kind,symbol.lines,this.cyan,.7).getSceneObject());
    const label=uiObject(this.photo,"Memory photograph caption");label.getTransform().setLocalPosition(new vec3(0,-8,1));
    this.photoLabel=new PanelUI(label,29,7,1.2,new vec4(1,.94,.84,1),true,true).text("Memory object","PULL A MEMORY",5,"small");this.photo.enabled=false;
  }
  private beginPull(id:string,label:string,kind:string):void {
    if(this.phase!=="idle"||this.opened||this.stateCache.verdict)return;
    const lift=kind==="cup"||kind==="cord";this.flow.cancel();this.pullObject=id;this.pullCommitted=false;this.pullingLift=lift;this.pullDelta=vec3.zero();
    this.pullOrigin=this.tells.room.objectAnchor(id).getTransform().getWorldPosition();this.suppressTapObject=id;this.suppressTapUntil=getTime()+1;
    this.opened=true;this.getSceneObject().enabled=true;this.slip.enabled=false;this.memory.enabled=false;this.controls.enabled=false;this.stamp.enabled=false;this.modal(true);
    this.photo.enabled=true;this.photoLabel.text=label.split(/\s+/).slice(0,3).join(" ").toUpperCase();
    this.photoSymbols.forEach((symbol,symbolKind)=>symbol.enabled=symbolKind===(lift?kind:"memory"));this.placePullPhoto();
  }
  private placePullPhoto():void {
    const position=this.pullOrigin.add(this.pullDelta),camera=this.flow.actor.camera.getTransform().getWorldPosition(),towards=camera.sub(position);
    this.photo.getTransform().setWorldPosition(position);if(towards.length>.01)this.photo.getTransform().setWorldRotation(quat.lookAt(towards.normalize(),vec3.up()));
    this.photo.getTransform().setWorldScale(vec3.one().uniformScale(.35+.65*Math.min(1,this.pullDelta.length/12)));
  }
  private movePull(id:string,delta:vec3):void {
    if(this.pullObject!==id||!delta||![delta.x,delta.y,delta.z].every(Number.isFinite))return;
    this.pullDelta=this.pullDelta.add(delta);if(this.pullDelta.length>65)this.pullDelta=this.pullDelta.normalize().uniformScale(65);this.placePullPhoto();
    const towards=this.flow.actor.camera.getTransform().getWorldPosition().sub(this.pullOrigin);
    const towardDistance=towards.length>.01?this.pullDelta.dot(towards.normalize()):0;
    const ready=this.pullingLift?this.pullDelta.y>=8:this.pullDelta.length>=8&&(towardDistance>=4||this.pullDelta.y>=6);
    if(ready&&!this.pullCommitted){
      const state=this.flow.engine.dispatch({type:"PinchObject",object:id});this.pullCommitted=true;
      if(state.events.some(e=>e.seq===state.lastSeq&&e.type==="rejected")||state.verdict){this.cancelPull(false);return;}
      this.pullCount++;if(this.pullingLift)this.liftCount++;this.photoLabel.text=this.pullingLift?"LIFTED MEMORY":"MEMORY FOUND";
      this.tells.audio.playAt(this.pullingLift?"LiftInspect":"PullMemory",this.photo.getTransform().getWorldPosition());
    }
  }
  private endPull(id:string):void {
    if(this.pullObject!==id)return;const collected=this.pullCommitted;this.suppressTapObject=id;this.suppressTapUntil=getTime()+.25;
    this.pullObject=null;this.photo.enabled=false;this.opened=false;
    if(collected)this.inspect(id,true);else{this.getSceneObject().enabled=false;this.modal(false);}
  }
  private cancelPull(restore=true):void {
    if(this.pullObject){this.suppressTapObject=this.pullObject;this.suppressTapUntil=getTime()+.25;}
    this.pullObject=null;this.pullCommitted=false;this.opened=false;this.photo.enabled=false;this.getSceneObject().enabled=false;if(restore)this.modal(false);
  }
  private drop():void {
    if(!this.opened||this.phase!=="idle"||!this.slip.enabled)return;const point=this.slip.getTransform().getWorldPosition(),graph=this.flow.engine.graphRef(),state=this.stateCache;let evidence:string[]=[];
    const hit=this.dropTarget(point);if(hit==="selected"&&this.selected)evidence=[this.selected];else if(hit)evidence=objectDropEvidence(graph,state,hit);
    if(!evidence.length){this.hint.text="Inspect the object, or choose a specific collected memory.";this.slip.getTransform().setLocalPosition(this.home);return;}
    this.flow.cancel();this.flow.actor.setFrozen(true);this.oldMark=this.flow.actor.getTransform().getWorldPosition();
    const proof=graph.evidence.find(e=>e.id===evidence[0]),witness=graph.statements.find(s=>s.id===evidence[0]);
    const proofObject=proof&&graph.room.objects.find(o=>o.id===proof.holder);
    const witnessClaim=witness&&graph.statements.find(s=>s.speaker===witness.speaker&&(s.topic.startsWith("where@")||s.topic==="whereabouts"));
    const witnessMark=witnessClaim&&provenMark(graph,witnessClaim.id);
    this.evidencePoint=proofObject?this.tells.room.objectAnchor(proofObject.id).getTransform().getWorldPosition():witnessMark?this.tells.room.toWorld(witnessMark):point;
    const result=this.flow.engine.dispatch({type:"Object",suspect:this.flow.diagnostics().suspect,statement:this.claim,evidence});
    this.correct=result.events.some(e=>e.seq===result.lastSeq&&e.type==="objectionCorrect");
    if(result.events.some(e=>e.seq===result.lastSeq&&e.type==="rejected")){this.flow.actor.setFrozen(false);this.close();return;}
    const mark=this.correct?provenMark(graph,result.activeStatement!):null;this.destination=mark?this.tells.room.toWorld(mark):null;
    this.dropped=point;this.began=getTime();this.phaseHistory=[];this.setPhase(this.correct?"silence":"bounce");this.tells.audio.silence(this.correct);
  }
  private dropTarget(point:vec3):string|null {const origin=this.flow.actor.camera.getTransform().getWorldPosition(),tuple=(p:vec3):[number,number,number]=>[p.x,p.y,p.z],targets=this.flow.engine.graphRef().room.objects.map(o=>({id:o.id,position:tuple(this.tells.room.objectAnchor(o.id).getTransform().getWorldPosition()),radius:24}));if(this.selected)targets.unshift({id:"selected",position:tuple(this.memory.getTransform().getWorldPosition()),radius:22});return spatialDrop(tuple(origin),tuple(point),targets);}
  private setPhase(value:string):void {this.phase=value;this.phaseHistory.push(value);}
  /** Deterministic decorative triangle field; no gameplay randomness or native asset instantiation. */
  private buildShards():void {
    const material=this.tells.lightMaterial.clone();material.mainPass.baseColor=new vec4(.247,.89,1,1);
    for(let i=0;i<30;i++){
      const object=uiObject(this.shatterObject,"RoomscriptShard_"+i),mesh=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2}]);
      mesh.topology=MeshTopology.Triangles;mesh.indexType=MeshIndexType.UInt16;
      mesh.appendVerticesInterleaved([-1.8,-1.2,0,0,0,1,0,0,2.1,-.8,0,0,0,1,1,0,.3,2,0,0,0,1,.5,1]);mesh.appendIndices([0,1,2,2,1,0]);
      const visual=object.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;visual.mesh=mesh.getMesh();visual.mainMaterial=material;mesh.updateMesh();
      const angle=i*2.399963229728653,start=new vec3((i%6-2.5)*4,(Math.floor(i/6)-2)*3,0);
      this.shards.push({object,start,velocity:new vec3(Math.cos(angle)*(18+i%5*5),18+i%7*4,Math.sin(angle)*20),spin:(i%2?1:-1)*(2+i%4)});
    }
  }
  private path(start:vec3,end:vec3,color:vec4):void {
    const root=global.scene.createSceneObject("ObjectionPath");root.setParent(this.ribbon);const mesh=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2}]);mesh.topology=MeshTopology.Triangles;mesh.indexType=MeshIndexType.UInt16;
    const side=end.sub(start).cross(vec3.up()).normalize().uniformScale(1.1),points=[start.sub(side),start.add(side),end.add(side),end.sub(side)],vertices:number[]=[];
    points.forEach((p,i)=>vertices.push(p.x,p.y,p.z,0,1,0,i<2?0:1,i===0||i===3?0:1));mesh.appendVerticesInterleaved(vertices);mesh.appendIndices([0,1,2,0,2,3]);
    const visual=root.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;visual.mesh=mesh.getMesh();visual.mainMaterial=color.x>.5?this.coral:this.cyan;mesh.updateMesh();this.pathMeshes.push(visual);
  }
  private update():void {
    if(this.captureAt===this.phase&&(this.phase!=="shatter"||getTime()-this.burstAt>=.2)){this.began+=getDeltaTime();if(this.burstAt)this.burstAt+=getDeltaTime();return;}
    if(this.develops){const t=Math.min(1,(getTime()-this.develops)/.65);this.memory.getTransform().setLocalScale(vec3.one().uniformScale(Math.max(.03,t)));if(t===1)this.develops=0;}
    if(this.phase==="idle")return;const t=(getTime()-this.began)/this.timelineScale;
    if(this.burstAt&&this.shards.length){const age=getTime()-this.burstAt;for(const shard of this.shards){shard.object.getTransform().setLocalPosition(shard.start.add(shard.velocity.uniformScale(age)).add(new vec3(0,-30*age*age,0)));shard.object.getTransform().setLocalRotation(quat.fromEulerAngles(age*shard.spin,age*.7,age*shard.spin*.4));shard.object.getTransform().setLocalScale(vec3.one().uniformScale(Math.max(0,1-age/1.1)));}}
    if(this.phase==="bounce") {this.slip.getTransform().setWorldPosition(vec3.lerp(this.dropped,this.getTransform().getWorldTransform().multiplyPoint(this.home),Math.min(1,t/1.2)).add(new vec3(0,Math.sin(Math.min(1,t/1.2)*Math.PI)*8,0)));
      this.hint.text="That memory does not contradict this statement.";if(t>=1.2){this.flow.actor.setFrozen(false);this.setPhase("idle");}return;}
    if(t>=.25&&this.phase==="silence") {this.setPhase("slam");this.jitterFrame=0;this.stamp.enabled=true;this.memory.enabled=false;this.controls.enabled=false;this.tells.audio.silence(false);this.tells.audio.play("Objection");
      this.pathMeshes.forEach(v=>v.getSceneObject().destroy());this.pathMeshes=[];this.ribbon.enabled=true;
      const graph=this.flow.engine.graphRef(),source=graph.statements.find(s=>s.id===this.claim),object=source?.about&&graph.room.objects.find(o=>o.id===source.about);
      const claimed=object?this.tells.room.toWorld([object.pos[0],0,object.pos[2]]):this.oldMark.add(new vec3(-40,0,-30));
      const origin=this.oldMark.add(new vec3(0,2,0));if(claimed.distance(origin)>1)for(let i=0;i<12;i++)this.path(vec3.lerp(origin,claimed,i/12),vec3.lerp(origin,claimed,(i+.65)/12),new vec4(.247,.89,1,1));if(this.destination&&this.destination.distance(origin)>1)this.path(origin,this.destination.add(new vec3(0,2,0)),new vec4(1,.42,.35,1));}
    if(t>=.25&&t<1.2)this.pathMeshes.slice(0,12).forEach((visual,i)=>visual.getTransform().setLocalPosition(new vec3(Math.max(0,t-.45)*(i%2?12:-12),Math.max(0,t-.45)*18,0)));
    if(this.phase==="slam"){this.stamp.getTransform().setLocalScale(vec3.one().uniformScale(1+Math.max(0,.4-t)*5));this.stamp.getTransform().setLocalPosition(new vec3(this.jitterFrame<3?(this.jitterFrame%2?-.8:.8):0,7,8));this.jitterFrame++;}
    if(t>=.65&&this.phase==="slam") {this.setPhase("shatter");this.slip.enabled=false;const point=this.dropped.add(new vec3(0,0,8));this.shatterObject.enabled=true;this.shatterObject.getTransform().setWorldPosition(point);this.shatterObject.getTransform().setWorldScale(vec3.one());if(this.particles.asset){this.particles.worldBoundsCenter=point;this.particles.cullingBoundsSize=new vec3(180,180,180);this.particles.paused=false;this.particles.restart();this.particles.emitting=true;}this.burstAt=getTime();this.burstCount++;}
    if(this.burstAt&&getTime()-this.burstAt>=.09&&this.particles.emitting)this.particles.emitting=false;
    if(this.timelineScale>1&&this.phase==="shatter"&&getTime()-this.burstAt>=.2)this.particles.paused=true;
    if(t>=1.2&&this.phase==="shatter") {this.setPhase("walk");this.particles.paused=false;this.flow.actor.setFrozen(false);this.stamp.enabled=false;if(this.destination)this.tells.relocateMark(this.destination);}
    if(t>=2.8&&this.phase==="walk") {this.pathMeshes.forEach(v=>v.getSceneObject().destroy());this.pathMeshes=[];const origin=this.flow.actor.getTransform().getWorldPosition().add(new vec3(0,65,0));if(origin.distance(this.evidencePoint)>1)this.path(origin,this.evidencePoint,new vec4(1,.42,.35,1));this.particles.emitting=false;this.particles.clear();this.shatterObject.enabled=false;this.burstAt=0;this.setPhase("idle");this.close();const state=this.stateCache,topic=this.flow.engine.graphRef().statements.find(s=>s.id===state.activeStatement)?.topic||"unclear";void this.flow.perform("Explain the evidence.","chip",topic);}
  }
  diagnostics():{phase:string;correct:boolean;history:string[];opened:boolean;selected:string|null;shatterReady:boolean;bursts:number;shatterEnabled:boolean;proofThreads:number;pulling:string|null;pulls:number;lifts:number} {return {phase:this.phase,correct:this.correct,history:this.phaseHistory.slice(),opened:this.opened,selected:this.selected,shatterReady:!!this.particles?.asset||this.shards.length===30,bursts:this.burstCount,shatterEnabled:this.shatterObject.enabled,proofThreads:this.pathMeshes.length,pulling:this.pullObject,pulls:this.pullCount,lifts:this.liftCount};}
}
