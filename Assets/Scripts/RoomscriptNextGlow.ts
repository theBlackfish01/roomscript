import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptCaseLidUI} from "./RoomscriptCaseLidUI";
import {GameState} from "./Engine/core/Types";
import {circleEdges,lineTubes,tinted} from "./RoomscriptLineArt";
import {BRASS} from "./RoomscriptGlyphUI";
/** Run 9 (phase 5, followability): when the player has made no progress for a while, a soft brass ring
 * glows on the one object that is the next useful thing to do. In order: a suspect nobody has questioned yet,
 * a clue object not yet examined, then the Accuse seal once the proof is in. Only one ring at a time, and it
 * goes out as soon as anything happens. Presentation only: it reads the cached onState snapshot (never
 * snapshot() per frame) and never dispatches. */
export type NextGlowKind="suspect"|"object"|"accuse";
export class RoomscriptNextGlow {
  static current:RoomscriptNextGlow|null=null;
  /** Extra checks from other presenters (film mode, accusation open, a story moment, casting narration).
   * A non-empty reason hides the ring and restarts the idle clock, so the stall is counted only from when the player is free. */
  blocked:()=>string=()=>"";
  private state:GameState|null=null;private lastSeq=-1;private lastChange=0;private nextPick=0;
  private ring:SceneObject;private lidRing:SceneObject;private target:{kind:NextGlowKind;id:string}|null=null;private visuals=new Map<string,SceneObject|null>();private reason="";private resetBy="";
  constructor(owner:BaseScriptComponent,private engine:RoomscriptEngineBridge,private interrogation:RoomscriptInterrogationController,private lid:RoomscriptCaseLidUI){
    RoomscriptNextGlow.current=this;
    const material=tinted(requireAsset("../Materials/RoomscriptCyan.mat") as Material,BRASS);
    this.ring=global.scene.createSceneObject("RoomscriptNextGlow");
    lineTubes(this.ring,"Next ring outer",circleEdges(1,40,vec3.zero(),"xz"),material,.045);
    lineTubes(this.ring,"Next ring inner",circleEdges(.82,40,vec3.zero(),"xz"),material,.025);
    this.ring.enabled=false;
    this.lidRing=global.scene.createSceneObject("RoomscriptNextGlowSeal");
    lineTubes(this.lidRing,"Seal ring",circleEdges(7.2,32,vec3.zero(),"xy"),material,.35);
    this.lidRing.enabled=false;
    engine.onState.add(state=>{this.state=state;if(state.lastSeq!==this.lastSeq){this.lastSeq=state.lastSeq;const type=state.log.length?state.log[state.log.length-1].type:"";
      // Walking about is not progress: only player actions restart the stall clock.
      if(type!=="PlayerMoved"){this.lastChange=getTime();this.resetBy="action "+type;this.hide();}}});
    engine.onCaseChanged.add(()=>{this.resetBy="case";this.state=null;this.visuals.clear();this.lastChange=getTime();this.hide();});
    this.lastChange=getTime();
    owner.createEvent("UpdateEvent").bind(()=>this.update());
  }
  diagnostics():{kind:NextGlowKind|null;id:string|null;visible:boolean;waiting:string;idle:number;resetBy:string} {return {kind:this.target?.kind||null,id:this.target?.id||null,visible:this.ring.enabled||this.lidRing.enabled,waiting:this.reason,idle:Math.round(getTime()-this.lastChange),resetBy:this.resetBy};}
  private hide():void {this.ring.enabled=false;this.lidRing.enabled=false;}
  private update():void {
    const state=this.state;
    this.reason=!state?"no state":state.verdict?"verdict":!this.engine.investigationEnabled?"investigation off":this.interrogation.controlsBlocked?"controls blocked":this.interrogation.diagnostics().busy?"speaking":this.blocked();
    if(this.reason||!state){this.hide();this.lastChange=getTime();this.resetBy=this.reason;return;}
    const idle=getTime()-this.lastChange,wait=state.notebook.length===0?12:20;
    if(idle<wait){this.hide();return;}
    if(getTime()>=this.nextPick){this.nextPick=getTime()+.5;const pick=this.pick(state);
      if(!pick){this.target=null;this.hide();return;}
      if(!this.target||this.target.kind!==pick.kind||this.target.id!==pick.id){this.target=pick;console.log("NEXT_GLOW|"+pick.kind+"|"+pick.id);}}
    if(!this.target){this.hide();return;}
    const pulse=1+.08*Math.sin(getTime()*3.2);
    if(this.target.kind==="accuse"){const token=this.lid.tokenRoot("Accuse");this.ring.enabled=false;if(!token||!token.isEnabledInHierarchy){this.lidRing.enabled=false;return;}
      if(this.lidRing.getParent()!==token){this.lidRing.setParent(token);this.lidRing.getTransform().setLocalPosition(new vec3(0,0,.3));this.lidRing.getTransform().setLocalRotation(quat.quatIdentity());}
      this.lidRing.getTransform().setLocalScale(vec3.one().uniformScale(pulse));this.lidRing.enabled=true;return;}
    this.lidRing.enabled=false;
    const placed=this.place(this.target);if(!placed){this.ring.enabled=false;return;}
    const t=this.ring.getTransform();t.setWorldPosition(placed.at);t.setWorldRotation(quat.quatIdentity());t.setWorldScale(vec3.one().uniformScale(placed.radius*pulse));this.ring.enabled=true;
  }
  /** The next useful thing, from engine state only. */
  private pick(state:GameState):{kind:NextGlowKind;id:string}|null {
    const graph=this.engine.graphRef(),eye=this.engine.player.getTransform().getWorldPosition();
    const heard=new Set(state.notebook.map(c=>c.speaker));
    const nearest=<T>(items:T[],at:(item:T)=>vec3|null):T|null=>{let best:T|null=null,d=1e9;for(const item of items){const p=at(item);if(!p)continue;const e=p.distance(eye);if(e<d){d=e;best=item;}}return best;};
    const suspectAt=(id:string)=>{const a=this.interrogation.actorFor(id);return a&&a.getSceneObject().isEnabledInHierarchy?a.getTransform().getWorldPosition():null;};
    const unheard=graph.cast.suspects.filter(s=>!heard.has(s.id));
    if(state.notebook.length===0){const s=nearest(unheard,s=>suspectAt(s.id));return s?{kind:"suspect",id:s.id}:null;}
    if(state.arguments.length>=graph.requiredDeductions.length)return {kind:"accuse",id:"Accuse"};
    const objects=new Set(graph.room.objects.map(o=>o.id)),known=new Set(state.knowledge.evidenceIds);
    const unseen=graph.evidence.filter(e=>!e.latent&&objects.has(e.holder)&&!known.has(e.id)).map(e=>e.holder);
    const o=nearest([...new Set(unseen)],id=>this.objectAt(id));if(o)return {kind:"object",id:o};
    const s=nearest(unheard,s=>suspectAt(s.id));if(s)return {kind:"suspect",id:s.id};
    return {kind:"accuse",id:"Accuse"};
  }
  private place(target:{kind:NextGlowKind;id:string}):{at:vec3;radius:number}|null {
    if(target.kind==="suspect"){const a=this.interrogation.actorFor(target.id);if(!a||!a.getSceneObject().isEnabledInHierarchy)return null;return {at:a.getTransform().getWorldPosition().add(new vec3(0,1,0)),radius:38};}
    const at=this.objectAt(target.id);return at?{at:at.add(new vec3(0,.6,0)),radius:13}:null;
  }
  /** Where the object's drawn prop actually stands (its visual), else the engine position in the room. */
  private objectAt(id:string):vec3|null {
    if(!this.visuals.has(id))this.visuals.set(id,findByName(this.engine.roomRoot,"RoomscriptPropVisual_"+id));
    const visual=this.visuals.get(id);if(visual&&!isNull(visual)){if(!visual.isEnabledInHierarchy)return null;return visual.getTransform().getWorldPosition();}
    const o=this.engine.graphRef().room.objects.find(o=>o.id===id);if(!o)return null;
    return this.engine.roomRoot.getTransform().getWorldTransform().multiplyPoint(new vec3(o.pos[0],o.pos[1],o.pos[2]));
  }
}
function findByName(root:SceneObject,name:string):SceneObject|null {if(root.name===name)return root;for(let i=0;i<root.getChildrenCount();i++){const f=findByName(root.getChild(i),name);if(f)return f;}return null;}
