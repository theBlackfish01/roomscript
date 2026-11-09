import {showItemEvidence} from "./Engine/game/ShowItem";
import {run10Questions} from "./Content/Run10Questions";
import {itemPicture,itemLabel} from "./RoomscriptItemPictures";
import {RoomscriptAudio} from "./RoomscriptAudio";
import {RoomscriptConversationRow} from "./RoomscriptConversationRow";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptLlmClient} from "./RoomscriptLlmClient";
import {RoomscriptTts} from "./RoomscriptTts";
import {RoomscriptSuspectActor} from "./RoomscriptSuspectActor";
import {RoomscriptSubtitleUI} from "./RoomscriptSubtitleUI";
import {RoomscriptQuestionUI} from "./RoomscriptQuestionUI";
import {Answer,GameState} from "./Engine/core/Types";
import {AnswerPipeline,AnswerTask,ChosenAnswer,InterrogationMode} from "./Engine/ai/AnswerPipeline";
import {TapeClient} from "./Engine/ai/Tape";
import {LlmError,CancellationSource} from "./Engine/ai/LlmPort";
import {presentedIntent,presentedQuestions} from "./Engine/perf/QuestionPresentation";
import {performanceMode} from "./Engine/game/Reducer";
import {Degradation} from "./Engine/ai/Degradation";
import {tellCue} from "./Engine/game/TellCue";
import {preferPreparedQuestions} from "./Engine/ai/ModelPolicy";
import {presentObject,presentGuest} from "./Engine/perf/PresentEvidence";

/** Production adapter. Engine actions precede performance; validated output is logged before speech. */
@component export class RoomscriptInterrogationController extends BaseScriptComponent {
  /** Modal room UI owns focus; proximity cannot open questions over it. */
  controlsBlocked=false;modalRow=false;
  row:RoomscriptConversationRow;readonly onAccuseRequested=new Event<void>();private selectionRequest=0;private intents:Promise<void>=Promise.resolve();
  private async waitForSpeech():Promise<void>{while(this.busy)await new Promise<void>(resolve=>{const e=this.createEvent("DelayedCallbackEvent");e.bind(()=>{this.removeEvent(e);resolve();});e.reset(.05);});await RoomscriptAudio.active?.speech.idle();}
  showRow(value:boolean):void {this.row?.show(value&&(!this.controlsBlocked||this.modalRow)&&this.engine.investigationEnabled);}
  private openAsk():void {if(this.busy||RoomscriptAudio.active?.speechBusy())return;this.row.choices("ask",this.choices().filter(c=>c.topic!=="free").slice(0,4).concat([{topic:"free",label:"Ask your own…",question:""}]).map(c=>({id:"Ask "+c.topic,label:c.label,choose:()=>{if(c.topic==="free")this.reviewQuestion("");else void this.askChip(c.topic);}})));}
  private openShow():void {const state=this.engine.snapshot(),graph=this.engine.graphRef();const ids=[...new Set(graph.evidence.filter(e=>state.knowledge.evidenceIds.includes(e.id)).map(e=>e.holder))];this.row.choices("show",ids.map(id=>({id:"Show "+id,label:itemLabel(id),picture:itemPicture(id),choose:()=>{void this.presentObjectTo(this.selected,id);}})));}
  @input @hint("Deterministic case owner") engine:RoomscriptEngineBridge;
  @input @hint("Gateway transport") client:RoomscriptLlmClient;
  @input @hint("Sentence audio player") tts:RoomscriptTts;
  @input @hint("Current suspect actor") actor:RoomscriptSuspectActor;
  @input @hint("Speaker-local subtitles") subtitles:RoomscriptSubtitleUI;
  @input @hint("Free question draft and correction") questions:RoomscriptQuestionUI;
  readonly onSpeaking=new Event<{suspect:string;statement:string|null;mode:InterrogationMode;seq:number}>();
  readonly onObjectRequested=new Event<void>();
  readonly onSuspectSelected=new Event<string>();
  readonly onAvailability=new Event<string>();
  private availability:Degradation;
  private actors=new Map<string,RoomscriptSuspectActor>();
  private pipeline:AnswerPipeline;private freePipeline:AnswerPipeline;private task:AnswerTask;private warming:CancellationSource;
  private selected="S2";private revision=0;private busy=false;private last:ChosenAnswer|null=null;private lastAudioMs:number|null=null;
  private questionPage=0;
  private speaking:{suspect:string;statement:string|null;mode:InterrogationMode;seq:number}|null=null;
  onAwake():void {this.createEvent("OnDestroyEvent").bind(()=>{this.warming?.cancel();this.cancel(true);});}
  initialize():void {
    if(this.pipeline)return;this.engine.initialize();this.subtitles.build();this.questions.build();
    this.row=new RoomscriptConversationRow(this,this.getSceneObject(),()=>this.openAsk(),()=>this.openShow(),()=>this.onAccuseRequested.invoke());
    this.createEvent("UpdateEvent").bind(()=>{this.row.speaking(this.busy||!!RoomscriptAudio.active?.speechBusy());if((this.controlsBlocked&&!this.modalRow)||!this.engine.investigationEnabled)this.row.show(false);this.subtitles.setSuppressed(this.row.diagnostics().visible&&!this.row.diagnostics().blocked);});
    this.rebuildPipeline();
    this.engine.onCaseChanged.add(()=>{this.warming?.cancel();this.cancel(true);this.last=null;this.lastAudioMs=null;this.questions.show(false);this.subtitles.set("NARRATOR","");this.modalRow=false;this.controlsBlocked=false;this.rebuildPipeline();this.selectSuspect(this.selected);});
    this.questions.onDraft.add(text=>this.reviewQuestion(text));
    this.questions.onSubmit.add(draft=>{this.questions.show(false);this.showQuestions();void this.askFree(draft.question,draft.topic);});
    this.questions.onClose.add(()=>this.showQuestions());
    this.tts.onAudioStarted.add(event=>{if(this.speaking){this.lastAudioMs=event.latencyMs;this.onSpeaking.invoke(this.speaking);this.speaking=null;}});
    this.tts.onSubtitle.add(text=>{const person=this.engine.graphRef().cast.suspects.find(s=>s.id===this.selected);this.subtitles.set(person?.name||this.selected,text);this.subtitles.untimed(text);});
    this.tts.onSubtitleAligned.add(text=>this.subtitles.reveal(text));
    this.engine.onState.add(state=>this.render(state));this.selectSuspect(this.actor.suspect);
  }
  diagnostics():{busy:boolean;suspect:string;last:ChosenAnswer|null;audioMs:number|null;offline:boolean;level:number} {return {busy:this.busy,suspect:this.selected,last:this.last,audioMs:this.lastAudioMs,offline:!this.client.canAnswerFree()&&(this.client.isOffline()||this.availability?.level===0),level:this.client.forceOffline?0:this.availability?.level??0};}
  private rebuildPipeline():void {
    const available=this.client.canAnswerFree();this.availability=new Degradation(!available,available);
    const caseId=this.engine.graphRef().caseId,caseMode=this.engine.mode();
    const liveFree={complete:(request:import("./Engine/ai/LlmPort").LlmRequest,token?:import("./Engine/ai/LlmPort").CancellationToken)=>this.client.completeFree(request,token)};
    // Both pipelines share occurrence numbering; cancellation belongs to each request token.
    const tape=new TapeClient({mode:"RECORD",clock:this.client.clock,live:liveFree,emit:event=>{if(this.engine.graphRef().caseId===caseId)this.engine.dispatch(event);},log:line=>console.log(line)});
    this.pipeline=new AnswerPipeline({firstFillerMs:1200,clock:this.client.clock,scheduler:this.client.scheduler,llm:tape,lineBank:this.engine.lineBank(),model:{provider:"gemini",model:"gemini-2.5-flash"},preferAuthored:()=>preferPreparedQuestions(caseMode,this.client.stageMode,this.client.forceOffline,this.availability.preferAuthored)});
    this.freePipeline=new AnswerPipeline({firstFillerMs:1200,clock:this.client.clock,scheduler:this.client.scheduler,llm:tape,lineBank:this.engine.lineBank(),model:{provider:"gemini",model:"gemini-2.5-flash"},preferAuthored:()=>!this.client.canAnswerFree()});
  }
  availabilityLabel():string{return this.client.stageMode?(this.client.canAnswerFree()?"Recorded voices / free questions":"Stage / bundled voices"):this.availability?.label||"Offline case / captions";}
  cancel(force=false):void {if(!force&&(this.busy||RoomscriptAudio.active?.speechBusy()))return;this.revision++;this.pipeline?.cancel();this.freePipeline?.cancel();if(force)this.tts?.stop();if(this.subtitles)this.subtitles.untimed(this.subtitles.text());this.busy=false;this.speaking=null;}
  selectSuspect(id:string):void {
    if(this.busy||RoomscriptAudio.active?.speechBusy()){const request=++this.selectionRequest,graph=this.engine.graphRef();void this.waitForSpeech().then(()=>{if(request===this.selectionRequest&&graph===this.engine.graphRef())this.selectSuspect(id);});return;}
    this.cancel();const graph=this.engine.graphRef();if(!graph.cast.suspects.some(s=>s.id===id))throw new Error("Unknown suspect");
    this.selected=id;this.questionPage=0;this.actor=this.actors.get(id)||this.actor;this.actor.suspect=id;this.tts.actor=this.actor;this.actor.applyState(this.engine.snapshot());this.render(this.engine.snapshot());this.showQuestions();this.onSuspectSelected.invoke(id);
    this.warming?.cancel();this.warming=new CancellationSource();void this.tts.precacheCurrent(this.warming.token);
  }
  registerActor(actor:RoomscriptSuspectActor):void {this.actors.set(actor.suspect,actor);}
  prepareAudioProbe(warm:boolean):void {this.warming?.cancel();this.tts.clearCacheForProbe();if(warm){this.warming=new CancellationSource();void this.tts.precacheCurrent(this.warming.token);}}
  actorFor(id:string):RoomscriptSuspectActor|undefined {return this.actors.get(id);}
  showQuestions():void {this.controlsBlocked=false;this.row?.close();this.showRow(true);}
  showAnswerControls():void {this.showRow(true);}
  restoreControls():void {this.controlsBlocked=false;const state=this.engine.snapshot();if(state.activeStatement&&state.activeSuspect===this.selected)this.showAnswerControls();else this.showQuestions();}
  private choices():{topic:string;label:string;question:string}[] {
    return run10Questions(this.engine.graphRef(),this.engine.snapshot(),this.selected).concat([{topic:"free",label:"Ask your own…",question:""}]);
  }
  reviewQuestion(text:string):void {const graph=this.engine.graphRef();
    const target=this.questions.getTransform(),row=this.row.root.getTransform();target.setWorldPosition(row.getWorldPosition());target.setWorldRotation(row.getWorldRotation());target.setWorldScale(vec3.one());
    this.controlsBlocked=true;this.questions.review(text,presentedIntent(graph,this.engine.snapshot(),this.selected,text).topic,this.choices().filter(c=>c.topic!=="free"));}
  async askChip(topic:string):Promise<void> {if(topic==="free"){this.reviewQuestion("");return;}const choice=this.choices().find(c=>c.topic===topic);if(choice)await this.ask(choice.question,"chip",topic);}
  /** Run 8: a memory photo held up to a suspect asks them about that object (an ordinary engine Ask). */
  presentObjectTo(suspect:string,objectId:string):Promise<boolean>{
    const graph=this.engine.graphRef(),next=this.intents.then(async()=>{await this.waitForSpeech();if(this.engine.graphRef()!==graph||this.engine.snapshot().verdict)return false;return this.presentNow(suspect,objectId);});this.intents=next.then(()=>{},()=>{});return next;
  }
  private async presentNow(suspect:string,objectId:string):Promise<boolean>{
    const graph=this.engine.graphRef();await this.waitForSpeech();if(this.engine.graphRef()!==graph||this.engine.snapshot().verdict)return false;
    if(suspect!==this.selected)this.selectSuspect(suspect);
    const state=this.engine.snapshot(),claim=state.activeSuspect===suspect?state.activeStatement:null,evidence=claim?showItemEvidence(graph,state,suspect,claim,objectId):graph.evidence.filter(e=>e.holder===objectId&&state.knowledge.evidenceIds.includes(e.id)).map(e=>e.id);
    if(!evidence.length)return false;
    if(!claim){const ask=presentObject(graph,state,suspect,objectId);if(!ask)return false;await this.askNow(ask.question,"chip",ask.topic);return true;}
    const result=this.engine.dispatch({type:"Object",suspect,statement:claim,evidence});
    const success=result.events.some(e=>e.seq===result.lastSeq&&e.type==="objectionCorrect");
    if(success){RoomscriptAudio.active.play("GlassShatter");this.actorFor(suspect)?.capturePose(result.suspects[suspect].layer>=2?"broken":"rattled",5);await this.perform("Answer the detective's evidence.","chip",this.topic(result));}
    else{const dismissal=graph.cast.suspects.find(s=>s.id===suspect);await RoomscriptAudio.active.narrate(suspect,"That proves nothing.");}
    console.log("SHOW_ITEM|"+JSON.stringify({suspect,object:objectId,success}));return true;
  }
  /** Run 8: pointing at another guest while facing a suspect asks about that guest. */
  async askAboutGuest(guest:string):Promise<boolean> {const ask=presentGuest(this.engine.graphRef(),this.engine.snapshot(),this.selected,guest);if(!ask)return false;
    console.log("POINT_GUEST|"+JSON.stringify({suspect:this.selected,guest,topic:ask.topic,kind:ask.kind}));if(ask.kind==="chip")await this.ask(ask.question,"chip",ask.topic);else await this.askFree(ask.question);return true;}
  async askFree(question:string,topic?:string):Promise<void> {const graph=this.engine.graphRef();
    await this.ask(question,"free",topic??presentedIntent(graph,this.engine.snapshot(),this.selected,question).topic);}
  private ask(question:string,kind:"chip"|"free",topic:string):Promise<void> {const graph=this.engine.graphRef(),suspect=this.selected;const next=this.intents.then(async()=>{await this.waitForSpeech();if(this.engine.graphRef()!==graph||this.engine.snapshot().verdict)return;this.selectSuspect(suspect);await this.askNow(question,kind,topic);});this.intents=next.catch(()=>{});return next;}
  private async askNow(question:string,kind:"chip"|"free",topic:string):Promise<void> {
    this.cancel();const state=this.engine.dispatch({type:"Ask",suspect:this.selected,topic,question});
    if(state.verdict)return;
    if(this.rejected(state)){this.subtitles.set("WREN",state.verdict?"The case is closed.":"Give this suspect some space.");return;}
    await this.perform(question,kind,topic);
  }
  private rejected(state:GameState):boolean {return state.events.some(event=>event.seq===state.lastSeq&&event.type==="rejected");}
  private topic(state:GameState):string {return this.engine.graphRef().statements.find(s=>s.id===state.activeStatement)?.topic || "unclear";}
  async perform(question:string,kind:"chip"|"free",topic:string):Promise<void> {
    const graph=this.engine.graphRef(),state=this.engine.snapshot(),suspect=this.selected,revision=this.revision;
    const derived=performanceMode(graph,state,suspect,topic);if(derived==="confession")return;
    const mode=derived as InterrogationMode,began=this.client.clock.nowMs();let filler:Promise<boolean>|null=null;this.busy=true;this.lastAudioMs=null;
    const isCurrent=()=>revision===this.revision&&this.engine.snapshot().elapsedMinutes===state.elapsedMinutes&&this.engine.snapshot().activeStatement===state.activeStatement;
    this.task=(kind==="free"?this.freePipeline:this.pipeline).start({graph,state,suspect,question,kind,topic,mode},{
      detective:()=>{this.subtitles.set("DETECTIVE",question);},
      rejected:event=>{event.codes.forEach(code=>this.availability.failure(code));if(!this.client.localBridgeAvailable()&&!this.client.hasCredentials("gemini")&&!this.client.hasCredentials("openai"))this.availability.offline();this.onAvailability.invoke(this.availabilityLabel());},
      filler:event=>{if(isCurrent()&&this.client.clock.nowMs()-began>=1200&&!filler&&this.tts.cached(event.answer.line)){if(this.admit(event.answer,"filler"))filler=this.tts.speak(event.answer.line,undefined,this.task?.token,began);}}
    });
    const task=this.task;
    try {
      const chosen=await task.promise;if(filler)await filler;if(!isCurrent())return;
      if(chosen.origin==="model")this.availability.success();
      if(!this.admit(chosen.answer,chosen.mode))return;
      this.last=chosen;this.speaking={suspect,statement:state.activeStatement,mode:chosen.mode,seq:state.lastSeq};
      const person=state.suspects[suspect],take=person.layer>=2||person.composure<=0?"broken":person.layer>0||person.composure/person.composureMax<.7?"rattled":"steady";
      const spoke=await this.tts.speak(chosen.answer.line,undefined,task.token,began,take,!!tellCue(graph,state,state.lastSeq,suspect,chosen.mode),kind==="free"?"free":"standard");
      if(!spoke&&isCurrent()&&this.speaking){this.onSpeaking.invoke(this.speaking);this.speaking=null;}
      console.log("INTERROGATION|"+JSON.stringify({origin:chosen.origin,textMs:chosen.latencyMs,audioMs:this.lastAudioMs,rejections:chosen.rejectionCount,mode:chosen.mode}));
    } catch(error) {if(!(error instanceof LlmError)||error.code!=="cancelled")console.log("INTERROGATION|safe_fallback");}
    finally {if(revision===this.revision){this.busy=false;this.speaking=null;}}
  }
  private admit(answer:Answer,mode:InterrogationMode):boolean {
    const state=this.engine.dispatch({type:"LineSpoken",suspect:this.selected,key:"performance-"+this.revision,answer,mode});
    const spoken=state.events.find(event=>event.seq===state.lastSeq&&event.type==="lineSpoken");
    if(!spoken)return false;const person=this.engine.graphRef().cast.suspects.find(s=>s.id===this.selected)!;
    return true;
  }
  private render(state:GameState):void {
    this.row?.canShow(state.knowledge.evidenceIds.length>0);
    const graph=this.engine.graphRef(),person=graph.cast.suspects.find(s=>s.id===this.selected)!;

  }
}
