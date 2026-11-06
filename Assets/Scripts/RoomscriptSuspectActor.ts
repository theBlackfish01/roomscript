import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {GameState} from "./Engine/core/Types";
import {ArtFrame,CharacterArt,FrameArt,characterArt,frameArt,frameSizeCm,stageHeights,StageHeights} from "./Content/ActorArt";
import {castTexture} from "./RoomscriptCastTextures";
const POSES=["neutral","listening","rattled","broken","smug","tell","tableau"];
/** Paper-theatre presentation. Engine state selects posture; audio amplitude drives the mouth.
 * Run 9 (ART_2D): with the illustrated cast, the actor is a real-scale figure pivoted at the feet: a body layer
 * plus a sharp head layer drawn on top, a soft contact shadow, a breathing sway, a bob on speech and a lean
 * while gliding. Expressions and the lip flap swap textures only. CHARACTER_ART="line" keeps the Run 8 card.
 */
@component export class RoomscriptSuspectActor extends BaseScriptComponent {
  @ui.group_start("References")
  @input @hint("Puppet shader material") material:Material;
  @input @hint("Neutral portrait") neutral:Texture;
  @input @hint("Speaking portrait") listening:Texture;
  @input @hint("Rattled portrait") rattled:Texture;
  @input @hint("Broken portrait") broken:Texture;
  @input @allowUndefined @hint("Smug reaction after an engine-rejected objection; neutral fallback") smug:Texture;
  @input @hint("Deterministic case owner") engine:RoomscriptEngineBridge;
  @input @hint("Player camera for facing") camera:SceneObject;
  @ui.group_end
  @input @hint("Engine suspect ID") suspect:string="S2";
  private surface:Material;private visual:RenderMeshVisual;
  private stress=0;private jaw=0;private amplitude=0;private speaking=false;
  private pose="neutral";private track:AudioTrackAsset;private frozen=false;
  private state:GameState;private smugUntil=0;private smugSeq=-1;
  private captureOverride:string|null=null;private captureUntil=0;
  private samples=new Float32Array(1024);
  private alignment:{characters:string[];starts:number[];ends:number[]}|undefined;private playhead:(()=>number)|undefined;private character=0;
  // Run 9 illustrated figure.
  private art:CharacterArt|null=null;private figure:SceneObject;private body:SceneObject;private head:SceneObject;private headSurface:Material;private headVisual:RenderMeshVisual;
  private shadow:SceneObject;private shownBody="";private shownHead="";private shownFrame:ArtFrame|null=null;private tellUntil=0;private frameOverride:ArtFrame|null=null;
  private lastPosition:vec3|null=null;private speed=0;private lean=0;private phase=0;private scratch=new vec3(0,0,0);
  setAlignment(alignment:{characters:string[];starts:number[];ends:number[]}|undefined,playhead:()=>number):void {this.alignment=alignment;this.playhead=playhead;this.character=0;}
  onAwake():void {
    this.createEvent("OnStartEvent").bind(()=>this.build());
    this.createEvent("UpdateEvent").bind(()=>this.update());
  }
  private quad(parent:SceneObject,name:string,material:Material,x0:number,x1:number,y0:number,y1:number):RenderMeshVisual {
    const object=global.scene.createSceneObject(name);object.setParent(parent);
    const b=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2}]);
    b.topology=MeshTopology.Triangles;b.indexType=MeshIndexType.UInt16;
    b.appendVerticesInterleaved([x0,y0,0,0,0,1,0,0,x1,y0,0,0,0,1,1,0,x1,y1,0,0,0,1,1,1,x0,y1,0,0,0,1,0,1]);
    b.appendIndices([0,1,2,0,2,3]);const visual=object.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    visual.mesh=b.getMesh();visual.mainMaterial=material;b.updateMesh();return visual;
  }
  private build():void {
    this.surface=this.material.clone();this.art=characterArt(this.suspect);
    let seed=0;for(const c of this.suspect)seed=(seed*31+c.charCodeAt(0))%997;this.phase=seed/997*Math.PI*2;
    if(!this.art){
      const b=new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2}]);
      b.topology=MeshTopology.Triangles;b.indexType=MeshIndexType.UInt16;
      // Line card: 170 cm tall, grounded at the authored mark.
      b.appendVerticesInterleaved([-42.5,0,0,0,0,1,0,0,42.5,0,0,0,0,1,1,0,42.5,170,0,0,0,1,1,1,-42.5,170,0,0,0,1,0,1]);
      b.appendIndices([0,1,2,0,2,3]);this.visual=this.getSceneObject().createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      this.visual.mesh=b.getMesh();this.visual.mainMaterial=this.surface;b.updateMesh();
    }else{
      // Unit quads (x -0.5..0.5, y 0..1) scaled per frame, so frames with other canvases (the tableau) swap cleanly.
      this.figure=global.scene.createSceneObject("RoomscriptFigure_"+this.suspect);this.figure.setParent(this.getSceneObject());
      this.visual=this.quad(this.figure,"Figure body",this.surface,-.5,.5,0,1);this.body=this.visual.getSceneObject();
      this.headSurface=this.material.clone();this.headVisual=this.quad(this.figure,"Figure head",this.headSurface,-.5,.5,0,1);this.head=this.headVisual.getSceneObject();
      this.headVisual.setRenderOrder(this.visual.getRenderOrder()+1);
      const shadowSurface=this.material.clone();shadowSurface.mainPass.baseTex=castTexture("ContactShadow.png");shadowSurface.mainPass.appearance=new vec4(0,0,0,1);
      const shadow=this.quad(this.getSceneObject(),"Contact shadow",shadowSurface,-.5,.5,-.5,.5);this.shadow=shadow.getSceneObject();shadow.setRenderOrder(this.visual.getRenderOrder()-1);
      const size=frameSizeCm(frameArt(this.art,"neutral"));this.shadow.getTransform().setLocalPosition(new vec3(0,.4,0));
      this.shadow.getTransform().setLocalRotation(quat.fromEulerAngles(-Math.PI/2,0,0));this.shadow.getTransform().setLocalScale(new vec3(size.w*.62,size.w*.3,1));
      this.applyFrame("neutral");
    }
    this.engine.initialize();this.engine.onState.add(state=>this.applyState(state));this.applyState(this.engine.snapshot());
  }
  applyState(state:GameState):void {
    this.state=state;
    if(this.frozen)return;
    const s=state.suspects[this.suspect];if(!s||!this.surface)return;
    this.stress=1-s.composure/Math.max(1,s.composureMax);
    if(state.events.some(event=>event.seq===state.lastSeq&&event.type==="objectionWrong"&&event.actor===this.suspect)&&state.lastSeq!==this.smugSeq){this.smugSeq=state.lastSeq;this.smugUntil=getTime()+1.8;}
    this.renderPose();
  }
  private renderPose():void {
    const s=this.state?.suspects[this.suspect];if(!s||!this.surface||this.frozen)return;
    this.pose=this.captureOverride||(this.frameOverride?this.frameOverride:getTime()<this.tellUntil&&s.layer<2&&s.composure>0?"tell":s.layer>=2||s.composure<=0?"broken":s.layer>0||this.stress>=0.3?"rattled":getTime()<this.smugUntil?"smug":this.speaking?"listening":"neutral");
    if(this.art){this.applyFrame(this.pose==="listening"?"speaking":this.pose as ArtFrame);return;}
    const texture=this.pose==="broken"?this.broken:this.pose==="rattled"?this.rattled:this.pose==="listening"?this.listening:this.pose==="smug"?this.smug:this.neutral;
    this.surface.mainPass.baseTex=texture||this.neutral;
  }
  /** Shows one illustrated frame: body texture and size, head layer texture and placement. */
  private applyFrame(frame:ArtFrame,headFrame?:ArtFrame):void {
    if(!this.art)return;const f=frameArt(this.art,frame),size=frameSizeCm(f);
    if(this.shownFrame!==frame){this.shownFrame=frame;
      this.body.getTransform().setLocalScale(new vec3(size.w,size.h,1));this.body.getTransform().setLocalPosition(new vec3((.5-f.feet.x)*size.w,-(1-f.feet.y)*size.h,0));
      const r=f.headLayerRect;this.head.enabled=!!(r&&f.head);
      if(r){this.head.getTransform().setLocalScale(new vec3(r.w*size.w,r.h*size.h,1));this.head.getTransform().setLocalPosition(new vec3((r.x+r.w/2-f.feet.x)*size.w,(f.feet.y-r.y-r.h)*size.h,.3));}}
    const bodyFile=this.art.name+"/"+f.body;if(bodyFile!==this.shownBody){this.shownBody=bodyFile;const t=castTexture(bodyFile);if(t)this.surface.mainPass.baseTex=t;}
    const hf=headFrame?frameArt(this.art,headFrame):f,headFile=hf.head?this.art.name+"/"+hf.head:"";
    if(headFile&&headFile!==this.shownHead){this.shownHead=headFile;const t=castTexture(headFile);if(t)this.headSurface.mainPass.baseTex=t;}
  }
  /** Presentation-only Director capture hook. Never changes a tell, fact or account. */
  capturePose(pose:string,seconds=2):void {if(!POSES.includes(pose))return;this.captureOverride=pose;this.captureUntil=getTime()+Math.min(120,Math.max(.1,seconds));this.renderPose();}
  /** The tell frame (ART_2D): shown with the engine's tell cue, alongside the gaze line. Presentation only. */
  showTell(seconds=1.6):void {this.tellUntil=getTime()+seconds;this.renderPose();}
  /** A fixed frame for scripted moments (the frozen tableau). Null returns to engine-driven poses. */
  setFrameOverride(frame:ArtFrame|null):void {this.frameOverride=frame;this.renderPose();}
  setListening(active:boolean):void {this.speaking=active;if(this.state)this.renderPose();}
  setFrozen(value:boolean):void {this.frozen=value;if(!value&&this.state)this.applyState(this.state);}
  voice():string {this.engine.initialize();return this.engine.graphRef().cast.suspects.find(s=>s.id===this.suspect)?.voice || "onyx";}
  setVoice(track:AudioTrackAsset|null):void {this.track=track;this.setListening(!!track);this.alignment=undefined;if(!track)this.amplitude=0;}
  setAudioAmplitude(value:number):void {this.amplitude=Math.max(0,Math.min(1,value));}
  diagnostics():{pose:string;stress:number;jaw:number;art:string;frame:string|null;head:string} {return {pose:this.pose,stress:this.stress,jaw:this.jaw,art:this.art?"illustrated":"line",frame:this.shownFrame,head:this.shownHead};}
  /** Heights above the feet for staging (face, chin, token, subtitle...), from the art anchors. */
  heights():StageHeights {return stageHeights(this.suspect);}
  /** A board/newspaper portrait: the sharp head layer for the illustrated cast, else the line card. */
  portrait():{texture:Texture;aspect:number} {if(this.art){const f=frameArt(this.art,"neutral"),t=f.head?castTexture(this.art.name+"/"+f.head):null;if(t)return {texture:t,aspect:1};}return {texture:this.neutral,aspect:.5};}
  /** The current frame's art (for anchors such as the right hand), or null for the line card. */
  frameArt():FrameArt|null {return this.art?frameArt(this.art,this.shownFrame||"neutral"):null;}
  private update():void {
    if(!this.surface||this.frozen)return;
    if(this.captureOverride&&getTime()>=this.captureUntil){this.captureOverride=null;this.renderPose();}
    if((this.pose==="smug"&&getTime()>=this.smugUntil||this.pose==="tell"&&getTime()>=this.tellUntil)&&!this.captureOverride)this.renderPose();
    const root=this.getTransform(),position=root.getWorldPosition(),delta=this.camera.getTransform().getWorldPosition().sub(position);delta.y=0;
    if(delta.length>0.01)root.setWorldRotation(quat.lookAt(delta.normalize(),vec3.up()));
    if(this.track&&this.alignment&&this.playhead){const a=this.alignment,t=this.playhead();while(this.character<a.ends.length-1&&a.ends[this.character]<t)this.character++;this.amplitude=t>=a.starts[this.character]&&t<=a.ends[this.character]&&/[a-z0-9]/i.test(a.characters[this.character])?.8:0;}
    else if(this.track){const control=this.track.control as FileAudioTrackProvider;
      if(control.isOfType("Provider.FileAudioTrackProvider")){const shape=control.getAudioFrame(this.samples);const count=Math.min(this.samples.length,Math.max(0,shape.x*shape.y));let square=0;for(let i=0;i<count;i++)square+=this.samples[i]*this.samples[i];this.amplitude=count?Math.min(1,Math.sqrt(square/count)*5):0;}}
    const dt=Math.max(.001,Math.min(getDeltaTime(),.1));this.jaw+=(this.amplitude-this.jaw)*Math.min(1,dt*18);
    if(!this.art){const distanceDetail=this.captureOverride||this.speaking?0:Math.max(0,Math.min(1,(delta.length-200)/160));this.surface.mainPass.appearance=new vec4(this.stress,this.jaw,distanceDetail,0);return;}
    // Illustrated: the lip flap swaps only the head layer while the neutral speaking body stays.
    if(this.pose==="listening")this.applyFrame("speaking",this.jaw>.5?"mouthopen":this.jaw>.15?"speaking":"neutral");
    this.surface.mainPass.appearance=new vec4(this.stress,0,0,0);this.headSurface.mainPass.appearance=new vec4(this.stress,0,0,1);
    // Gliding: speed from the authored moves (TellVisual, story moments); a bob and a lean into the motion.
    if(this.lastPosition){const v=position.sub(this.lastPosition);v.y=0;const sideways=v.dot(root.getWorldRotation().multiplyVec3(vec3.right()));this.speed+=(v.length/dt-this.speed)*Math.min(1,dt*6);
      const target=this.speed>8?Math.max(-1,Math.min(1,sideways/dt/120))*.09:0;this.lean+=(target-this.lean)*Math.min(1,dt*5);}
    this.lastPosition=position;
    const t=getTime(),breathe=Math.sin(t*1.6+this.phase),gliding=Math.min(1,this.speed/40);
    this.scratch.x=0;this.scratch.y=this.jaw*.8+gliding*Math.abs(Math.sin(t*7))*1.6;this.scratch.z=0;
    const ft=this.figure.getTransform();ft.setLocalPosition(this.scratch);
    ft.setLocalScale(new vec3(1-.002*breathe,1+.005*breathe,1));ft.setLocalRotation(quat.fromEulerAngles(0,0,-this.lean));
  }
}
