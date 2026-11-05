import {RoomscriptClueController} from "./RoomscriptClueController";
import {RoomscriptCastController} from "./RoomscriptCastController";
import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
import {worldLines} from "./RoomscriptWorldLines";
import {Hypothesis,GameState,CaseGraph} from "./Engine/core/Types";
import {availableArguments,reconstructionBeats,ReconstructionBeat} from "./Engine/game/Closing";
import {endingSummary,CitedSentence} from "./Engine/game/CaseClarity";
import {scoreCase} from "./Engine/game/Scoring";
import {caseExitPosition} from "./Engine/game/RoomPresentation";
import {routeReplay,RouteReplay} from "./Engine/game/RouteReplay";
import {isHarlowPreset} from "./Engine/game/NarrativeAudio";

/** Accusation UI submits the chosen cards; all reveal and rating data comes from the engine. */
@component export class RoomscriptClosingController extends BaseScriptComponent {
  @input @hint("Suggestion selection and shared presentation") clue:RoomscriptClueController;
  @input @hint("Persistent visible cast") cast:RoomscriptCastController;
  private panel:SceneObject;private title:Text;private body:Text;private labels:Text[];private controls:SceneObject;
  private picked:Hypothesis;private opened=false;private heldAt=-1;private phase="idle";private began=0;private frame=-1;
  private frames:ReconstructionBeat[]=[];private summary:CitedSentence[]=[];private ghostMaterials=new Map<string,Material>();private holdUntil=0;private escapeActor:SceneObject;private escapeDoor:vec3;private sealLabel:Text;private ghosts=new Map<string,SceneObject>();private resultText="";
  private escapeStart:vec3|null=null;
  private result:SceneObject;
  private details:SceneObject;private routeRoot:SceneObject;private route:RouteReplay;private routeText="";private sealedState:GameState;private sealedGraph:CaseGraph;
  private detailRender:(()=>void)|null=null;
  private imageTemplate=requireAsset("../RoomscriptProbeImage.mat") as Material;
  private stampTexture=requireAsset("../Art/Run7/VerdictStamp.png") as Texture;
  private victimStanding=requireAsset("../Art/Actors/Harlow/Harlow-standing.png") as Texture;
  private victimFalling=requireAsset("../Art/Actors/Harlow/Harlow-falling.png") as Texture;
  private art:Record<string,{claim:Texture;truth:Texture;neutral:Texture}>={
    S1:{claim:requireAsset("../Art/Ghosts/Qadir-claim.png") as Texture,truth:requireAsset("../Art/Ghosts/Qadir-truth.png") as Texture,neutral:requireAsset("../Art/Actors/Qadir/Qadir-neutral.png") as Texture},
    S2:{claim:requireAsset("../Art/Ghosts/Vale-claim.png") as Texture,truth:requireAsset("../Art/Ghosts/Vale-truth.png") as Texture,neutral:requireAsset("../Art/Actors/Vale/Vale-neutral.png") as Texture},
    S3:{claim:requireAsset("../Art/Ghosts/Okafor-claim.png") as Texture,truth:requireAsset("../Art/Ghosts/Okafor-truth.png") as Texture,neutral:requireAsset("../Art/Actors/Okafor/Okafor-neutral.png") as Texture},
    S4:{claim:requireAsset("../Art/Ghosts/Pike-claim.png") as Texture,truth:requireAsset("../Art/Ghosts/Pike-truth.png") as Texture,neutral:requireAsset("../Art/Actors/Pike/Pike-neutral.png") as Texture}
  };
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private build():void {
    if(this.panel)return;const flow=this.cast.flow;flow.engine.initialize();this.cast.room.initialize();const graph=flow.engine.graphRef();this.picked={who:graph.cast.suspects[0].id,where:graph.room.zones[0].id,what:graph.weapons[0]};
    this.panel=uiObject(this.getSceneObject(),"RoomscriptClosingPanel");const ui=new PanelUI(this.panel,66,60,2.1,new vec4(1,.94,.84,1));
    this.title=ui.text("Closing title","FINAL ACCUSATION",8,"title");this.body=ui.text("Closing summary","",18,"small");
    this.labels=ui.buttons([{id:"Accused suspect",label:"Who"},{id:"Accused room",label:"Where"},{id:"Accused weapon",label:"What"}],id=>{if(this.phase!=="idle")return;const current=flow.engine.graphRef(),key=id==="Accused suspect"?"who":id==="Accused room"?"where":"what",list=key==="who"?current.cast.suspects.map(s=>s.id):key==="where"?current.room.zones.map(z=>z.id):current.weapons;this.picked[key]=list[(list.indexOf(this.picked[key])+1)%list.length];this.render();},8);
    ui.buttons([{id:"File deductions",label:"File known proof"}],()=>{if(this.phase!=="idle")return;for(const claim of availableArguments(flow.engine.graphRef(),flow.engine.snapshot()))flow.engine.dispatch({type:"ArgumentClaim",...claim});this.render();},6);
    this.sealLabel=ui.buttons([{id:"Break seal",label:"Hold seal for 1 second"}],()=>{const held=this.heldAt>=0&&getTime()-this.heldAt>=1;this.heldAt=-1;if(held)this.accuse();},7,undefined,()=>{if(this.phase==="idle")this.heldAt=getTime();})[0];
    ui.buttons([{id:"Cancel accusation",label:"Keep investigating"}],()=>{if(this.phase==="idle"&&flow.engine.snapshot().verdict!=="timeout")this.close();},6);
    flow.engine.onState.add(state=>this.onState(state));flow.engine.onCaseChanged.add(()=>this.resetForCase());this.clue.objection.caseLid.onAction.add(action=>{if(action==="Accuse")this.open();});this.panel.enabled=false;
  }
  resetForCase():void {
    if(!this.panel)return;this.cast.room.initialize();this.cast.flow.cancel();const graph=this.cast.flow.engine.graphRef();
    this.opened=false;this.heldAt=-1;this.phase="idle";this.began=0;this.frame=-1;this.frames=[];this.summary=[];this.holdUntil=0;this.escapeStart=null;this.resultText="";this.routeText="";this.route=null;this.sealedState=null;this.sealedGraph=null;
    for(const ghost of this.ghosts.values())if(!isNull(ghost))ghost.destroy();this.ghosts.clear();this.ghostMaterials.clear();
    if(this.result&&!isNull(this.result))this.result.destroy();this.result=null;
    if(this.details&&!isNull(this.details))this.details.destroy();this.details=null;this.detailRender=null;if(this.routeRoot&&!isNull(this.routeRoot))this.routeRoot.destroy();this.routeRoot=null;
    this.picked={who:graph.cast.suspects[0].id,where:graph.room.zones[0].id,what:graph.weapons[0]};
    const restore=(root:SceneObject)=>{for(let i=0;i<root.getChildrenCount();i++){const child=root.getChild(i);if(child.name==="Button row")child.enabled=true;else restore(child);}};restore(this.panel);
    this.sealLabel.text="Hold seal for 1 second";this.panel.enabled=false;this.clue.envelope.enabled=true;this.clue.objection.tells.audio.silence(false);this.showInvestigation(true);this.render();
  }
  open():void {const state=this.cast.flow.engine.snapshot();if(state.verdict&&state.verdict!=="timeout")return;this.cast.flow.cancel();this.clue.objection.close();this.picked=this.clue.selected()||this.picked;this.opened=true;this.panel.enabled=true;this.showInvestigation(false);this.render();this.clue.objection.tells.audio.beforeSeal();}
  private showInvestigation(value:boolean):void {const flow=this.cast.flow;flow.subtitles.getSceneObject().enabled=value;flow.chips.show(value);flow.verbs.show(value);this.clue.objection.caseLid.show(value);this.cast.getSceneObject().enabled=value;this.clue.objection.wallet.show(false);this.clue.notebook.show(false);}
  private close():void {this.opened=false;this.panel.enabled=false;this.showInvestigation(true);}
  private render():void {
    const graph=this.cast.flow.engine.graphRef(),state=this.cast.flow.engine.snapshot();
    this.title.text=state.verdict==="timeout"?"TIME IS UP — ONE ACCUSATION":"FINAL ACCUSATION";
    this.labels[0].text=graph.cast.suspects.find(s=>s.id===this.picked.who)!.name.split(" ").slice(-1)[0];this.labels[1].text=graph.room.zones.find(z=>z.id===this.picked.where)!.clueName;this.labels[2].text=wrapText(graph.room.objects.find(o=>o.id===this.picked.what)!.label,12);
    this.body.text=wrapText(state.arguments.length+" / "+graph.requiredDeductions.length+" proof filed. Hold the seal when ready.",35);
  }
  private onState(state:GameState):void {
    if(state.verdict==="timeout"&&!this.opened)this.open();
    if((state.verdict==="correct"||state.verdict==="wrong")&&this.phase==="idle")this.beginReveal(state);
  }
  private accuse():void {if(this.phase!=="idle")return;this.cast.flow.cancel();this.cast.flow.engine.dispatch({type:"Accuse",...this.picked});}
  private beginReveal(state:GameState):void {
    if(state.verdict!=="correct"&&state.verdict!=="wrong")return;
    const graph=this.cast.flow.engine.graphRef();this.sealedState=state;this.sealedGraph=graph;this.opened=true;this.showInvestigation(false);this.panel.enabled=true;this.phase="reconstruction";this.began=getTime();this.frames=reconstructionBeats(graph,state);this.summary=endingSummary(graph,state);this.clue.envelope.enabled=false;this.clue.objection.tells.audio.silence(false);
    const score=scoreCase(graph,state);this.resultText=(state.verdict==="correct"?"CASE CLOSED":"THE CULPRIT ESCAPED")+"\nHolmes rating: "+score.rating+" / 3\n"+score.stars.map(star=>(star.earned?"★ ":"☆ ")+star.name).join("\n")+"\n"+score.deductions+" / "+score.required+" deductions\n"+"You: "+state.elapsedMinutes+" min · Par: "+score.minimumMinutes+"\n"+graph.caseId+"\nSeal "+graph.pitchHash;
    const hideRows=(root:SceneObject)=>{for(let i=0;i<root.getChildrenCount();i++){const child=root.getChild(i);if(child.name==="Button row")child.enabled=false;else hideRows(child);}};hideRows(this.panel);
    if(state.verdict==="wrong"){this.escapeActor=this.cast.flow.actorFor(graph.envelope.who)!.getSceneObject();this.escapeStart=this.escapeActor.getTransform().getWorldPosition();this.escapeDoor=this.cast.room.toWorld(caseExitPosition(graph));this.escapeDoor.y=this.escapeStart.y;}
    for(const person of [...graph.cast.suspects,graph.cast.victim]){const ghost=uiObject(this.cast.room.getSceneObject(),"RoomscriptReconstruction_"+person.id);ghost.createComponent("Component.Canvas");ghost.getTransform().setLocalScale(vec3.one().uniformScale(.75));const texture=person.id===graph.cast.victim.id?this.victimStanding:this.art[person.id].neutral;this.ghostMaterials.set(person.id,this.image(ghost,"Memory engraving",texture,85,170,true));this.ghosts.set(person.id,ghost);ghost.enabled=false;}
    this.route=routeReplay(state);this.buildRoute(graph);
  }
  private image(parent:SceneObject,name:string,texture:Texture,width:number,height:number,bottom=false):Material {
    const root=uiObject(parent,name),screen=root.createComponent("Component.ScreenTransform") as ScreenTransform;screen.anchors=Rect.create(0,0,0,0);screen.offsets=Rect.create(-width/2,width/2,bottom?0:-height/2,bottom?height:height/2);
    const visual=root.createComponent("Component.Image") as Image,material=this.imageTemplate.clone();material.mainPass.baseTex=texture;material.mainPass.baseColor=new vec4(1,1,1,1);material.mainPass.depthTest=true;material.mainPass.depthWrite=false;material.mainPass.twoSided=true;visual.clearMaterials();visual.addMaterial(material);return material;
  }
  private buildRoute(graph:CaseGraph):void {
    this.routeRoot=uiObject(this.cast.room.getSceneObject(),"RoomscriptPlayerRoute");this.routeRoot.getTransform().setLocalPosition(new vec3(0,1.5,0));const segments:[vec3,vec3][]=[];
    for(const path of this.route.segments)for(let i=1;i<path.length;i++)segments.push([new vec3(path[i-1][0],0,path[i-1][2]),new vec3(path[i][0],0,path[i][2])]);
    if(segments.length){const material=this.clue.objection.tells.lightMaterial.clone();material.mainPass.baseColor=new vec4(.247,.89,1,.24);const stride=Math.max(1,Math.ceil(segments.length/2000));worldLines(this.routeRoot,"Your recorded footsteps",segments.filter((_,i)=>i%stride===0),material,1.1,vec3.up());}
    const repeated=Object.entries(this.route.inspections).filter(([,count])=>count>=2).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
    const label=repeated?graph.room.objects.find(o=>o.id===repeated[0])?.label:undefined;
    this.routeText=this.route.points.length?this.route.text:"No walking samples recorded.";
    if(repeated&&label)this.routeText+=" You checked the "+label+(repeated[1]===2?" twice.":" "+repeated[1]+" times.");
    else if(Object.keys(this.route.inspections).length)this.routeText+=" "+Object.keys(this.route.inspections).length+" objects checked.";
    this.routeRoot.enabled=false;
  }
  /** Director-only capture hold; never changes engine time or verdict. */
  holdFreeze(seconds=20):void {if(this.frames[this.frame]?.kind==="freeze")this.holdUntil=getTime()+Math.min(20,Math.max(0,seconds));}
  private update():void {
    if(this.heldAt>=0&&this.phase==="idle")this.sealLabel.text="SEAL "+Math.min(100,Math.floor((getTime()-this.heldAt)*100))+"%";
    if(this.phase!=="reconstruction")return;
    const camera=this.cast.flow.actor.camera.getTransform().getWorldPosition();for(const ghost of this.ghosts.values())if(ghost.enabled){const direction=camera.sub(ghost.getTransform().getWorldPosition());direction.y=0;if(direction.length>.01)ghost.getTransform().setWorldRotation(quat.lookAt(direction.normalize(),vec3.up()));}
    if(this.holdUntil>getTime()){this.began+=getDeltaTime();return;}
    const elapsed=getTime()-this.began;let total=0,index=0;for(;index<this.frames.length-1;index++){total+=this.frames[index].durationSeconds;if(elapsed<total)break;}
    if(this.escapeStart){this.escapeActor.getTransform().setWorldPosition(vec3.lerp(this.escapeStart,this.escapeDoor,Math.min(1,elapsed/4)));if(elapsed>=4)this.escapeActor.enabled=false;}
    if(index!==this.frame){this.frame=index;const beat=this.frames[index],graph=this.sealedGraph;
      this.title.text=beat.kind==="freeze"?beat.time+" — THE TRUTH":beat.kind==="stamp"?beat.caption:"RECONSTRUCTION / "+beat.kind.toUpperCase();
      this.body.text=wrapText(beat.kind==="correction"||beat.kind==="freeze"?this.routeText:beat.kind==="resume"?this.summary.filter(line=>!line.speaker)[0]?.text||beat.caption:beat.caption,40);
      for(const [id,ghost] of this.ghosts){let mark=beat.positions?.[id];if(beat.kind==="claims"){const claim=beat.claims?.find(c=>c.suspect===id),zone=graph.room.zones.find(z=>z.id===claim?.zone);mark=zone?[zone.anchor[0],0,zone.anchor[2]+55]:undefined;}
        ghost.enabled=!!mark;if(mark)ghost.getTransform().setLocalPosition(new vec3(mark[0],mark[1],mark[2]));
        const material=this.ghostMaterials.get(id)!;
        if(id===graph.cast.victim.id){material.mainPass.baseTex=beat.kind==="freeze"?this.victimFalling:this.victimStanding;material.mainPass.baseColor=new vec4(1,1,1,.75);}
        else if(isHarlowPreset(graph)){material.mainPass.baseTex=beat.kind==="claims"?this.art[id].claim:this.art[id].truth;material.mainPass.baseColor=new vec4(1,1,1,.8);}
        else{material.mainPass.baseTex=this.art[id].neutral;material.mainPass.baseColor=beat.kind==="claims"?new vec4(.247,.89,1,.7):id===graph.envelope.who?new vec4(1,.42,.35,.85):new vec4(1,1,1,.75);}}
      if(this.routeRoot)this.routeRoot.enabled=["correction","freeze","ledger"].includes(beat.kind)&&this.route.points.length>1;
      this.clue.objection.tells.audio.reconstructionBeat(beat.kind);
    }
    const length=this.frames.reduce((sum,b)=>sum+b.durationSeconds,0);
    if(elapsed>=length)this.showEnding();
  }  diagnostics():{phase:string;opened:boolean;picked:Hypothesis;result:string} {return {phase:this.phase,opened:this.opened,picked:{...this.picked},result:this.resultText};}
  private showEnding():void {
    this.phase="ending";this.panel.enabled=false;this.ghosts.forEach(g=>g.enabled=false);if(this.routeRoot)this.routeRoot.enabled=false;
    this.result=uiObject(this.getSceneObject(),"RoomscriptResult");const ui=new PanelUI(this.result,54,40,1.5,new vec4(1,.42,.35,1),false,true);
    const title=ui.text("Ending stamp",this.sealedState.verdict==="correct"?"CASE CLOSED":"CASE UNPROVEN",18,"title");this.image(title.getSceneObject().getParent(),"Verdict stamp",this.stampTexture,50,16);
    const starRow=ui.text("Earned stars","",7,"body").getSceneObject(),score=scoreCase(this.sealedGraph,this.sealedState);
    score.stars.forEach((star,index)=>{const points=Array.from({length:10},(_,i)=>{const angle=Math.PI/2+i*Math.PI/5,radius=i%2?1.1:2.6;return new vec3((index-1)*9+Math.cos(angle)*radius,Math.sin(angle)*radius,.6);});const material=this.clue.objection.tells.lightMaterial.clone();material.mainPass.baseColor=star.earned?new vec4(1,.84,.04,1):new vec4(1,.94,.84,.25);worldLines(starRow,"Ending star "+index,points.map((point,i)=>[point,points[(i+1)%10]] as [vec3,vec3]),material,.55);});
    ui.buttons([{id:"Ending details",label:"Details"}],()=>this.openDetails(),8);
    this.clue.objection.tells.audio.silence(false);this.clue.objection.tells.audio.endingBeat();
  }
  private openDetails():void {
    this.result.enabled=false;
    if(this.details){this.details.enabled=true;this.detailRender?.();return;}
    this.details=uiObject(this.getSceneObject(),"RoomscriptEndingDetails");const ui=new PanelUI(this.details,60,62,1.25,new vec4(1,.94,.84,1));
    const title=ui.text("Detail title","",7,"title"),body=ui.text("What happened","",34,"small");
    const pages=[{title:"YOUR ROUTE",text:this.routeText},...this.summary.map(line=>({title:line.speaker?"PRIVATE MOTIVE":"WHAT HAPPENED",text:line.text})),{title:"CASE RECORD",text:this.resultText}];let page=0;
    const render=()=>{title.text=pages[page].title;body.text=wrapText(pages[page].text,38);if(this.routeRoot)this.routeRoot.enabled=page===0&&this.route.points.length>1;};this.detailRender=render;
    ui.buttons([{id:"Ending previous",label:"Previous"},{id:"Ending next",label:"Next"}],id=>{page=(page+(id==="Ending next"?1:pages.length-1))%pages.length;render();},8);
    ui.buttons([{id:"Ending stamp",label:"Back to stamp"}],()=>{this.details.enabled=false;this.result.enabled=true;if(this.routeRoot)this.routeRoot.enabled=false;},8);render();
  }
  presentationDiagnostics():{ghosts:number;routePoints:number;routeMeters:number;routeText:string;details:boolean} {return {ghosts:[...this.ghosts.values()].filter(g=>g.enabled).length,routePoints:this.route?.points.length||0,routeMeters:this.route?.distanceMeters||0,routeText:this.routeText,details:!!this.details?.enabled};}
}
