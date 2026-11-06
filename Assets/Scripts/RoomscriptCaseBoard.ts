import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {caseBoardLayout,CaseBoard,BoardItem} from "./Engine/perf/CaseBoardLayout";
import {chooseBoardWall} from "./Engine/perf/WallBoard";
import {lineTubes,rectEdges,circleEdges,polyline,flatText,tinted,Segment} from "./RoomscriptLineArt";
import {iconImage} from "./RoomscriptGlyphUI";
import {admittedCard} from "./RoomscriptArtLibrary";
import {GameState} from "./Engine/core/Types";
/** Run 8 case board on a real wall (WEARER_UX object UI 5, wow 4).
 * The Clue grid, pinned memory photos and red string live on the wall; you walk over to read it.
 * Everything drawn comes from caseBoardLayout/evidenceWeb, i.e. engine knowledge only.
 */
const BRASS=new vec4(.91,.69,.29,1),IVORY=new vec4(1,.94,.84,1),CORAL=new vec4(1,.42,.35,1),CHALK=new vec4(.93,.96,1,1),DIM=new vec4(1,.94,.84,.45);
/** Evening Room left wall (x=-271). Centre 136 cm above the floor at z=-172, clear of every suspect sightline, facing +x. */
export const PRESET_BOARD={center:new vec3(-268.5,-40,-172),normal:new vec3(1,0,0),width:100,height:66};
export class RoomscriptCaseBoard {
  readonly root:SceneObject;private content:SceneObject;private key="";private line:Material;private items=new Map<string,BoardItem>();
  private flights:{object:SceneObject;from:vec3;to:SceneObject;began:number}[]=[];private stamps:{object:SceneObject;began:number}[]=[];
  private placed=false;private hits:{position:[number,number,number];normal:[number,number,number]}[]=[];private session:HitTestSession|null=null;private nextProbe=0;
  private lastEvidence=new Set<string>();private lastSeq=0;private closed=false;
  constructor(private owner:BaseScriptComponent,private engine:RoomscriptEngineBridge,private flow:RoomscriptInterrogationController,private sound:(cue:string,at?:vec3)=>void){
    this.line=requireAsset("../Materials/RoomscriptCyan.mat") as Material;
    this.root=global.scene.createSceneObject("RoomscriptCaseBoard");this.root.createComponent("Component.Canvas");
    engine.onState.add(state=>this.refresh(state));engine.onCaseChanged.add(()=>this.resetForCase());
    owner.createEvent("UpdateEvent").bind(()=>this.update());this.resetForCase();
  }
  private resetForCase():void {
    this.key="";this.closed=false;this.items.clear();this.lastEvidence=new Set(this.engine.snapshot().knowledge.evidenceIds);this.lastSeq=0;
    if(this.engine.mode()==="preset"){this.place(PRESET_BOARD.center,PRESET_BOARD.normal);}else{this.placed=false;this.hits=[];this.root.enabled=false;}
    this.refresh(this.engine.snapshot(),true);
  }
  private place(center:vec3,normal:vec3):void {this.placed=true;this.root.enabled=true;const t=this.root.getTransform();t.setWorldPosition(center);t.setWorldRotation(quat.lookAt(normal,vec3.up()));}
  /** Dynamic: sample the current view with World Query until a wall wide enough for the board is found. */
  private probeWall():void {
    if(this.placed||getTime()<this.nextProbe)return;this.nextProbe=getTime()+.6;
    try{if(!this.session){const module:WorldQueryModule=require("LensStudio:WorldQueryModule");this.session=module.createHitTestSession();this.session.start();}}catch{return;}
    const camera=this.flow.actor.camera.getTransform(),eye=camera.getWorldPosition(),rotation=camera.getWorldRotation();
    for(let i=-3;i<=3;i++){const dir=rotation.multiplyVec3(quat.angleAxis(i*.12,vec3.up()).multiplyVec3(vec3.back()));
      this.session.hitTest(eye,eye.add(dir.uniformScale(500)),hit=>{if(hit)this.hits.push({position:[hit.position.x,hit.position.y,hit.position.z],normal:[hit.normal.x,hit.normal.y,hit.normal.z]});});}
    if(this.hits.length>=6){const wall=chooseBoardWall(this.hits.slice(-120),[eye.x,eye.y,eye.z],this.engine.roomRoot.getTransform().getWorldPosition().y);
      if(wall)this.place(new vec3(wall.center[0],wall.center[1],wall.center[2]).add(new vec3(wall.normal[0],0,wall.normal[2]).uniformScale(1.5)),new vec3(wall.normal[0],0,wall.normal[2]).normalize());}
  }
  private refresh(state:GameState,force=false):void {
    const graph=this.engine.graphRef(),board=caseBoardLayout(graph,state,{width:PRESET_BOARD.width,height:PRESET_BOARD.height}),key=JSON.stringify(board);if(!force&&key===this.key)return;this.key=key;
    const fresh=state.knowledge.evidenceIds.filter(id=>!this.lastEvidence.has(id));this.lastEvidence=new Set(state.knowledge.evidenceIds);
    if(this.content&&!isNull(this.content))this.content.destroy();this.content=global.scene.createSceneObject("Board content");this.content.setParent(this.root);this.items.clear();
    this.draw(board,state);
    // Memory photos fly from their object to their pin (feedback at the action: the board fills as you investigate).
    for(const id of fresh){const node=this.find("photo:"+id),evidence=graph.evidence.find(e=>e.id===id);if(!node||!evidence)continue;
      let from:vec3;try{from=this.engine.roomRoot.getTransform().getWorldTransform().multiplyPoint(new vec3(...(graph.room.objects.find(o=>o.id===evidence.holder)?.pos||[0,0,0]) as [number,number,number]));}catch{continue;}
      this.flights.push({object:node,from,to:node,began:getTime()});}
    // A filed deduction lands as a stamp on the board.
    const filed=state.events.filter(e=>e.seq>this.lastSeq&&(e.type==="argumentSupported"||e.type==="objectionCorrect"));this.lastSeq=state.lastSeq;
    if(filed.length&&!force)this.stamp("FILED",CORAL);
    if(state.verdict&&!force&&!this.closed){this.closed=true;this.stamp("CASE CLOSED",state.verdict==="correct"?BRASS:CORAL);}
  }
  private find(id:string):SceneObject|null {for(let i=0;i<this.content.getChildrenCount();i++){const c=this.content.getChild(i);if(c.name==="Board item "+id)return c;}return null;}
  private draw(board:CaseBoard,state:GameState):void {
    const v=(x:number,y:number,z=0)=>new vec3(x,y,z);
    lineTubes(this.content,"Board frame",[...rectEdges(board.width,board.height),...rectEdges(board.width-3,board.height-3)],tinted(this.line,BRASS),.5);
    const title=flatText(this.content,"Board title",this.engine.mode()==="preset"?"THE HARLOW TRUST":"SAME ROOM. NEW MURDER.",3,BRASS,"title",60,4);title.getSceneObject().getTransform().setLocalPosition(v(0,board.height/2+3.2,.4));
    const flow=this.flow;
    for(const item of board.items){this.items.set(item.id,item);
      const node=global.scene.createSceneObject("Board item "+item.id);node.setParent(this.content);node.getTransform().setLocalPosition(v(item.x,item.y,.3));
      const ink=item.kind==="weapon"?CORAL:item.kind==="zone"?CHALK:item.kind==="photo"?BRASS:IVORY,color=item.crossed?DIM:ink;
      if(item.kind!=="stamp")lineTubes(node,"Card outline",rectEdges(item.w,item.h),tinted(this.line,color),.22);
      if(item.kind==="suspect"){const actor=flow.actorFor(item.id.slice(4));if(actor?.neutral)iconImage(node,"Portrait",actor.neutral,Math.min(item.w,item.h)*.78,new vec4(1,1,1,item.crossed?.35:1),v(0,item.h*.08,.2));}
      if(item.kind==="photo"){const card=admittedCard(this.engine.graphRef(),state,item.id.slice(6));if(card)iconImage(node,"Photo",card.texture,Math.min(item.w,item.h)*.86,new vec4(1,1,1,1),v(0,item.h*.06,.2));
        lineTubes(node,"Pushpin",circleEdges(.7,10,v(0,item.h/2-.6,.6)),tinted(this.line,CORAL),.35);}
      const label=flatText(node,"Card label",item.label,1.6,color,"body",item.w-1,2.2);label.getSceneObject().getTransform().setLocalPosition(v(0,-item.h/2+1.4,.5));
      if(item.crossed)lineTubes(node,"Crossed out",[[v(-item.w/2+.6,-item.h/2+.6,.8),v(item.w/2-.6,item.h/2-.6,.8)],[v(-item.w/2+.6,item.h/2-.6,.8),v(item.w/2-.6,-item.h/2+.6,.8)]],tinted(this.line,CORAL),.45);
    }
    // Red string between pins, with a little sag.
    const strings:Segment[]=[];for(const s of board.strings){const a=this.items.get(s.from),b=this.items.get(s.to);if(!a||!b)continue;
      const p=v(a.x,a.y+a.h/2-.6,.9),q=v(b.x,b.y+b.h/2-.6,.9),mid=vec3.lerp(p,q,.5).add(v(0,-Math.min(6,p.distance(q)*.12),0));strings.push(...polyline([p,vec3.lerp(p,mid,.5).add(v(0,-.6,0)),mid,vec3.lerp(mid,q,.5).add(v(0,-.6,0)),q]));}
    if(strings.length)lineTubes(this.content,"Red string",strings,tinted(this.line,CORAL),.25);
  }
  private stamp(text:string,color:vec4):void {
    const node=global.scene.createSceneObject("Board stamp "+text);node.setParent(this.root);node.getTransform().setLocalPosition(new vec3(22,-24,1.4));node.getTransform().setLocalRotation(quat.fromEulerAngles(0,0,-.18));
    lineTubes(node,"Stamp frame",[...rectEdges(text.length>8?34:20,8),...rectEdges(text.length>8?32:18,6)],tinted(this.line,color),.4);
    flatText(node,"Stamp word",text,4.2,color,"title",text.length>8?30:16,5.4);this.stamps.push({object:node,began:getTime()});
    this.sound("StampThump",this.root.getTransform().getWorldPosition());
  }
  private update():void {
    if(this.engine.mode()==="dynamic")this.probeWall();
    for(let i=this.flights.length-1;i>=0;i--){const f=this.flights[i];if(isNull(f.object)){this.flights.splice(i,1);continue;}const t=Math.min(1,(getTime()-f.began)/1.3),e=1-Math.pow(1-t,3);
      const home=this.root.getTransform().getWorldTransform().multiplyPoint(new vec3(this.items.get(f.object.name.slice(11))?.x||0,this.items.get(f.object.name.slice(11))?.y||0,.3));
      f.object.getTransform().setWorldPosition(vec3.lerp(f.from,home,e).add(new vec3(0,Math.sin(e*Math.PI)*35,0)));f.object.getTransform().setWorldScale(vec3.one().uniformScale(.6+.4*e));
      if(t>=1){f.object.getTransform().setWorldPosition(home);this.flights.splice(i,1);this.sound("PinPhoto",home);}}
    for(let i=this.stamps.length-1;i>=0;i--){const s=this.stamps[i];if(isNull(s.object)){this.stamps.splice(i,1);continue;}const t=Math.min(1,(getTime()-s.began)/.35);s.object.getTransform().setLocalScale(vec3.one().uniformScale(1+2*(1-t)));if(t>=1)this.stamps.splice(i,1);}
  }
  diagnostics():{placed:boolean;items:number;strings:number;center:number[]}{const p=this.root.getTransform().getWorldPosition();return {placed:this.placed,items:this.items.size,strings:this.key?JSON.parse(this.key).strings.length:0,center:[p.x,p.y,p.z]};}
}
