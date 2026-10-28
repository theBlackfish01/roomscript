import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {GameState} from "./Engine/core/Types";
/** Paper-theatre presentation. Engine state selects posture; audio amplitude drives the jaw. */
@component export class RoomscriptSuspectActor extends BaseScriptComponent {
  @ui.group_start("References")
  @input material:Material;
  @input neutral:Texture;
  @input listening:Texture;
  @input rattled:Texture;
  @input broken:Texture;
  @input engine:RoomscriptEngineBridge;
  @input camera:SceneObject;
  @ui.group_end
  @input suspect:string="S2";
  private surface:Material;private visual:RenderMeshVisual;
  private stress=0;private jaw=0;private amplitude=0;private speaking=false;
  private pose="neutral";private track:AudioTrackAsset;
  private samples=new Float32Array(1024);
  onAwake():void {
    this.createEvent("OnStartEvent").bind(()=>this.build());
    this.createEvent("UpdateEvent").bind(()=>this.update());
  }
  private build():void {
    this.surface=this.material.clone();
    const b=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2}]);
    b.topology=MeshTopology.Triangles;b.indexType=MeshIndexType.UInt16;
    // 170 cm tall, grounded at the authored mark; feet are deliberately behind furniture.
    b.appendVerticesInterleaved([-42.5,0,0,0,0,1,0,0,42.5,0,0,0,0,1,1,0,42.5,170,0,0,0,1,1,1,-42.5,170,0,0,0,1,0,1]);
    b.appendIndices([0,1,2,0,2,3]);this.visual=this.getSceneObject().createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    this.visual.mesh=b.getMesh();this.visual.mainMaterial=this.surface;b.updateMesh();
    this.engine.initialize();this.engine.onState.add(state=>this.applyState(state));this.applyState(this.engine.snapshot());
  }
  applyState(state:GameState):void {
    const s=state.suspects[this.suspect];if(!s||!this.surface)return;
    this.stress=1-s.composure/Math.max(1,s.composureMax);
    this.pose=s.layer>=2||s.composure<=0?"broken":s.layer>0||this.stress>=0.3?"rattled":this.speaking?"listening":"neutral";
    this.surface.mainPass.baseTex=this.pose==="broken"?this.broken:this.pose==="rattled"?this.rattled:this.pose==="listening"?this.listening:this.neutral;
  }
  setListening(active:boolean):void {this.speaking=active;this.applyState(this.engine.snapshot());}
  voice():string {this.engine.initialize();return this.engine.caseGraph().cast.suspects.find(s=>s.id===this.suspect)?.voice || "onyx";}
  setVoice(track:AudioTrackAsset|null):void {this.track=track;this.setListening(!!track);if(!track)this.amplitude=0;}
  setAudioAmplitude(value:number):void {this.amplitude=Math.max(0,Math.min(1,value));}
  diagnostics():{pose:string;stress:number;jaw:number} {return {pose:this.pose,stress:this.stress,jaw:this.jaw};}
  private update():void {
    if(!this.surface)return;
    const root=this.getTransform(),delta=this.camera.getTransform().getWorldPosition().sub(root.getWorldPosition());delta.y=0;
    if(delta.length>0.01)root.setWorldRotation(quat.lookAt(delta.normalize(),vec3.up()));
    if(this.track){const control=this.track.control as FileAudioTrackProvider;
      if(control.isOfType("Provider.FileAudioTrackProvider")){const shape=control.getAudioFrame(this.samples);const count=Math.min(this.samples.length,Math.max(0,shape.x*shape.y));let square=0;for(let i=0;i<count;i++)square+=this.samples[i]*this.samples[i];this.amplitude=count?Math.min(1,Math.sqrt(square/count)*5):0;}}
    this.jaw+=(this.amplitude-this.jaw)*Math.min(1,getDeltaTime()*18);
    this.surface.mainPass.appearance=new vec4(this.stress,this.jaw,0,0);
  }
}
