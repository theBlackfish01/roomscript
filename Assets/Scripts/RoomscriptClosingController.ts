import {RoomscriptClueController} from "./RoomscriptClueController";
import {RoomscriptCastController} from "./RoomscriptCastController";
import {PanelUI,uiObject,wrapText} from "./RoomscriptPanelUI";
import {worldLines} from "./RoomscriptWorldLines";
import {Hypothesis,GameState} from "./Engine/core/Types";
import {availableArguments,reconstructionBeats,ReconstructionBeat} from "./Engine/game/Closing";
import {endingSummary,CitedSentence} from "./Engine/game/CaseClarity";
import {scoreCase} from "./Engine/game/Scoring";

/** Accusation UI submits the chosen cards; all reveal and rating data comes from the engine. */
@component export class RoomscriptClosingController extends BaseScriptComponent {
  @input @hint("Suggestion selection and shared presentation") clue:RoomscriptClueController;
  @input @hint("Persistent visible cast") cast:RoomscriptCastController;
  private panel:SceneObject;private title:Text;private body:Text;private labels:Text[];private controls:SceneObject;
  private picked:Hypothesis;private opened=false;private heldAt=-1;private phase="idle";private began=0;private frame=-1;
  private frames:ReconstructionBeat[]=[];private summary:CitedSentence[]=[];private ghostMaterials=new Map<string,Material>();private holdUntil=0;private escapeActor:SceneObject;private escapeDoor:vec3;private sealLabel:Text;private ghosts=new Map<string,SceneObject>();private resultText="";
  private escapeStart:vec3|null=null;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.build());this.createEvent("UpdateEvent").bind(()=>this.update());}
  private build():void {
    const flow=this.cast.flow,graph=flow.engine.graphRef();this.picked={who:graph.cast.suspects[0].id,where:graph.room.zones[0].id,what:graph.weapons[0]};
    this.panel=uiObject(this.getSceneObject(),"RoomscriptClosingPanel");const ui=new PanelUI(this.panel,66,60,2.1,new vec4(1,.94,.84,1));
    this.title=ui.text("Closing title","FINAL ACCUSATION",8,"title");this.body=ui.text("Closing summary","",18,"small");
    this.labels=ui.buttons([{id:"Accused suspect",label:"Who"},{id:"Accused room",label:"Where"},{id:"Accused weapon",label:"What"}],id=>{if(this.phase!=="idle")return;const key=id==="Accused suspect"?"who":id==="Accused room"?"where":"what",list=key==="who"?graph.cast.suspects.map(s=>s.id):key==="where"?graph.room.zones.map(z=>z.id):graph.weapons;this.picked[key]=list[(list.indexOf(this.picked[key])+1)%list.length];this.render();},8);
    ui.buttons([{id:"File deductions",label:"File known proof"}],()=>{if(this.phase!=="idle")return;for(const claim of availableArguments(graph,flow.engine.snapshot()))flow.engine.dispatch({type:"ArgumentClaim",...claim});this.render();},6);
    this.sealLabel=ui.buttons([{id:"Break seal",label:"Hold seal for 1 second"}],()=>{const held=this.heldAt>=0&&getTime()-this.heldAt>=1;this.heldAt=-1;if(held)this.accuse();},7,undefined,()=>{if(this.phase==="idle")this.heldAt=getTime();})[0];
    ui.buttons([{id:"Cancel accusation",label:"Keep investigating"}],()=>{if(this.phase==="idle"&&flow.engine.snapshot().verdict!=="timeout")this.close();},6);
    flow.engine.onState.add(state=>this.onState(state));this.clue.objection.caseLid.onAction.add(action=>{if(action==="Accuse")this.open();});this.panel.enabled=false;
  }
  open():void {const state=this.cast.flow.engine.snapshot();if(state.verdict&&state.verdict!=="timeout")return;this.cast.flow.cancel();this.clue.objection.close();this.picked=this.clue.selected()||this.picked;this.opened=true;this.panel.enabled=true;this.showInvestigation(false);this.render();}
  private showInvestigation(value:boolean):void {const flow=this.cast.flow;flow.subtitles.getSceneObject().enabled=value;flow.chips.show(value);flow.verbs.show(value);this.clue.objection.caseLid.show(value);this.cast.getSceneObject().enabled=value;this.clue.objection.wallet.show(false);this.clue.notebook.show(false);}
  private close():void {this.opened=false;this.panel.enabled=false;this.showInvestigation(true);}
  private render():void {
    const graph=this.cast.flow.engine.graphRef(),state=this.cast.flow.engine.snapshot();
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
    const graph=this.cast.flow.engine.graphRef();this.opened=true;this.showInvestigation(false);this.panel.enabled=true;this.phase="reconstruction";this.began=getTime();this.frames=reconstructionBeats(graph,state);this.summary=endingSummary(graph,state);this.clue.envelope.enabled=false;this.clue.objection.tells.audio.silence(true);
    const score=scoreCase(graph,state);this.resultText=(state.verdict==="correct"?"CASE CLOSED":"THE CULPRIT ESCAPED")+"\n"+score.stars.map(star=>(star.earned?"★ ":"☆ ")+star.name).join("\n")+"\n"+score.deductions+" / "+score.required+" deductions\n"+"You: "+state.elapsedMinutes+" min · Par: "+score.minimumMinutes+"\n"+graph.caseId+"\nSeal "+graph.pitchHash;
    const hideRows=(root:SceneObject)=>{for(let i=0;i<root.getChildrenCount();i++){const child=root.getChild(i);if(child.name==="Button row")child.enabled=false;else hideRows(child);}};hideRows(this.panel);
    if(state.verdict==="wrong"){this.escapeActor=this.cast.flow.actorFor(graph.envelope.who)!.getSceneObject();this.escapeStart=this.escapeActor.getTransform().getWorldPosition();this.escapeDoor=this.cast.room.objectAnchor("O8").getTransform().getWorldPosition();this.escapeDoor.y=this.escapeStart.y;}
    const material=this.clue.objection.tells.lightMaterial.clone();material.mainPass.baseColor=new vec4(1,.94,.84,.8);
    for(const person of [...graph.cast.suspects,graph.cast.victim]){const ghost=uiObject(this.cast.room.getSceneObject(),"RoomscriptReconstruction_"+person.id);ghost.getTransform().setLocalScale(vec3.one().uniformScale(.75));const points=[new vec3(-18,0,0),new vec3(-23,85,0),new vec3(-12,110,0),new vec3(-12,145,0),new vec3(12,145,0),new vec3(12,110,0),new vec3(23,85,0),new vec3(18,0,0)];const tint=material.clone();this.ghostMaterials.set(person.id,tint);worldLines(ghost,"Memory silhouette",points.slice(1).map((p,i)=>[points[i],p] as [vec3,vec3]),tint,2.4);this.ghosts.set(person.id,ghost);ghost.enabled=false;}
  }
  /** Director-only capture hold; never changes engine time or verdict. */
  holdFreeze(seconds=20):void {if(this.frames[this.frame]?.kind==="freeze")this.holdUntil=getTime()+Math.min(20,Math.max(0,seconds));}
  private update():void {
    if(this.heldAt>=0&&this.phase==="idle")this.sealLabel.text="SEAL "+Math.min(100,Math.floor((getTime()-this.heldAt)*100))+"%";
    if(this.phase!=="reconstruction")return;if(this.holdUntil>getTime()){this.began+=getDeltaTime();return;}
    const elapsed=getTime()-this.began;let total=0,index=0;for(;index<this.frames.length-1;index++){total+=this.frames[index].durationSeconds;if(elapsed<total)break;}
    if(this.escapeStart){this.escapeActor.getTransform().setWorldPosition(vec3.lerp(this.escapeStart,this.escapeDoor,Math.min(1,elapsed/4)));if(elapsed>=4)this.escapeActor.enabled=false;}
    if(index!==this.frame){this.frame=index;const beat=this.frames[index],graph=this.cast.flow.engine.graphRef();
      this.title.text=beat.kind==="freeze"?beat.time+" — THE TRUTH":beat.kind==="stamp"?beat.caption:"RECONSTRUCTION / "+beat.kind.toUpperCase();
      this.body.text=wrapText(beat.kind==="resume"?this.summary.filter(line=>!line.speaker)[0]?.text||beat.caption:beat.caption,40);
      for(const [id,ghost] of this.ghosts){let mark=beat.positions?.[id];if(beat.kind==="claims"){const claim=beat.claims?.find(c=>c.suspect===id),zone=graph.room.zones.find(z=>z.id===claim?.zone);mark=zone?[zone.anchor[0],0,zone.anchor[2]+55]:undefined;}
        ghost.enabled=!!mark;if(mark)ghost.getTransform().setLocalPosition(new vec3(mark[0],mark[1],mark[2]));
        this.ghostMaterials.get(id)!.mainPass.baseColor=beat.kind==="claims"?new vec4(.247,.89,1,.8):id===graph.envelope.who?new vec4(1,.42,.35,.9):new vec4(1,.94,.84,.9);}
      this.clue.objection.tells.audio.play(beat.kind==="freeze"?"Objection":"ClockTick");
    }
    const length=this.frames.reduce((sum,b)=>sum+b.durationSeconds,0);
    if(elapsed>=length){this.phase="ending";this.panel.enabled=false;const result=uiObject(this.getSceneObject(),"RoomscriptResult");const ui=new PanelUI(result,66,66,1.65,new vec4(1,.94,.84,1));ui.text("Case title","MORNING EDITION / HARLOW",7,"title");ui.text("Result",this.resultText,27,"small");const report=ui.text("What happened","",18,"small");let page=0;const render=()=>{const line=this.summary[page];report.text=wrapText((line?.speaker?"WHAT THEY WERE HIDING\n":"WHAT HAPPENED\n")+(line?.text||"")+"\n"+(page+1)+" / "+this.summary.length,44);};ui.buttons([{id:"Ending previous",label:"Previous"},{id:"Ending next",label:"Next"}],id=>{page=(page+(id==="Ending next"?1:this.summary.length-1))%this.summary.length;render();},6);render();this.ghosts.forEach(g=>g.enabled=false);this.clue.objection.tells.audio.silence(false);this.clue.objection.tells.audio.play("Chime");}
  }  diagnostics():{phase:string;opened:boolean;picked:Hypothesis;result:string} {return {phase:this.phase,opened:this.opened,picked:{...this.picked},result:this.resultText};}
}
