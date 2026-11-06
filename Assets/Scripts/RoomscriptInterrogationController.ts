import {placeReadingPanel} from "./RoomscriptReadingPanel";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {RoomscriptEngineBridge} from "./RoomscriptEngineBridge";
import {RoomscriptLlmClient} from "./RoomscriptLlmClient";
import {RoomscriptTts} from "./RoomscriptTts";
import {RoomscriptSuspectActor} from "./RoomscriptSuspectActor";
import {RoomscriptChipBarUI} from "./RoomscriptChipBarUI";
import {RoomscriptVerbBarUI} from "./RoomscriptVerbBarUI";
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

/** Production adapter. Engine actions precede performance; validated output is logged before speech. */
@component export class RoomscriptInterrogationController extends BaseScriptComponent {
  /** Modal room UI owns focus; proximity cannot open questions over it. */
  controlsBlocked=false;
  @input @hint("Deterministic case owner") engine:RoomscriptEngineBridge;
  @input @hint("Gateway transport") client:RoomscriptLlmClient;
  @input @hint("Sentence audio player") tts:RoomscriptTts;
  @input @hint("Current suspect actor") actor:RoomscriptSuspectActor;
  @input @hint("Question chip UI") chips:RoomscriptChipBarUI;
  @input @hint("Canonical statement and verbs") verbs:RoomscriptVerbBarUI;
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
  onAwake():void {this.createEvent("OnDestroyEvent").bind(()=>{this.warming?.cancel();this.cancel();});}
  initialize():void {
    if(this.pipeline)return;this.engine.initialize();this.chips.build();this.verbs.build();this.subtitles.build();this.questions.build();
    this.rebuildPipeline();
    this.engine.onCaseChanged.add(()=>{this.warming?.cancel();this.cancel();this.last=null;this.lastAudioMs=null;this.questions.show(false);this.chips.show(true);this.verbs.show(true);this.subtitles.set("WREN","A new case. Which guest will you question?");this.rebuildPipeline();this.selectSuspect(this.selected);});
    this.chips.onQuestion.add(topic=>{if(topic==="more"){this.questionPage=(this.questionPage+1)%Math.max(1,Math.ceil(this.choices().length/3));this.render(this.engine.snapshot());}else if(topic==="free")this.reviewQuestion("");else void this.askChip(topic);});
    this.questions.onDraft.add(text=>this.reviewQuestion(text));
    this.questions.onSubmit.add(draft=>{this.questions.show(false);this.showQuestions();void this.askFree(draft.question,draft.topic);});
    this.questions.onClose.add(()=>this.showQuestions());
    this.verbs.onVerb.add(verb=>{if(verb==="Questions"){this.showQuestions();return;}if(verb==="Object"){this.onObjectRequested.invoke();return;}this.cancel();
      const state=this.engine.dispatch({type:verb==="Press"?"Press":"Believe",suspect:this.selected});
      if(verb==="Press"&&!this.rejected(state))void this.perform("Answer the detective's challenge.","chip",this.topic(state));});
    this.tts.onAudioStarted.add(event=>{if(this.speaking){this.lastAudioMs=event.latencyMs;this.onSpeaking.invoke(this.speaking);this.speaking=null;}});
    this.tts.onSubtitle.add(text=>this.subtitles.untimed(text));
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
    this.pipeline=new AnswerPipeline({clock:this.client.clock,scheduler:this.client.scheduler,llm:tape,lineBank:this.engine.lineBank(),model:{provider:"gemini",model:"gemini-2.5-flash"},preferAuthored:()=>preferPreparedQuestions(caseMode,this.client.stageMode,this.client.forceOffline,this.availability.preferAuthored)});
    this.freePipeline=new AnswerPipeline({clock:this.client.clock,scheduler:this.client.scheduler,llm:tape,lineBank:this.engine.lineBank(),model:{provider:"gemini",model:"gemini-2.5-flash"},preferAuthored:()=>!this.client.canAnswerFree()});
  }
  availabilityLabel():string{return this.client.stageMode?(this.client.canAnswerFree()?"Recorded voices / free questions":"Stage / bundled voices"):this.availability?.label||"Offline case / captions";}
  cancel():void {this.revision++;this.pipeline?.cancel();this.freePipeline?.cancel();this.tts?.stop();if(this.subtitles)this.subtitles.untimed(this.subtitles.text());this.busy=false;this.speaking=null;}
  selectSuspect(id:string):void {
    this.cancel();const graph=this.engine.graphRef();if(!graph.cast.suspects.some(s=>s.id===id))throw new Error("Unknown suspect");
    this.selected=id;this.questionPage=0;this.actor=this.actors.get(id)||this.actor;this.actor.suspect=id;this.tts.actor=this.actor;this.actor.applyState(this.engine.snapshot());this.render(this.engine.snapshot());this.showQuestions();this.onSuspectSelected.invoke(id);
    this.warming?.cancel();this.warming=new CancellationSource();void this.tts.precacheCurrent(this.warming.token);
  }
  registerActor(actor:RoomscriptSuspectActor):void {this.actors.set(actor.suspect,actor);}
  prepareAudioProbe(warm:boolean):void {this.warming?.cancel();this.tts.clearCacheForProbe();if(warm){this.warming=new CancellationSource();void this.tts.precacheCurrent(this.warming.token);}}
  actorFor(id:string):RoomscriptSuspectActor|undefined {return this.actors.get(id);}
  showQuestions():void {this.controlsBlocked=false;this.chips.show(true);this.verbs.show(false);}
  showAnswerControls():void {this.chips.show(false);this.verbs.show(true);}
  restoreControls():void {this.controlsBlocked=false;const state=this.engine.snapshot();if(state.activeStatement&&state.activeSuspect===this.selected)this.showAnswerControls();else this.showQuestions();}
  private choices():{topic:string;label:string;question:string}[] {
    return presentedQuestions(this.engine.graphRef(),this.engine.snapshot(),this.selected).concat([{topic:"free",label:"Ask anything",question:""}]);
  }
  reviewQuestion(text:string):void {const graph=this.engine.graphRef();
    if(!this.questions.getSceneObject().enabled){const faces=graph.cast.suspects.map(s=>this.actorFor(s.id)).filter(a=>!!a).map(a=>a.getTransform().getWorldPosition().add(new vec3(0,145,0)));placeReadingPanel(this.questions.getSceneObject(),this.actor.camera,this.questions.width,39,this.engine.roomRoot.getTransform().getWorldPosition().y,faces);}
    this.controlsBlocked=true;this.questions.review(text,presentedIntent(graph,this.engine.snapshot(),this.selected,text).topic,this.choices().filter(c=>c.topic!=="free"));this.chips.show(false);this.verbs.show(false);}
  async askChip(topic:string):Promise<void> {if(topic==="free"){this.reviewQuestion("");return;}const choice=this.choices().find(c=>c.topic===topic);if(choice)await this.ask(choice.question,"chip",topic);}
  async askFree(question:string,topic?:string):Promise<void> {const graph=this.engine.graphRef();
    await this.ask(question,"free",topic??presentedIntent(graph,this.engine.snapshot(),this.selected,question).topic);}
  private async ask(question:string,kind:"chip"|"free",topic:string):Promise<void> {
    this.cancel();const state=this.engine.dispatch({type:"Ask",suspect:this.selected,topic,question});
    if(this.rejected(state)){this.subtitles.set("WREN",state.verdict?"The case is closed.":"Give this suspect some space.");return;}
    await this.perform(question,kind,topic);
  }
  private rejected(state:GameState):boolean {return state.events.some(event=>event.seq===state.lastSeq&&event.type==="rejected");}
  private topic(state:GameState):string {return this.engine.graphRef().statements.find(s=>s.id===state.activeStatement)?.topic || "unclear";}
  async perform(question:string,kind:"chip"|"free",topic:string):Promise<void> {
    const graph=this.engine.graphRef(),state=this.engine.snapshot(),suspect=this.selected,revision=this.revision;
    const derived=performanceMode(graph,state,suspect,topic);if(derived==="confession")return;
    const mode=derived as InterrogationMode,began=this.client.clock.nowMs();this.busy=true;this.lastAudioMs=null;
    const isCurrent=()=>revision===this.revision&&this.engine.snapshot().elapsedMinutes===state.elapsedMinutes&&this.engine.snapshot().activeStatement===state.activeStatement;
    this.task=(kind==="free"?this.freePipeline:this.pipeline).start({graph,state,suspect,question,kind,topic,mode},{
      detective:()=>{this.subtitles.set("DETECTIVE",question);this.chips.setTopic(this.choices().find(c=>c.topic===topic)?.label||topic);},
      rejected:event=>{event.codes.forEach(code=>this.availability.failure(code));if(!this.client.localBridgeAvailable()&&!this.client.hasCredentials("gemini")&&!this.client.hasCredentials("openai"))this.availability.offline();this.onAvailability.invoke(this.availabilityLabel());},
      filler:event=>{if(isCurrent()){this.admit(event.answer,"filler");if(this.tts.cached(event.answer.line))void this.tts.speak(event.answer.line,undefined,this.task?.token,began);}}
    });
    const task=this.task;
    try {
      const chosen=await task.promise;if(!isCurrent())return;
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
    this.subtitles.set(person.name,spoken.text!);if(mode!=="filler")this.showAnswerControls();return true;
  }
  private render(state:GameState):void {
    const graph=this.engine.graphRef(),person=graph.cast.suspects.find(s=>s.id===this.selected)!;
    this.chips.setPerson(person.name);const choices=this.choices();this.questionPage=Math.min(this.questionPage,Math.max(0,Math.ceil(choices.length/3)-1));this.chips.setQuestions(choices.slice(this.questionPage*3,this.questionPage*3+3));this.chips.setPage(this.questionPage,Math.ceil(choices.length/3));
    this.verbs.setClaim(state.activeSuspect===this.selected?graph.statements.find(s=>s.id===state.activeStatement)?.canonical||"Ask a question to file a statement.":"Ask a question to file a statement.");
  }
}
