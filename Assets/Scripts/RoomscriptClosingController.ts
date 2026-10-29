import {RoomscriptClueController} from "./RoomscriptClueController";
import {RoomscriptCastController} from "./RoomscriptCastController";
import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
import {worldLines} from "./RoomscriptWorldLines";
import {Hypothesis,GameState} from "./Engine/core/Types";
import {availableArguments,reconstruction,ReconstructionFrame} from "./Engine/game/Closing";
import {scoreCase} from "./Engine/game/Scoring";

/** Accusation UI submits the chosen cards; all reveal and rating data comes from the engine. */
@component export class RoomscriptClosingController extends BaseScriptComponent {
  @input @hint("Suggestion selection and shared presentation") clue:RoomscriptClueController;
  @input @hint("Persistent visible cast") cast:RoomscriptCastController;
  private panel:SceneObject;private title:Text;private body:Text;private labels:Text[];private controls:SceneObject;
  private picked:Hypothesis;private opened=false;private heldAt=-1;private phase="idle";private began=0;private frame=-1;
  private frames:ReconstructionFrame[]=[];private ghosts=new Map<string,SceneObject>();private resultText="";
  private escapeStart:vec3|null=null;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private build():void {
    const flow=this.cast.flow,graph=flow.engine.caseGraph();this.picked={who:graph.cast.suspects[0].id,where:graph.room.zones[0].id,what:graph.weapons[0]};
    this.panel=uiObject(this.getSceneObject(),"RoomscriptClosingPanel");const ui=new PanelUI(this.panel,66,60,2.1,new vec4(1,.94,.84,1));
    this.title=ui.text("Closing title","FINAL ACCUSATION",8,"title");this.body=ui.text("Closing summary","",18,"small");
    this.labels=ui.buttons([{id:"Accused suspect",label:"Who"},{id:"Accused room",label:"Where"},{id:"Accused weapon",label:"What"}],id=>{if(this.phase!=="idle")return;const key=id==="Accused suspect"?"who":id==="Accused room"?"where":"what",list=key==="who"?graph.cast.suspects.map(s=>s.id):key==="where"?graph.room.zones.map(z=>z.id):graph.weapons;this.picked[key]=list[(list.indexOf(this.picked[key])+1)%list.length];this.render();},8);
    ui.buttons([{id:"File deductions",label:"File known proof"}],()=>{if(this.phase!=="idle")return;for(const claim of availableArguments(graph,flow.engine.snapshot()))flow.engine.dispatch({type:"ArgumentClaim",...claim});this.render();},6);
    ui.buttons([{id:"Break seal",label:"Hold seal for 1 second"}],()=>{const held=this.heldAt>=0&&getTime()-this.heldAt>=1;this.heldAt=-1;if(held)this.accuse();},7,undefined,()=>{if(this.phase==="idle")this.heldAt=getTime();});
    ui.buttons([{id:"Cancel accusation",label:"Keep investigating"}],()=>{if(this.phase==="idle"&&flow.engine.snapshot().verdict!=="timeout")this.close();},6);
    flow.engine.onState.add(state=>this.onState(state));this.clue.objection.caseLid.onAction.add(action=>{if(action==="Accuse")this.open();});this.panel.enabled=false;
  }
  open():void {const state=this.cast.flow.engine.snapshot();if(state.verdict&&state.verdict!=="timeout")return;this.cast.flow.cancel();this.clue.objection.close();this.picked=this.clue.selected()||this.picked;this.opened=true;this.panel.enabled=true;this.showInvestigation(false);this.render();}
  private showInvestigation(value:boolean):void {const flow=this.cast.flow;flow.subtitles.getSceneObject().enabled=value;flow.chips.show(value);flow.verbs.show(value);this.clue.objection.caseLid.show(value);this.cast.getSceneObject().enabled=value;this.clue.objection.wallet.show(false);this.clue.notebook.show(false);}
  private close():void {this.opened=false;this.panel.enabled=false;this.showInvestigation(true);}
  private render():void {
    const graph=this.cast.flow.engine.caseGraph(),state=this.cast.flow.engine.snapshot();
    this.title.text=state.verdict==="timeout"?"TIME IS UP — ONE ACCUSATION":"FINAL ACCUSATION";
    this.labels[0].text=graph.cast.suspects.find(s=>s.id===this.picked.who)!.name.split(" ").slice(-1)[0];this.labels[1].text=graph.room.zones.find(z=>z.id===this.picked.where)!.clueName;this.labels[2].text=wrapText(graph.room.objects.find(o=>o.id===this.picked.what)!.label,12);
    this.body.text=wrapText("Choose who, where and with what. "+state.arguments.length+" / "+graph.requiredDeductions.length+" deductions filed. Hold the seal to make your final accusation.",35);
  }
  private onState(state:GameState):void {
    if(state.verdict==="timeout"&&!this.opened)this.open();
    if((state.verdict==="correct"||state.verdict==="wrong")&&this.phase==="idle")this.beginReveal(state);
  }
  private accuse():void {if(this.phase!=="idle")return;this.cast.flow.cancel();this.cast.flow.engine.dispatch({type:"Accuse",...this.picked});}
  private beginReveal(state:GameState):void {
    const graph=this.cast.flow.engine.caseGraph();this.opened=true;this.showInvestigation(false);this.panel.enabled=true;this.phase="reconstruction";this.began=getTime();this.frames=reconstruction(graph,state);this.clue.envelope.enabled=false;this.clue.objection.tells.audio.silence(true);
    const score=scoreCase(graph,state);this.resultText=(state.verdict==="correct"?"CASE CLOSED":"THE CULPRIT ESCAPED")+"\nHolmes rating "+score.rating+" / 3\n"+score.deductions+" / "+score.required+" deductions\n"+state.elapsedMinutes+" minutes (par "+score.minimumMinutes+")"+"\n"+graph.caseId+"\nSeal "+graph.pitchHash;
    const hideRows=(root:SceneObject)=>{for(let i=0;i<root.getChildrenCount();i++){const child=root.getChild(i);if(child.name==="Button row")child.enabled=false;else hideRows(child);}};hideRows(this.panel);
    if(state.verdict==="wrong")this.escapeStart=this.cast.flow.actorFor(graph.envelope.who)!.getTransform().getWorldPosition();
    const material=this.clue.objection.tells.lightMaterial.clone();material.mainPass.baseColor=new vec4(1,.94,.84,.8);
    for(const person of graph.cast.suspects){const ghost=uiObject(this.cast.room.getSceneObject(),"RoomscriptReconstruction_"+person.id);ghost.getTransform().setLocalScale(vec3.one().uniformScale(.75));const points=[new vec3(-18,0,0),new vec3(-23,85,0),new vec3(-12,110,0),new vec3(-12,145,0),new vec3(12,145,0),new vec3(12,110,0),new vec3(23,85,0),new vec3(18,0,0)];worldLines(ghost,"Memory silhouette",points.slice(1).map((p,i)=>[points[i],p] as [vec3,vec3]),material,1.5);this.ghosts.set(person.id,ghost);}
  }
  private update():void {
    if(this.phase!=="reconstruction")return;const elapsed=getTime()-this.began,index=Math.min(this.frames.length-1,Math.floor(elapsed/2));
    if(this.escapeStart){const graph=this.cast.flow.engine.caseGraph(),actor=this.cast.flow.actorFor(graph.envelope.who)!,door=this.cast.room.objectAnchor("O8").getTransform().getWorldPosition();door.y=this.escapeStart.y;actor.getTransform().setWorldPosition(vec3.lerp(this.escapeStart,door,Math.min(1,elapsed/4)));if(elapsed>=4)actor.getSceneObject().enabled=false;}
    if(index!==this.frame){this.frame=index;const frame=this.frames[index];this.title.text=frame.murder?frame.slot+" — THE TRUTH":"RECONSTRUCTION / "+frame.slot;this.body.text=wrapText(frame.caption,35);for(const [id,ghost] of this.ghosts){const mark=frame.positions[id];ghost.enabled=!!mark;if(mark)ghost.getTransform().setLocalPosition(new vec3(mark[0],mark[1],mark[2]));}this.clue.objection.tells.audio.play(frame.murder?"Objection":"ClockTick");}
    if(elapsed>=this.frames.length*2+1){this.phase="ending";this.panel.enabled=false;const result=uiObject(this.getSceneObject(),"RoomscriptResult");const ui=new PanelUI(result,62,55,1.9,new vec4(1,.94,.84,1));ui.text("Case title","HARLOW / 1041",8,"title");ui.text("Result",this.resultText,40,"small");this.ghosts.forEach(g=>g.enabled=false);this.clue.objection.tells.audio.silence(false);this.clue.objection.tells.audio.play("Chime");}
  }
  diagnostics():{phase:string;opened:boolean;picked:Hypothesis;result:string} {return {phase:this.phase,opened:this.opened,picked:{...this.picked},result:this.resultText};}
}
