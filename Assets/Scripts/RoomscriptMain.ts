import {placeReadingPanel} from "./RoomscriptReadingPanel";
import {FrameVisibleWindow} from "./Engine/perf/FrameVisibleWindow";
import {peripheralFeedback} from "./Engine/game/PeripheralFeedback";
import {RoomscriptStoryMoments} from "./RoomscriptStoryMoments";
import {RoomscriptCaseLidUI} from "./RoomscriptCaseLidUI";
import {RoomscriptChipBarUI} from "./RoomscriptChipBarUI";
import {RoomscriptVerbBarUI} from "./RoomscriptVerbBarUI";
import {RoomscriptNotepadUI} from "./RoomscriptNotepadUI";
import {RoomscriptEvidenceWalletUI} from "./RoomscriptEvidenceWalletUI";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptInterrogationController} from "./RoomscriptInterrogationController";
import {knowledgeTimeline} from "./Engine/game/CaseClarity";
import {GameState} from "./Engine/core/Types";
import {routeSample} from "./Engine/game/RouteReplay";
import {buildKnowledgeBrief,answerWren,admitWrenChoice} from "./Engine/game/WrenKnowledge";
import {localBridgeAvailable,localBridgePost} from "./RoomscriptLocalBridge";
import {PanelUI,uiObject} from "./RoomscriptPanelUI";
import {withDeadline} from "./Engine/ai/Deadlines";
import {RoomscriptCaseBoard} from "./RoomscriptCaseBoard";
import {RoomscriptWrenHints} from "./RoomscriptWrenHints";
import {RoomscriptWindowStorm} from "./RoomscriptWindowStorm";
import {RoomscriptEvidenceThreads} from "./RoomscriptEvidenceThreads";
import {RoomscriptRoomBinding} from "./RoomscriptRoomBinding";
import {RoomscriptObjectReplay} from "./RoomscriptObjectReplay";
import {RoomscriptHandMoments} from "./RoomscriptHandMoments";
import {RoomscriptNextGlow} from "./RoomscriptNextGlow";
import {RoomscriptOpeningController} from "./RoomscriptOpeningController";
import {RoomscriptClosingController} from "./RoomscriptClosingController";
import {RoomscriptCastingController} from "./RoomscriptCastingController";
import {RoomscriptSpatialObjectionController} from "./RoomscriptSpatialObjectionController";
/** Scene wiring only. Engine bridge will own all case state; UI receives values/events. */
@component export class RoomscriptMain extends BaseScriptComponent {
  @ui.group_start("References")
  @input @hint("Case HUD") caseLid:RoomscriptCaseLidUI;
  @input @hint("Question chips") chips:RoomscriptChipBarUI;
  @input @hint("Statement and verbs") verbs:RoomscriptVerbBarUI;
  @input @hint("Notebook") notebook:RoomscriptNotepadUI;
  @input @hint("Evidence wallet") wallet:RoomscriptEvidenceWalletUI;
  @input @hint("Audio cues and music") audio:RoomscriptAudio;
  @input @hint("Deterministic case owner") engine:RoomscriptEngineBridge;
  @input @hint("Production question and speech flow") interrogation:RoomscriptInterrogationController;
  @ui.group_end
  storyMoments:RoomscriptStoryMoments;
  caseBoard:RoomscriptCaseBoard;wren:RoomscriptWrenHints;nextGlow:RoomscriptNextGlow;
  storm:RoomscriptWindowStorm;
  threads:RoomscriptEvidenceThreads;
  replays:RoomscriptObjectReplay;
  hands:RoomscriptHandMoments;
  private state:GameState;private toastText:Text;private toastWindow=new FrameVisibleWindow();private wrenBusy=false;private wrenSequence=0;private inputBusy=false;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.start());this.createEvent("UpdateEvent").bind(()=>{if(this.toastText&&this.toastWindow.active&&!this.toastWindow.advance(getDeltaTime()))this.toastText.text="";});}
  private start():void {
    if(!this.caseLid||!this.chips||!this.verbs||!this.notebook||!this.wallet||!this.audio||!this.engine){console.error("Roomscript: authored references not wired");return;}
    this.caseLid.build();this.caseLid.onSound=cue=>this.audio.play(cue);this.chips.build();this.verbs.build();this.notebook.build();this.wallet.build();
    this.engine.onState.add(state=>{this.state=state;this.caseLid.setCounters(state.clockMinutes-state.elapsedMinutes,state.pips,state.hunches);this.caseLid.setTimeline(knowledgeTimeline(this.engine.graphRef(),state.knowledge).map(item=>item.time+" · "+item.text));const message=peripheralFeedback(state.events,state.lastSeq);if(message)this.toast(message);});
    this.engine.initialize();
    this.state=this.engine.snapshot();
    this.caseLid.onAction.add(action=>{
      if(action!=="Notebook"&&action!=="Evidence")return;
      if(action==="Notebook"){const faces=this.engine.graphRef().cast.suspects.map(s=>this.interrogation.actorFor(s.id)).filter(a=>!!a).map(a=>a.getTransform().getWorldPosition().add(new vec3(0,a.heights().face,0)));placeReadingPanel(this.notebook.getSceneObject(),this.interrogation.actor.camera,this.notebook.width,54,this.engine.roomRoot.getTransform().getWorldPosition().y,faces);}
      this.interrogation.controlsBlocked=true;this.caseLid.show(false);this.chips.show(false);this.verbs.show(false);this.notebook.show(action==="Notebook");this.wallet.show(action==="Evidence");this.audio.play("ChalkScratch");});
    const close=()=>{this.interrogation.controlsBlocked=false;this.notebook.show(false);this.wallet.show(false);this.interrogation.controlsBlocked=false;this.caseLid.show(true);this.interrogation.restoreControls();};
    this.notebook.onClose.add(close);this.wallet.onClose.add(close);
    this.interrogation?.initialize();
    this.engine.onCaseChanged.add(()=>{this.caseLid.setTitle(this.engine.mode()==="preset"?"THE HARLOW TRUST":"SAME ROOM. NEW MURDER.");this.notebook.show(false);this.wallet.show(false);});
    this.audio.bindNarrative(this.engine,()=>this.interrogation.diagnostics().busy,id=>{const o=this.engine.graphRef().room.objects.find(o=>o.id===id);return o?this.engine.roomRoot.getTransform().getWorldTransform().multiplyPoint(new vec3(o.pos[0],o.pos[1],o.pos[2])):undefined;});
    this.audio.onNarrationSubtitle.add(({speaker,text})=>{if(!this.interrogation.diagnostics().busy)this.interrogation.subtitles.set(speaker,text);});
    this.audio.onNarrationSubtitleAligned.add(({speaker,text,fullText})=>{if(this.interrogation.diagnostics().busy)return;const subtitles=this.interrogation.subtitles;if(subtitles.fullText()!==fullText)subtitles.set(speaker,fullText);subtitles.reveal(text);});
    this.storm=new RoomscriptWindowStorm(this,this.engine,this.audio);
    this.wren=new RoomscriptWrenHints(this,this.engine,(cue,at)=>{if(at)this.audio.playAt(cue,at);else this.audio.play(cue);});
    this.caseBoard=new RoomscriptCaseBoard(this,this.engine,this.interrogation,(cue,at)=>{if(at)this.audio.playAt(cue,at);else this.audio.play(cue);});
    const roomBinding=this.engine.roomRoot.getComponent(RoomscriptRoomBinding.getTypeName()) as RoomscriptRoomBinding;
    if(roomBinding)this.replays=new RoomscriptObjectReplay(this,this.engine,this.interrogation,roomBinding,(cue,at)=>this.audio.playAt(cue,at));
    if(roomBinding)this.threads=new RoomscriptEvidenceThreads(this,this.engine,this.interrogation,roomBinding,()=>this.caseBoard?.root.enabled?this.caseBoard.root.getTransform().getWorldPosition():null,(cue,at)=>this.audio.playAt(cue,at));
    {let objection:RoomscriptSpatialObjectionController|null=null;const find=(o:SceneObject):SceneObject|null=>{if(o.name==="RoomscriptObjection")return o;for(let i=0;i<o.getChildrenCount();i++){const f=find(o.getChild(i));if(f)return f;}return null;};const node=find(this.getSceneObject());if(node)objection=node.getComponent(RoomscriptSpatialObjectionController.getTypeName()) as RoomscriptSpatialObjectionController;
      if(roomBinding)this.hands=new RoomscriptHandMoments(this,this.engine,this.interrogation,roomBinding,objection,()=>this.storyMoments?.diagnostics().active==="blackout",()=>this.caseBoard?.root.enabled?this.caseBoard.root.getTransform().getWorldPosition():null,(cue,at)=>{if(at)this.audio.playAt(cue,at);else this.audio.play(cue);});}
    this.storyMoments=new RoomscriptStoryMoments(this,this.engine,this.interrogation,this.caseLid,this.audio);
    this.nextGlow=new RoomscriptNextGlow(this,this.engine,this.interrogation,this.caseLid);
    this.nextGlow.blocked=()=>RoomscriptOpeningController.current?.filmMode?"film":RoomscriptCastingController.current?.running?"casting":RoomscriptClosingController.current?.diagnostics().opened?"accusation":this.storyMoments?.diagnostics().active?"story "+this.storyMoments.diagnostics().active:this.notebook?.getSceneObject().enabled?"notebook":this.wallet?.getSceneObject().enabled?"evidence":"";
    this.storm.isBlackout=()=>this.storyMoments?.diagnostics().active==="blackout";
    this.notebook.onWren.add(()=>{this.notebook.show(false);void this.askWren("What do we know?");});
    const toast=uiObject(this.engine.player,"RoomscriptPeripheralToast");toast.getTransform().setLocalPosition(new vec3(25,-27,-110));this.toastText=new PanelUI(toast,35,7,1.15,new vec4(.25,.89,1,1),true,true).text("Toast","",5,"small");
    const tick=this.createEvent("DelayedCallbackEvent");tick.bind(()=>{if(this.state&&this.engine.investigationEnabled){const p=this.engine.roomRoot.getTransform().getInvertedWorldTransform().multiplyPoint(this.engine.player.getTransform().getWorldPosition()),sample=routeSample(this.state,[p.x,p.y,p.z],Math.floor(getTime()*1000));if(sample)this.engine.dispatch(sample);void this.pollInput();}tick.reset(1);});tick.reset(1);
    this.caseLid.setMode(this.interrogation.availabilityLabel());this.interrogation.onAvailability.add(label=>this.caseLid.setMode(label));
    console.log("Roomscript: production interrogation ready");
  }
  private toast(text:string):void {if(!this.toastText)return;const playTick=this.toastWindow.show(text);this.toastText.text=text;if(playTick)this.audio.play("ToastTick");}
  private async pollInput():Promise<void>{if(this.state?.verdict||this.interrogation.controlsBlocked||this.inputBusy||this.wrenBusy||this.interrogation.diagnostics().busy||this.interrogation.client.forceOffline||!localBridgeAvailable())return;this.inputBusy=true;try{const input=await withDeadline(()=>localBridgePost("input-next",{}),5000,this.interrogation.client.clock);if(typeof input.question==="string"&&input.question.trim()){if(input.target==="wren")await this.askWren(input.question);else await this.interrogation.askFree(input.question);}}catch{}finally{this.inputBusy=false;}}
  async askWren(question:string):Promise<void> {
    if(this.wrenBusy||!this.engine.investigationEnabled||this.engine.snapshot().verdict)return;
    this.wrenBusy=true;const graph=this.engine.graphRef(),brief=buildKnowledgeBrief(graph,this.state.knowledge),key="wren-"+(++this.wrenSequence),began=Date.now();let choice=answerWren(brief,question);
    try {
      try {if(this.interrogation.client.canAnswerFree()){
        const response=await withDeadline(()=>this.interrogation.client.completeFree({provider:"gemini",model:"gemini-2.5-flash",promptVersion:"wren-knowledge-v1",messages:[{role:"system",content:'Choose one supplied option to answer the detective. Return ONLY JSON {"optionId":"..."}. Do not infer hidden facts. Heard accounts are claims, not certified truth.'},{role:"user",content:JSON.stringify({question,knowledge:brief})}]}),25000,this.interrogation.client.clock);
        if(this.engine.graphRef()!==graph)return;
        // A late response is still auditable, including after sealing, but cannot reopen presentation.
        this.engine.dispatch({type:"LlmOutput",key,occurrence:1,source:"live",response,latencyMs:Date.now()-began,at:began});
        try{choice=admitWrenChoice(brief,JSON.parse(response.content))||choice;}catch{}
      }}catch{if(this.engine.graphRef()===graph&&!this.engine.snapshot().verdict)this.toast("Wren is offline");}
      if(this.engine.graphRef()!==graph||this.engine.snapshot().verdict||!this.engine.investigationEnabled)return;
      const current=buildKnowledgeBrief(graph,this.state.knowledge);choice=admitWrenChoice(current,{optionId:choice.id})||answerWren(current,question);
      const state=this.engine.dispatch({type:"WrenSpoken",key,optionId:choice.id}),spoken=state.events.find(e=>e.seq===state.lastSeq&&e.type==="wrenSpoken");
      if(spoken?.text){this.interrogation.subtitles.set("WREN",spoken.text);await this.audio.narrateAdmittedWren(this.engine,this.interrogation.client,key);}
      if(this.engine.graphRef()!==graph||this.engine.snapshot().verdict||!this.engine.investigationEnabled)return;
      this.interrogation.controlsBlocked=false;this.caseLid.show(true);this.interrogation.restoreControls();
    }finally{this.wrenBusy=false;}
  }
}
