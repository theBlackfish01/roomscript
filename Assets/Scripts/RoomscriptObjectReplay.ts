import {RoomscriptWrenHints} from "./RoomscriptWrenHints";
import {ghostArt,ghostImage,GHOST_TINT} from "./RoomscriptGhostArt";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";
import {objectReplay,ReplayVignette} from "./Engine/game/ObjectReplay";
import {lineTubes,circleEdges,flatText,tinted} from "./RoomscriptLineArt";
import {iconImage} from "./RoomscriptGlyphUI";
import {GameState} from "./Engine/core/Types";
/** Run 8 wow 3: objects replay what they saw. A newly collected memory blooms into a ~5 s, real-scale
 * ghost vignette at the object, built only from objectReplay() (that memory's own engine facts). */
/** A memory that records no person is not proof the place was empty: only say so when the memory does. */
const SAYS_EMPTY=/(no one|nobody|empty|no beat|no sign of anyone)/i;
const GHOST:Record<string,string>={S1:"Qadir",S2:"Vale",S3:"Okafor",S4:"Pike"};
/** Line-card fallback (CHARACTER_ART="line"); the illustrated cast uses ghostArt(). */
function ghostTexture(id:string):Texture|null {
  switch(id){case "V":return requireAsset("../Art/Actors/Harlow/Harlow-standing.png") as Texture;
    case "S1":return requireAsset("../Art/Actors/Qadir/Qadir-neutral.png") as Texture;case "S2":return requireAsset("../Art/Actors/Vale/Vale-neutral.png") as Texture;
    case "S3":return requireAsset("../Art/Actors/Okafor/Okafor-neutral.png") as Texture;case "S4":return requireAsset("../Art/Actors/Pike/Pike-neutral.png") as Texture;default:return null;}
}
export class RoomscriptObjectReplay {
  private known=new Set<string>();private queue:ReplayVignette[]=[];private active:{root:SceneObject;began:number;figures:SceneObject[];rings:SceneObject[]}|null=null;private line:Material;
  constructor(owner:BaseScriptComponent,private engine:RoomscriptEngineBridge,private flow:RoomscriptInterrogationController,private room:RoomscriptRoomBinding,private sound:(cue:string,at:vec3)=>void){
    this.line=requireAsset("../Materials/RoomscriptCyan.mat") as Material;this.known=new Set(engine.snapshot().knowledge.evidenceIds);
    engine.onState.add(state=>this.accept(state));engine.onCaseChanged.add(()=>{this.stop();this.queue=[];this.known=new Set(engine.snapshot().knowledge.evidenceIds);});
    owner.createEvent("UpdateEvent").bind(()=>this.update());
  }
  private accept(state:GameState):void {
    if(state.verdict)return;const graph=this.engine.graphRef();
    for(const id of state.knowledge.evidenceIds){if(this.known.has(id))continue;this.known.add(id);
      const evidence=graph.evidence.find(e=>e.id===id);if(!evidence)continue;const vignette=objectReplay(graph,state,evidence.holder,{evidence:id});if(vignette)this.queue.push(vignette);}
  }
  /** Director/LEAF: replay a collected object's memory on demand. */
  replay(objectId:string):boolean {const vignette=objectReplay(this.engine.graphRef(),this.engine.snapshot(),objectId);if(!vignette)return false;this.queue.unshift(vignette);this.stop();return true;}
  private start(v:ReplayVignette):void {
    let anchor:vec3;try{anchor=this.room.objectAnchor(v.object).getTransform().getWorldPosition();}catch{return;}
    const root=global.scene.createSceneObject("RoomscriptReplay_"+v.object);root.createComponent("Component.Canvas");root.getTransform().setWorldPosition(anchor);
    const eye=this.flow.actor.camera.getTransform().getWorldPosition();let toward=eye.sub(anchor);toward.y=0;toward=toward.length>1?toward.normalize():vec3.forward();root.getTransform().setWorldRotation(quat.lookAt(toward,vec3.up()));
    const rings=[0,1,2,3].map(i=>lineTubes(root,"Memory ring "+i,circleEdges(10+i*11,36,vec3.zero(),"xz"),tinted(this.line,new vec4(.247,.89,1,.8)),.3).getSceneObject());
    const stamp=flatText(root,"Replay time",v.slot==="earlier"?"EARLIER":v.slot,9,new vec4(.91,.69,.29,1),"title",20,6);stamp.getSceneObject().getTransform().setLocalPosition(new vec3(0,30,0));
    const floorY=this.room.getTransform().getWorldPosition().y,figures:SceneObject[]=[];
    v.figures.forEach((figure,i)=>{const node=global.scene.createSceneObject("Replay figure "+i);node.setParent(root);node.createComponent("Component.Canvas");
      // Real scale, standing on the real floor beside the object, offset towards the viewer.
      const side=(i-(v.figures.length-1)/2)*55,art=figure.suspect?ghostArt(figure.suspect,figure.suspect==="V"?"standing":"neutral"):null;
      node.getTransform().setLocalPosition(new vec3(side,floorY-anchor.y+(art?0:85),38));
      const texture=art?null:figure.suspect?ghostTexture(figure.suspect):null;
      if(art)ghostImage(node,"Ghost",art,GHOST_TINT.replay);
      else if(texture)iconImage(node,"Ghost",texture,170,new vec4(.6,.9,1,.5),new vec3(0,0,.6),false,.5);
      else{lineTubes(node,"Nobody here",circleEdges(30,30,new vec3(0,-84,0),"xz"),tinted(this.line,new vec4(.6,.9,1,.6)),.5);const none=flatText(node,"No one",figure.pose==="absent"&&SAYS_EMPTY.test(v.caption)?"NO ONE":"",4,new vec4(.6,.9,1,.8),"title",30,5);none.getSceneObject().getTransform().setLocalPosition(new vec3(0,-70,0));}
      node.enabled=false;figures.push(node);});
    this.active={root,began:getTime(),figures,rings};this.sound("ReplayRewind",anchor);
    if(this.engine.graphRef().room.objects.find(o=>o.id===v.object)?.type==="kettle")RoomscriptWrenHints.current?.say("W14");
    this.flow.subtitles.set("NARRATOR",v.caption);console.log("OBJECT_REPLAY|"+JSON.stringify({object:v.object,slot:v.slot,figures:v.figures.map(f=>f.suspect),evidence:v.evidence}));
  }
  private holdUntil=0;
  /** Director/film capture only: freeze the current replay at full bloom for a few seconds. */
  holdFor(seconds:number):void {this.holdUntil=getTime()+seconds;}
  private stop():void {if(this.active&&!isNull(this.active.root))this.active.root.destroy();this.active=null;}
  private update():void {
    if(!this.active){const next=this.queue.shift();if(next)this.start(next);return;}
    if(getTime()<this.holdUntil)this.active.began=getTime()-2;const t=getTime()-this.active.began;
    {const phase=Math.floor(t*5)%6;this.active.rings.forEach((ring,i)=>ring.enabled=t<4.6&&(phase===i||phase===i+1));}
    if(t>.6&&!this.active.figures[0]?.enabled&&this.active.figures.length){this.active.figures.forEach(f=>f.enabled=true);this.sound("GhostWhoosh",this.active.root.getTransform().getWorldPosition());}
    if(t>5.2)this.stop();
  }
  diagnostics():{active:string|null;queued:number}{return {active:this.active?this.active.root.name:null,queued:this.queue.length};}
}
