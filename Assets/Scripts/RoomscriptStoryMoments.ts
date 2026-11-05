import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptCaseLidUI} from "./RoomscriptCaseLidUI";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {CaseGraph,GameState} from "./Engine/core/Types";
import {storyMomentPlans,StoryMomentPlan,blackoutPhase,flightFraction} from "./Engine/game/StoryMomentPlan";
import {caseExitPosition} from "./Engine/game/RoomPresentation";
import {admittedCard} from "./RoomscriptArtLibrary";
import {cardImage} from "./RoomscriptMemoryCardView";
import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
import {worldLines} from "./RoomscriptWorldLines";
type StoryCard={root:SceneObject;compact:SceneObject;full:SceneObject;home:vec3;born:number};
/** Event-driven theatrical overlays. Never dispatches an action or reads state in its frame callback. */
export class RoomscriptStoryMoments {
  private graph:CaseGraph;private state:GameState;private seen=new Set<string>();private generated:SceneObject[]=[];private cards:StoryCard[]=[];
  private queue:StoryMomentPlan[]=[];private active:StoryMomentPlan|null=null;private started=0;private modal:StoryCard|null=null;
  private flight:SceneObject|null=null;private flightHome:vec3;private flightExit:vec3;
  private dimmed:{material:Material;color:vec4}[]=[];private uv:SceneObject|null=null;private subscriptions:(()=>void)[]=[];
  constructor(owner:BaseScriptComponent,private engine:RoomscriptEngineBridge,private flow:RoomscriptInterrogationController,private lid:RoomscriptCaseLidUI,private audio:RoomscriptAudio){
    this.graph=engine.graphRef();this.state=engine.snapshot();
    this.subscriptions.push(engine.onCaseChanged.add(()=>{this.reset(false);this.graph=engine.graphRef();this.state=engine.snapshot();}));
    this.subscriptions.push(engine.onState.add(state=>this.accept(state)));
    owner.createEvent("UpdateEvent").bind(()=>this.update());owner.createEvent("OnDestroyEvent").bind(()=>{this.subscriptions.forEach(fn=>fn());this.reset();});this.accept(this.state);
  }
  private material():Material {return (requireAsset("../Materials/RoomscriptCyan.mat") as Material).clone();}
  private reset(restoreActor=true):void {this.restoreTransient(restoreActor);for(const object of this.generated)if(!isNull(object))object.destroy();this.generated=[];this.cards=[];this.queue=[];this.seen.clear();this.active=null;this.modal=null;this.uv=null;}
  private accept(state:GameState):void {
    this.state=state;if(state.verdict){this.restoreTransient();this.active=null;this.queue=[];this.generated.forEach(o=>{if(!isNull(o))o.enabled=false;});this.modal=null;return;}
    if(this.active?.kind==="flight"&&this.active.suspect&&state.suspects[this.active.suspect].lawyeredUntil>state.elapsedMinutes){this.flight=null;this.active=null;}
    for(const plan of storyMomentPlans(this.graph,state)){if(this.seen.has(plan.id))continue;this.seen.add(plan.id);
      if(plan.kind==="letter"||plan.kind==="voicemail")this.makeCard(plan);else this.queue.push(plan);
    }
  }
  private makeCard(plan:StoryMomentPlan):void {
    const card=plan.evidence&&admittedCard(this.graph,this.state,plan.evidence);if(!card)return;
    const root=uiObject(this.engine.roomRoot,"RoomscriptStory_"+plan.kind);const home=new vec3(plan.position[0],plan.position[1]+16,plan.position[2]+4);root.getTransform().setLocalPosition(home);this.generated.push(root);
    const compact=uiObject(root,"Story compact"),full=uiObject(root,"Story expanded"),entry:StoryCard={root,compact,full,home,born:getTime()};this.cards.push(entry);
    const small=new PanelUI(compact,36,46,1.2,new vec4(1,.94,.84,1),true,true),row=small.text("Story card image","",20,"small");cardImage(row.getSceneObject(),"Admitted story artwork",card.texture,14,19);
    const button=plan.kind==="letter"?"Read letter":"Read voicemail";small.buttons([{id:button,label:button}],()=>{
      if(this.state.verdict||this.flow.controlsBlocked||this.flow.diagnostics().busy)return;this.modal=entry;this.flow.controlsBlocked=true;this.flow.chips.show(false);this.flow.verbs.show(false);this.lid.show(false);
      this.cards.forEach(c=>{c.compact.enabled=false;c.full.enabled=c===entry;});
    },20);
    const detail=new PanelUI(full,48,58,1.2,new vec4(1,.94,.84,1));detail.text("Story detail title",plan.kind==="letter"?"SEALED LETTER":"DELAYED VOICEMAIL",5,"title");detail.text("Story admitted text",wrapText(card.caption,34),26,"small");
    detail.buttons([{id:"Close story memory",label:"File memory"}],()=>{if(this.modal!==entry)return;this.modal=null;this.cards.forEach(c=>{c.compact.enabled=true;c.full.enabled=false;});if(!this.state.verdict){this.lid.show(true);this.flow.restoreControls();}},20);full.enabled=false;
    // This waveform denotes a recorded message; the narrator's existing truth gate owns playback.
    if(plan.kind==="voicemail"){const bars:[vec3,vec3][]=Array.from({length:9},(_,i)=>{const h=2+Math.abs(Math.sin(i*1.7))*5;return [new vec3((i-4)*2,-h,1),new vec3((i-4)*2,h,1)] as [vec3,vec3];});worldLines(compact,"Voicemail signal",bars,this.material(),.7).getTransform().setLocalPosition(new vec3(0,19,2));}
    console.log("STORY_MOMENT|"+JSON.stringify({kind:plan.kind,beat:plan.id,evidence:plan.evidence}));
  }
  private begin(plan:StoryMomentPlan):void {
    this.active=plan;this.started=getTime();
    if(plan.kind==="flight"){
      const actor=plan.suspect&&this.flow.actorFor(plan.suspect),suspect=plan.suspect&&this.state.suspects[plan.suspect];
      if(!actor||!actor.getSceneObject().enabled||!suspect||suspect.lawyeredUntil>this.state.elapsedMinutes){this.active=null;return;}
      this.flight=actor.getSceneObject();this.flightHome=this.flight.getTransform().getWorldPosition();const exit=caseExitPosition(this.graph);this.flightExit=this.engine.roomRoot.getTransform().getWorldTransform().multiplyPoint(new vec3(exit[0],exit[1],exit[2]));this.flightExit.y=this.flightHome.y;
    }else if(plan.kind==="blackout"){
      const materials=new Set<Material>();const visit=(object:SceneObject)=>{if(/^(RoomscriptZoneGrid_|RoomscriptWeaponGrid_|Opening chalk |Fixture bracket )/.test(object.name)){const visual=object.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;if(visual?.mainMaterial)materials.add(visual.mainMaterial);}for(let i=0;i<object.getChildrenCount();i++)visit(object.getChild(i));};visit(this.engine.roomRoot);
      materials.forEach(material=>{const c=material.mainPass.baseColor;this.dimmed.push({material,color:new vec4(c.x,c.y,c.z,c.w)});});
      const evidence=this.graph.evidence.find(e=>e.id===plan.evidence),zone=this.graph.room.zones.find(z=>z.id===evidence?.holder);if(zone){
        const p=zone.anchor,lines:[vec3,vec3][]=Array.from({length:7},(_,i)=>[new vec3(p[0]-13+i*3,2,p[2]-8+i*5),new vec3(p[0]-9+i*3,2,p[2]-3+i*5)] as [vec3,vec3]);
        const material=this.material();material.mainPass.baseColor=new vec4(.45,.3,1,1);this.uv=worldLines(this.engine.roomRoot,"RoomscriptUVMemory",lines,material,2,vec3.up()).getSceneObject();this.uv.enabled=false;this.generated.push(this.uv);
        const tag=uiObject(this.uv,"UV memory label");tag.getTransform().setLocalPosition(new vec3(p[0],16,p[2]+20));new PanelUI(tag,30,8,1.2,new vec4(.65,.5,1,1),true,true).text("UV memory","UV MEMORY",5,"title");
      }
    }
    console.log("STORY_MOMENT|"+JSON.stringify({kind:plan.kind,beat:plan.id}));
  }
  private restoreTransient(restoreActor=true):void {
    if(restoreActor&&this.flight&&!isNull(this.flight)&&this.flightHome)this.flight.getTransform().setWorldPosition(this.flightHome);this.flight=null;
    for(const item of this.dimmed)item.material.mainPass.baseColor=item.color;this.dimmed=[];
  }
  private update():void {
    if(this.state.verdict)return;const now=getTime();
    for(const card of this.cards){const t=Math.min(1,(now-card.born)/.8);card.root.getTransform().setLocalPosition(card.home.add(new vec3(-14*(1-t),0,0)));card.root.getTransform().setWorldRotation(this.flow.actor.camera.getTransform().getWorldRotation());}
    if(!this.active&&this.queue.length&&!this.modal&&!this.flow.controlsBlocked&&!this.flow.diagnostics().busy)this.begin(this.queue.shift()!);
    if(!this.active)return;const t=now-this.started;
    if(this.active.kind==="flight"){
      if(this.flight)this.flight.getTransform().setWorldPosition(vec3.lerp(this.flightHome,this.flightExit,flightFraction(t)));
      if(t>=5){this.restoreTransient();this.active=null;}
    }else if(this.active.kind==="blackout"){
      const phase=blackoutPhase(t);for(const item of this.dimmed){const c=item.color,k=1-.85*phase.dim;item.material.mainPass.baseColor=new vec4(c.x*k,c.y*k,c.z*k,c.w);}if(this.uv)this.uv.enabled=phase.uv;
      if(phase.done){this.restoreTransient();this.active=null;this.audio.ambience("UvHum",false);this.audio.score("Interrogation");}
    }
  }
  diagnostics():{seen:string[];cards:number;active:string|null;uv:boolean;modal:boolean}{return {seen:[...this.seen],cards:this.cards.length,active:this.active?.kind||null,uv:!!this.uv?.enabled,modal:!!this.modal};}
}
