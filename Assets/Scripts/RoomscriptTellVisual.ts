import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {tellCue,TellCue} from "./Engine/game/TellCue";
import {tellWindow} from "./Engine/game/TellWindow";
import {GameState} from "./Engine/core/Types";
import {isLawyered} from "./Engine/game/Composure";
import {caseExitPosition} from "./Engine/game/RoomPresentation";

/** Engine-authorized tells and composure only; this adapter never infers a lie from prose. */
@component export class RoomscriptTellVisual extends BaseScriptComponent {
  @input @hint("Validated interrogation performance") flow:RoomscriptInterrogationController;
  @input @hint("Object and zone anchors") room:RoomscriptRoomBinding;
  @input @hint("Deterministic cue sounds") audio:RoomscriptAudio;
  @input @hint("Constant-angular gaze shader") gazeMaterial:Material;
  @input @hint("Prop and ring light") lightMaterial:Material;
  @input @hint("Visible tell duration seconds; production 0.9") tellDuration:number=0.9;
  private line:RenderMeshVisual;private lineBuilder:MeshBuilder;private lineSurface:Material;
  private prop:SceneObject;private propSurface:Material;private segments:RenderMeshVisual[]=[];
  private pending:TellCue|null=null;private due=0;private until:number|null=null;private target:SceneObject|null=null;
  private count=0;private started=0;private lastDelay=0;private shownSegments=0;
  private absent=false;private moving=false;private moveStart=0;private from:vec3;private to:vec3;private mark:vec3;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private visual(parent:SceneObject,name:string,vertices:number[],indices:number[],material:Material):RenderMeshVisual {
    const object=global.scene.createSceneObject(name);object.setParent(parent);
    const builder=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2}]);builder.topology=MeshTopology.Triangles;builder.indexType=MeshIndexType.UInt16;
    builder.appendVerticesInterleaved(vertices);builder.appendIndices(indices);const visual=object.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    visual.mesh=builder.getMesh();visual.mainMaterial=material;builder.updateMesh();return visual;
  }
  private build():void {
    if(this.prop)return;
    this.room.initialize();const actor=this.flow.actor.getSceneObject();this.mark=actor.getTransform().getWorldPosition();
    this.propSurface=this.lightMaterial.clone();
    this.prop=this.visual(actor,"RoomscriptTellProp",[-3,0,0,0,0,1,0,0,0,-4,0,0,0,1,1,0,3,0,0,0,0,1,1,1,0,4,0,0,0,1,0,1],[0,1,2,0,2,3],this.propSurface).getSceneObject();
    this.prop.enabled=false;
    for(let segment=0;segment<6;segment++) {
      const vertices:number[]=[],indices:number[]=[];
      for(let step=0;step<=8;step++) {const angle=(segment/6+(step/8*.13))*Math.PI*2;
        for(const radius of [23.5,24.4])vertices.push(Math.cos(angle)*radius,Math.sin(angle)*radius+126,-3,0,0,1,step/8,radius===23.5?0:1);
        if(step<8){const n=step*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
      this.segments.push(this.visual(actor,"RoomscriptComposure"+segment,vertices,indices,this.lightMaterial));
    }
    this.lineSurface=this.gazeMaterial.clone();this.lineSurface.mainPass.appearance=new vec4(.25,24,1,1);
    const lineRoot=global.scene.createSceneObject("RoomscriptGazeLine");lineRoot.setParent(this.getSceneObject());
    this.lineBuilder=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2}]);this.lineBuilder.topology=MeshTopology.Triangles;this.lineBuilder.indexType=MeshIndexType.UInt16;
    this.lineBuilder.appendVerticesInterleaved(new Array(32).fill(0));this.lineBuilder.appendIndices([0,1,2,0,2,3]);this.line=lineRoot.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    this.line.mesh=this.lineBuilder.getMesh();this.line.mainMaterial=this.lineSurface;this.lineBuilder.updateMesh();this.line.enabled=false;
    this.flow.onSpeaking.add(event=>{const cue=tellCue(this.flow.engine.graphRef(),this.flow.engine.snapshot(),event.seq,event.suspect,event.mode);
      if(!cue)return;this.pending=cue;this.started=getTime();this.due=this.started+cue.delayMs/1000;this.until=null;});
    this.flow.engine.onState.add(state=>this.render(state));this.render(this.flow.engine.snapshot());
    this.flow.engine.onCaseChanged.add(()=>this.resetForCase());
    this.flow.onSuspectSelected.add(()=>{const actor=this.flow.actor.getSceneObject();this.pending=null;this.prop.enabled=false;this.line.enabled=false;this.moving=false;this.absent=false;this.mark=actor.getTransform().getWorldPosition();this.prop.setParent(actor);this.segments.forEach(s=>s.getSceneObject().setParent(actor));this.render(this.flow.engine.snapshot());});
  }
  resetForCase():void {
    if(!this.prop)return;this.room.initialize();this.pending=null;this.until=null;this.target=null;this.moving=false;this.absent=false;this.count=0;this.lastDelay=0;
    this.prop.enabled=false;this.line.enabled=false;const actor=this.flow.actor.getSceneObject();this.mark=actor.getTransform().getWorldPosition();
    this.prop.setParent(actor);this.segments.forEach(s=>s.getSceneObject().setParent(actor));actor.enabled=true;this.render(this.flow.engine.snapshot());
  }
  private render(state:GameState):void {
    const last=state.log[state.log.length-1];if(last&&!["LineSpoken","LlmOutput","PlayerMoved","WrenSpoken"].includes(last.type)){this.pending=null;this.prop.enabled=false;this.line.enabled=false;}
    const id=this.flow.diagnostics().suspect,suspect=state.suspects[id];this.shownSegments=suspect.composure;
    this.audio.setComposure(1-suspect.composure/Math.max(1,suspect.composureMax));
    this.segments.forEach((segment,index)=>segment.enabled=index<suspect.composure);
    const absent=isLawyered(suspect,state.elapsedMinutes);
    if(absent!==this.absent){this.absent=absent;this.from=this.flow.actor.getTransform().getWorldPosition();
      this.to=absent?this.room.toWorld(caseExitPosition(this.flow.engine.graphRef())):this.mark;
      this.moveStart=getTime();this.moving=true;this.flow.actor.getSceneObject().enabled=true;
      if(!absent)this.audio.play("Knock");}
  }
  private update():void {
    if(!this.prop)return;const now=getTime();
    if(this.moving){const t=Math.min(1,(now-this.moveStart)/1.5),ease=t*t*(3-2*t);this.flow.actor.getTransform().setWorldPosition(vec3.lerp(this.from,this.to,ease));
      if(t===1){this.moving=false;this.flow.actor.getSceneObject().enabled=!this.absent;}}
    if(!this.pending||now<this.due)return;
    const window=tellWindow(now,this.due,this.until,this.tellDuration);this.until=window.until;
    if(!window.active){this.pending=null;this.prop.enabled=false;this.line.enabled=false;return;}
    if(window.started){this.count++;this.lastDelay=(now-this.started)*1000;this.audio.play(this.pending.kind==="flicker"?"Tink":"Shing");
      this.target=this.pending.targetObject?this.room.objectAnchor(this.pending.targetObject):null;
      console.log("TELL|"+JSON.stringify({statement:this.pending.statement,target:this.pending.targetObject,delayMs:this.lastDelay}));}
    this.prop.enabled=true;
    const phase=(now-this.due)*12,flash=this.pending.kind==="flicker"?(Math.sin(phase*3)>0?1:.2):.6+.4*Math.sin(phase);
    const kind=this.pending.prop,position=kind.indexOf("glasses")>=0?new vec3(0,132,5):kind.indexOf("glove")>=0?new vec3(-16,74,5):kind==="lighter"?new vec3(16,78,5):new vec3(14,97,5);
    this.prop.getTransform().setLocalPosition(position);this.prop.getTransform().setLocalScale(new vec3(flash,flash,flash));
    this.propSurface.mainPass.baseColor=new vec4(.25*flash,.89*flash,flash,1);
    this.line.enabled=!!this.target;
    if(this.target)this.updateLine(this.target.getTransform().getWorldPosition());
  }
  relocateMark(position:vec3):void {this.mark=position;this.from=this.flow.actor.getTransform().getWorldPosition();this.to=position;this.moveStart=getTime();this.moving=true;}
  private updateLine(end:vec3):void {
    const start=this.flow.actor.getTransform().getWorldTransform().multiplyPoint(new vec3(0,132,5)),camera=this.flow.actor.camera.getTransform().getWorldPosition();
    const direction=end.sub(start),towards=camera.sub(start);let side=direction.cross(towards);if(side.length<.001)side=vec3.up();side=side.normalize().uniformScale(12);
    const inverse=this.line.getTransform().getInvertedWorldTransform(),points=[start.sub(side),start.add(side),end.add(side),end.sub(side)],vertices:number[]=[];
    points.forEach((point,index)=>{const local=inverse.multiplyPoint(point);vertices.push(local.x,local.y,local.z,0,0,1,index<2?0:1,index===0||index===3?0:1);});
    this.lineBuilder.eraseVertices(0,4);this.lineBuilder.appendVerticesInterleaved(vertices);this.lineBuilder.updateMesh();
  }
  diagnostics():{count:number;delayMs:number;target:string|null;prop:boolean;line:boolean;segments:number;absent:boolean;moving:boolean} {
    return {count:this.count,delayMs:this.lastDelay,target:this.pending?.targetObject??null,prop:!!this.prop?.enabled,line:!!this.line?.enabled,segments:this.shownSegments,absent:this.absent,moving:this.moving};
  }
}
