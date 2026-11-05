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
  private state:GameState;private toastText:Text;private toastUntil=0;private wrenBusy=false;private wrenSequence=0;private inputBusy=false;
  onAwake():void {this.createEvent("OnStartEvent").bind(()=>this.start());}
  private start():void {
    if(!this.caseLid||!this.chips||!this.verbs||!this.notebook||!this.wallet||!this.audio||!this.engine){console.error("Roomscript: authored references not wired");return;}
    this.caseLid.build();this.chips.build();this.verbs.build();this.notebook.build();this.wallet.build();
    this.engine.onState.add(state=>{this.state=state;this.caseLid.setCounters(state.clockMinutes-state.elapsedMinutes,state.pips,state.hunches);this.caseLid.setTimeline(knowledgeTimeline(this.engine.graphRef(),state.knowledge).map(item=>item.time+" · "+item.text));for(const e of state.events.filter(e=>e.seq===state.lastSeq)){if(e.type==="deduction")this.toast("Deduction certified");else if(e.type==="evidenceCollected")this.toast("Memory collected");else if(e.type==="objectionCorrect")this.toast("Account refuted");}});
    this.engine.initialize();
    this.state=this.engine.snapshot();
    this.caseLid.onAction.add(action=>{
      if(action!=="Notebook"&&action!=="Evidence")return;
      this.interrogation.controlsBlocked=true;this.caseLid.show(false);this.chips.show(false);this.verbs.show(false);this.notebook.show(action==="Notebook");this.wallet.show(action==="Evidence");this.audio.play("ChalkScratch");});
    const close=()=>{this.interrogation.controlsBlocked=false;this.notebook.show(false);this.wallet.show(false);this.interrogation.controlsBlocked=false;this.caseLid.show(true);this.interrogation.restoreControls();};
    this.notebook.onClose.add(close);this.wallet.onClose.add(close);
    this.interrogation?.initialize();
    this.engine.onCaseChanged.add(()=>{this.caseLid.setTitle(this.engine.mode()==="preset"?"THE HARLOW TRUST":"SAME ROOM. NEW MURDER.");this.notebook.show(false);this.wallet.show(false);});
    this.audio.bindNarrative(this.engine,()=>this.interrogation.diagnostics().busy,id=>{const o=this.engine.graphRef().room.objects.find(o=>o.id===id);return o?this.engine.roomRoot.getTransform().getWorldTransform().multiplyPoint(new vec3(o.pos[0],o.pos[1],o.pos[2])):undefined;});
    this.audio.onNarrationSubtitle.add(({speaker,text})=>{if(!this.interrogation.diagnostics().busy)this.interrogation.subtitles.set(speaker,text);});
    this.storyMoments=new RoomscriptStoryMoments(this,this.engine,this.interrogation,this.caseLid,this.audio);
    this.notebook.onWren.add(()=>{this.notebook.show(false);void this.askWren("What do we know?");});
    const toast=uiObject(this.engine.player,"RoomscriptPeripheralToast");toast.getTransform().setLocalPosition(new vec3(25,-27,-110));this.toastText=new PanelUI(toast,35,7,1.15,new vec4(.25,.89,1,1),true,true).text("Toast","",5,"small");
    const tick=this.createEvent("DelayedCallbackEvent");tick.bind(()=>{if(this.state&&this.engine.investigationEnabled){const p=this.engine.roomRoot.getTransform().getInvertedWorldTransform().multiplyPoint(this.engine.player.getTransform().getWorldPosition()),sample=routeSample(this.state,[p.x,p.y,p.z],Math.floor(getTime()*1000));if(sample)this.engine.dispatch(sample);void this.pollInput();}if(this.toastText&&getTime()>this.toastUntil)this.toastText.text="";tick.reset(1);});tick.reset(1);
    this.caseLid.setMode(this.interrogation.availabilityLabel());this.interrogation.onAvailability.add(label=>this.caseLid.setMode(label));
    console.log("Roomscript: production interrogation ready");
  }
  private toast(text:string):void {if(!this.toastText)return;this.toastText.text=text;this.toastUntil=getTime()+2.5;this.audio.play("ToastTick");}
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
